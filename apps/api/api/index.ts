import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { execSync } from 'child_process';
import express from 'express';

const expressApp = express();
let appInitialized = false;

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
        origin: process.env.CORS_ORIGIN || ['http://localhost:5173', 'http://localhost:3000'],
        credentials: true,
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
    await initApp();
    expressApp(req, res);
}
