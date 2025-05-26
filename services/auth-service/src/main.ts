// services/auth-service/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);

  app.setGlobalPrefix('api/v1'); // Prefix all routes, e.g., /api/v1/auth/login

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true, // Allows for type conversion for path/query params
      },
    }),
  );

  await app.listen(port);
  Logger.log(`🚀 Auth Service is running on: http://localhost:${port}/api/v1`, 'Bootstrap');
}
bootstrap();