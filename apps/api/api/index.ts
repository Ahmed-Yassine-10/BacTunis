import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import express from 'express';

const expressApp = express();
let appInitialized = false;

async function initApp() {
    if (appInitialized) return;

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
