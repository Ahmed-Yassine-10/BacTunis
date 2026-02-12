import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // Serve uploaded files statically
    app.useStaticAssets(join(process.cwd(), 'uploads'), {
        prefix: '/uploads/',
    });

    // Enable CORS
    app.enableCors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // API prefix
    app.setGlobalPrefix('api');

    // Swagger documentation
    const config = new DocumentBuilder()
        .setTitle('BacTunis API')
        .setDescription('API pour la plateforme éducative BacTunis')
        .setVersion('1.0')
        .addBearerAuth()
        .addTag('auth', 'Authentification')
        .addTag('students', 'Gestion des élèves')
        .addTag('planning', 'Planification et emploi du temps')
        .addTag('ai', 'Assistant IA')
        .addTag('subjects', 'Matières et contenus')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    const port = process.env.PORT || 3001;
    await app.listen(port);

    console.log(`🚀 BacTunis API running on http://localhost:${port}`);
    console.log(`📚 Documentation: http://localhost:${port}/docs`);
}

bootstrap();
