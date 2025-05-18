const { ValidationError, NotFoundError } = require('../../src/utils/errorTypes');
const patientService = require('../../src/services/patientService');
const { Patient } = require('../../src/models');

// Mock the Patient model
jest.mock('../../src/models', () => {
  const mockPatient = {
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
  };
  
  mockPatient.prototype.update = jest.fn();
  mockPatient.prototype.destroy = jest.fn();
  mockPatient.prototype.toJSON = jest.fn();
  
  return { 
    Patient: mockPatient 
  };
});

describe('Patient Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('createPatient', () => {
    const patientData = {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      contactNumber: '1234567890',
      email: 'john.doe@example.com'
    };
    
    it('should create a patient and return the data', async () => {
      const mockPatient = {
        toJSON: jest.fn().mockReturnValue({ id: '123', ...patientData })
      };
      
      Patient.create.mockResolvedValue(mockPatient);
      
      const result = await patientService.createPatient(patientData);
      
      expect(Patient.create).toHaveBeenCalledWith(patientData);
      expect(mockPatient.toJSON).toHaveBeenCalled();
      expect(result).toEqual({ id: '123', ...patientData });
    });
    
    it('should throw ValidationError when validation fails', async () => {
      const validationError = {
        name: 'SequelizeValidationError',
        errors: [{ path: 'email', message: 'Invalid email format' }]
      };
      
      Patient.create.mockRejectedValue(validationError);
      
      await expect(patientService.createPatient(patientData))
        .rejects
        .toThrow(ValidationError);
    });
  });
  
  describe('getPatientById', () => {
    it('should return patient data when found', async () => {
      const mockPatient = {
        toJSON: jest.fn().mockReturnValue({ id: '123', firstName: 'John' })
      };
      
      Patient.findByPk.mockResolvedValue(mockPatient);
      
      const result = await patientService.getPatientById('123');
      
      expect(Patient.findByPk).toHaveBeenCalledWith('123');
      expect(result).toEqual({ id: '123', firstName: 'John' });
    });
    
    it('should return null when patient not found', async () => {
      Patient.findByPk.mockResolvedValue(null);
      
      const result = await patientService.getPatientById('not-exist');
      
      expect(result).toBeNull();
    });
  });
  
  // Add more tests for other methods
});