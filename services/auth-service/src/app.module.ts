// services/auth-service/src/app.module.ts
import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigModule available globally
      envFilePath: '.env', // Specifies the .env file
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger(TypeOrmModule.name);
        const dbHost = configService.get<string>('DB_HOST');
        logger.log(`Database host from env: ${dbHost}`); // Log the host

        return {
          type: 'postgres',
          host: dbHost,
          port: parseInt(configService.get<string>('DB_PORT', '5432'), 10),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_DATABASE'),
          entities: [User], // Or [__dirname + '/../**/*.entity{.ts,.js}']
          synchronize: configService.get<string>('NODE_ENV') !== 'production', // true for dev, false for prod
          autoLoadEntities: true, // Recommended for microservices
          logging: configService.get<string>('NODE_ENV') !== 'production' ? ['query', 'error'] : ['error'], // More verbose logging in dev
        };
      },
    }),
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController], // Keep basic health check
  providers: [AppService],
})
export class AppModule {}