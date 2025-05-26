// services/api-gateway/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service' // We'll create this service

@Module({
  imports: [
    ConfigModule, // Ensure ConfigModule is available
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        timeout: configService.get<number>('HTTP_TIMEOUT', 5000), // Default timeout
        maxRedirects: configService.get<number>('HTTP_MAX_REDIRECTS', 5),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService], // Add AuthService
})
export class AuthApiModule {} // Renamed to avoid conflict if you have a root AuthModule