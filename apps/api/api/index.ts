import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { execSync } from 'child_process';
import express from 'express';

const expressApp = express();
let appInitialized = false;

function isOriginAllowed(origin: string | undefined): boolean {
    if (!origin) return true;
    const allowed = process.env.CORS_ORIGIN || '';
    // Allow exact match, Vercel preview URLs, and localhost
    if (allowed && origin === allowed) return true;
    if (origin.includes('vercel.app')) return true;
    if (origin.includes('localhost')) return true;
    return false;
}

async function initApp() {
    if (appInitialized) return;

    // Auto-push database schema on first cold start
    try {
        console.log('Pushing database schema...');
        execSync('npx prisma db push --accept-data-loss --skip-generate', {
            cwd: __dirname + '/..',
            stdio: 'inherit',
            timeout: 25000,
        });
        console.log('Database schema pushed successfully');
    } catch (e) {
        console.error('Warning: prisma db push failed, tables may already exist:', e);
    }

    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
        logger: ['error', 'warn', 'log'],
    });

    app.enableCors({
        origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
            callback(null, isOriginAllowed(origin));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    app.setGlobalPrefix('api');

    await app.init();
    appInitialized = true;
}

export default async function handler(req: any, res: any) {
    // Handle preflight OPTIONS before NestJS init (fast response)
    if (req.method === 'OPTIONS') {
        const origin = req.headers.origin;
        if (isOriginAllowed(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin || '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Max-Age', '86400');
        }
        return res.status(204).end();
    }

    await initApp();
    expressApp(req, res);
}
