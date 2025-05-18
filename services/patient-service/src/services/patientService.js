const { Patient } = require('../models');
const { ValidationError, NotFoundError, DatabaseError } = require('../utils/errorTypes');
const logger = require('../config/logger');

// Create a new patient
const createPatient = async (patientData) => {
  try {
    const patient = await Patient.create(patientData);
    return patient.toJSON();
  } catch (error) {
    logger.error('Error creating patient:', error);
    if (error.name === 'SequelizeValidationError') {
      throw new ValidationError('Invalid patient data', error.errors);
    }
    throw new DatabaseError('Failed to create patient', error);
  }
};

// Get all patients with pagination
const getAllPatients = async (page, limit) => {
  try {
    const offset = (page - 1) * limit;
    
    const { count, rows } = await Patient.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
    
    return {
      patients: rows.map(patient => patient.toJSON()),
      total: count
    };
  } catch (error) {
    logger.error('Error fetching patients:', error);
    throw new DatabaseError('Failed to fetch patients', error);
  }
};

// Get patient by ID
const getPatientById = async (id) => {
  try {
    const patient = await Patient.findByPk(id);
    if (!patient) {
      return null;
    }
    return patient.toJSON();
  } catch (error) {
    logger.error(`Error fetching patient with ID ${id}:`, error);
    throw new DatabaseError('Failed to fetch patient', error);
  }
};

// Update patient by ID
const updatePatient = async (id, patientData) => {
  try {
    const patient = await Patient.findByPk(id);
    
    if (!patient) {
      throw new NotFoundError(`Patient with ID ${id} not found`);
    }
    
    await patient.update(patientData);
    return patient.toJSON();
  } catch (error) {
    logger.error(`Error updating patient with ID ${id}:`, error);
    if (error instanceof NotFoundError) {
      throw error;
    }
    if (error.name === 'SequelizeValidationError') {
      throw new ValidationError('Invalid patient data', error.errors);
    }
    throw new DatabaseError('Failed to update patient', error);
  }
};

// Delete patient by ID
const deletePatient = async (id) => {
  try {
    const patient = await Patient.findByPk(id);
    
    if (!patient) {
      throw new NotFoundError(`Patient with ID ${id} not found`);
    }
    
    await patient.destroy();
    return true;
  } catch (error) {
    logger.error(`Error deleting patient with ID ${id}:`, error);
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to delete patient', error);
  }
};

module.exports = {
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient
};