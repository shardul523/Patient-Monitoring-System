import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Patient } from '../src/patients/entities/patient.entity';

describe('PatientsController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    await app.init();

    // Mock JWT token for testing
    authToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Use a valid test token
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/patients (POST)', () => {
    it('should create a new patient', () => {
      const createPatientDto = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        gender: 'MALE',
        email: 'john.doe@example.com',
        phoneNumber: '+1234567890',
      };

      return request(app.getHttpServer())
        .post('/patients')
        .set('Authorization', authToken)
        .send(createPatientDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('patientNumber');
          expect(res.body.firstName).toBe(createPatientDto.firstName);
        });
    });

    it('should fail with invalid data', () => {
      const invalidDto = {
        firstName: 'John',
        // Missing required fields
      };

      return request(app.getHttpServer())
        .post('/patients')
        .set('Authorization', authToken)
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('/patients (GET)', () => {
    it('should return paginated patients', () => {
      return request(app.getHttpServer())
        .get('/patients')
        .set('Authorization', authToken)
        .query({ page: 1, limit: 10 })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });
});