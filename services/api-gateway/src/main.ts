// services/api-gateway/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000; // Use environment variable

  app.enableCors({
    origin: (origin, cb) => {
      const allowedOrigins = [
        'http://localhost:5173',
      ]

      if (!origin || allowedOrigins.includes(origin)) cb(null, true);
      else cb(new Error('Not allowed by CORS'))
    },
    methods: 'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS',
  })

  app.setGlobalPrefix('api/v1'); // Optional: prefix all routes with /api

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strip properties that do not have any decorators
    forbidNonWhitelisted: true, // Throw an error if non-whitelisted values are provided
    transform: true, // Automatically transform payloads to DTO instances
  }));

  await app.listen(port);
  Logger.log(`🚀 API Gateway is running on: http://localhost:${port}/api`, 'Bootstrap');
}
bootstrap();