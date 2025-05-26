import { IsNotEmpty, IsUUID, IsDateString, IsInt, Min, Max, IsOptional, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsNotEmpty()
  @IsUUID()
  patientId: string;

  @IsNotEmpty()
  @IsUUID()
  doctorId: string;

  @IsNotEmpty()
  @IsDateString()
  appointmentDateTime: string;

  @IsNotEmpty()
  @IsInt()
  @Min(15)
  @Max(240)
  durationMinutes: number;

  @IsOptional()
  @IsString()
  reasonForVisit?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}