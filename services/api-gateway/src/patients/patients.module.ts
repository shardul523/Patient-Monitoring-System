import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PatientsController, AppointmentsController } from './patients.controller';
import { PatientsService } from './patients.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [PatientsController, AppointmentsController],
  providers: [PatientsService],
})
export class PatientsApiModule {}