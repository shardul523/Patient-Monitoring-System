import { Injectable, NotFoundException, ConflictException, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Patient } from './entities/patient.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientQueryDto } from './dto/patient-query.dto';
import { MessagingService } from '../messaging/messaging.service';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
    // @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private messagingService: MessagingService,
  ) {}

  async create(createPatientDto: CreatePatientDto, userId: string): Promise<Patient> {
    // Check for duplicate email
    const existingPatient = await this.patientsRepository.findOne({
      where: { email: createPatientDto.email }
    });

    if (existingPatient) {
      throw new ConflictException('Patient with this email already exists');
    }

    // Generate patient number
    const patientNumber = await this.generatePatientNumber();

    const patient = this.patientsRepository.create({
      ...createPatientDto,
      patientNumber,
      registeredByUserId: userId,
    });

    const savedPatient = await this.patientsRepository.save(patient);

    // Publish event to RabbitMQ
    await this.messagingService.publishPatientEvent('patient.created', {
      patientId: savedPatient.id,
      patientNumber: savedPatient.patientNumber,
      registeredBy: userId,
      timestamp: new Date().toISOString(),
    });

    // Clear cache
    // await this.cacheManager.del('patients:list:*');

    return savedPatient;
  }

  async findAll(query: PatientQueryDto): Promise<{ data: Patient[]; total: number }> {
    // const cacheKey = `patients:list:${JSON.stringify(query)}`;
    // const cached = await this.cacheManager.get<{ data: Patient[]; total: number }>(cacheKey);
    
    // if (cached) {
    //   this.logger.debug('Returning cached patient list');
    //   return cached;
    // }

    const queryBuilder = this.patientsRepository.createQueryBuilder('patient');

    if (query.search) {
      queryBuilder.andWhere(
        '(patient.firstName ILIKE :search OR patient.lastName ILIKE :search OR patient.patientNumber ILIKE :search)',
        { search: `%${query.search}%` }
      );
    }

    if (query.isActive !== undefined) {
      queryBuilder.andWhere('patient.isActive = :isActive', { isActive: query.isActive });
    }

    if (!query.page) query.page = 1;
    if (!query.limit) query.limit = 5;

    const [data, total] = await queryBuilder
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    const result = { data, total };
    // await this.cacheManager.set(cacheKey, result, 300); // Cache for 5 minutes

    return result;
  }

  async findOne(id: string): Promise<Patient> {
    // const cacheKey = `patient:${id}`;
    // const cached = await this.cacheManager.get<Patient>(cacheKey);
    
    // if (cached) {
    //   return cached;
    // }

    const patient = await this.patientsRepository.findOne({
      where: { id },
      relations: ['appointments'],
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    // await this.cacheManager.set(cacheKey, patient, 300);
    return patient;
  }

  async update(id: string, updatePatientDto: UpdatePatientDto, userId: string): Promise<Patient> {
    const patient = await this.findOne(id);

    // Object.assign(patient, updatePatientDto);\
    console.log(updatePatientDto)
    const temp = {...patient, ...updatePatientDto}
    const updatedPatient = await this.patientsRepository.save(temp);

    // Publish event
    await this.messagingService.publishPatientEvent('patient.updated', {
      patientId: updatedPatient.id,
      updatedBy: userId,
      timestamp: new Date().toISOString(),
    });

    // Clear cache
    // await this.cacheManager.del(`patient:${id}`);
    // await this.cacheManager.del('patients:list:*');

    return updatedPatient;
  }

  async remove(id: string, userId: string): Promise<void> {
    const patient = await this.findOne(id);
    
    patient.isActive = false;
    await this.patientsRepository.save(patient);

    // Publish event
    await this.messagingService.publishPatientEvent('patient.deactivated', {
      patientId: id,
      deactivatedBy: userId,
      timestamp: new Date().toISOString(),
    });

    // // Clear cache
    // await this.cacheManager.del(`patient:${id}`);
    // await this.cacheManager.del('patients:list:*');
  }

  private async generatePatientNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastPatient = await this.patientsRepository
      .createQueryBuilder('patient')
      .where('patient.patientNumber LIKE :pattern', { pattern: `P${year}%` })
      .orderBy('patient.patientNumber', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastPatient) {
      const lastNumber = parseInt(lastPatient.patientNumber.substring(5));
      nextNumber = lastNumber + 1;
    }

    return `P${year}${nextNumber.toString().padStart(5, '0')}`;
  }
}