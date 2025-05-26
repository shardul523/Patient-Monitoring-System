import { Injectable, NotFoundException, BadRequestException, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, IsNull } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentQueryDto } from './dto/appointment-query.dto';
import { MessagingService } from '../messaging/messaging.service';
import { PatientsService } from '../patients/patients.service';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private messagingService: MessagingService,
    private patientsService: PatientsService,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto, userId: string): Promise<Appointment> {
    // Verify patient exists
    await this.patientsService.findOne(createAppointmentDto.patientId);

    // Check for conflicting appointments
    const appointmentDate = new Date(createAppointmentDto.appointmentDateTime);
    const endTime = new Date(appointmentDate.getTime() + createAppointmentDto.durationMinutes * 60000);

    const conflicts = await this.appointmentsRepository.find({
      where: [
        {
          doctorId: createAppointmentDto.doctorId,
          appointmentDateTime: Between(appointmentDate, endTime),
          status: Not(AppointmentStatus.CANCELLED),
        },
        {
          patientId: createAppointmentDto.patientId,
          appointmentDateTime: Between(appointmentDate, endTime),
          status: Not(AppointmentStatus.CANCELLED),
        },
      ],
    });

    if (conflicts.length > 0) {
      throw new BadRequestException('Time slot is not available');
    }

    const appointment = this.appointmentsRepository.create({
      ...createAppointmentDto,
      scheduledByUserId: userId,
      status: AppointmentStatus.SCHEDULED,
    });

    const savedAppointment = await this.appointmentsRepository.save(appointment);

    // Publish event
    await this.messagingService.publishAppointmentEvent('appointment.created', {
      appointmentId: savedAppointment.id,
      patientId: savedAppointment.patientId,
      doctorId: savedAppointment.doctorId,
      scheduledBy: userId,
      timestamp: new Date().toISOString(),
    });

    // Clear cache
    await this.cacheManager.del('appointments:list:*');

    return savedAppointment;
  }

  async findAll(query: AppointmentQueryDto): Promise<{ data: Appointment[]; total: number }> {
    const cacheKey = `appointments:list:${JSON.stringify(query)}`;
    const cached = await this.cacheManager.get<{ data: Appointment[]; total: number }>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const queryBuilder = this.appointmentsRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.patient', 'patient');

    if (query.patientId) {
      queryBuilder.andWhere('appointment.patientId = :patientId', { patientId: query.patientId });
    }

    if (query.doctorId) {
      queryBuilder.andWhere('appointment.doctorId = :doctorId', { doctorId: query.doctorId });
    }

    if (query.status) {
      queryBuilder.andWhere('appointment.status = :status', { status: query.status });
    }

    if (query.fromDate && query.toDate) {
      queryBuilder.andWhere('appointment.appointmentDateTime BETWEEN :fromDate AND :toDate', {
        fromDate: query.fromDate,
        toDate: query.toDate,
      });
    }

    if (!query.page) query.page = 1;
    if (!query.limit) query.limit = 5;

    const [data, total] = await queryBuilder
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .orderBy('appointment.appointmentDateTime', 'ASC')
      .getManyAndCount();

    const result = { data, total };
    await this.cacheManager.set(cacheKey, result, 300);

    return result;
  }

  async findOne(id: string): Promise<Appointment> {
    const cacheKey = `appointment:${id}`;
    const cached = await this.cacheManager.get<Appointment>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['patient'],
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    await this.cacheManager.set(cacheKey, appointment, 300);
    return appointment;
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto, userId: string): Promise<Appointment> {
    const appointment = await this.findOne(id);

    Object.assign(appointment, updateAppointmentDto);
    const updatedAppointment = await this.appointmentsRepository.save(appointment);

    // Publish event
    await this.messagingService.publishAppointmentEvent('appointment.updated', {
      appointmentId: updatedAppointment.id,
      updatedBy: userId,
      timestamp: new Date().toISOString(),
    });

    // Clear cache
    await this.cacheManager.del(`appointment:${id}`);
    await this.cacheManager.del('appointments:list:*');

    return updatedAppointment;
  }

  async updateStatus(id: string, status: AppointmentStatus, userId: string): Promise<Appointment> {
    const appointment = await this.findOne(id);
    
    appointment.status = status;
    const updatedAppointment = await this.appointmentsRepository.save(appointment);

    // Publish event
    await this.messagingService.publishAppointmentEvent('appointment.status_changed', {
      appointmentId: updatedAppointment.id,
      oldStatus: appointment.status,
      newStatus: status,
      changedBy: userId,
      timestamp: new Date().toISOString(),
    });

    // Clear cache
    await this.cacheManager.del(`appointment:${id}`);
    await this.cacheManager.del('appointments:list:*');

    return updatedAppointment;
  }

  async cancel(id: string, userId: string): Promise<Appointment> {
    return this.updateStatus(id, AppointmentStatus.CANCELLED, userId);
  }
}