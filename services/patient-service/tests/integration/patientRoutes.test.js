const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/models');

// Mock the database
jest.mock('../../src/models', () => {
  const SequelizeMock = require('sequelize-mock');
  const dbMock = new SequelizeMock();
  
  const PatientMock = dbMock.define('Patient', {
    id: 'abc123',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
    gender: 'male',
    contactNumber: '1234567890',
    email: 'john.doe@example.com',
    address: '123 Main St',
    medicalHistory: 'No major issues',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  return {
    sequelize: {
      authenticate: jest.fn().mockResolvedValue(true),
      sync: jest.fn().mockResolvedValue(true),
    },
    Patient: PatientMock
  };
});

describe('Patient API Routes', () => {
  describe('GET /api/v1/health', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/api/v1/health');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('healthy');
    });
  });
  
  describe('POST /api/v1/patients', () => {
    it('should create a new patient', async () => {
      const patientData = {
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: '1992-05-15',
        gender: 'female',
        contactNumber: '9876543210',
        email: 'jane.smith@example.com'
      };
      
      const res = await request(app)
        .post('/api/v1/patients')
        .send(patientData);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.firstName).toBe(patientData.firstName);
    });
  });
  
  // Add more integration tests
});