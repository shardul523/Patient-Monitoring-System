import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthApiModule } from './auth/auth.module';
import { PatientsApiModule } from './patients/patients.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    AuthApiModule,
    PatientsApiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}