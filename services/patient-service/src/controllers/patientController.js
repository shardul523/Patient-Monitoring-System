const patientService = require('../services/patientService');
const { ApiResponse } = require('../utils/apiResponse');
const logger = require('../config/logger');
const { NotFoundError, ValidationError } = require('../utils/errorTypes');

// Create a new patient
const createPatient = async (req, res, next) => {
  try {
    const patientData = req.body;
    const patient = await patientService.createPatient(patientData);
    return ApiResponse.success(res, 201, 'Patient created successfully', patient);
  } catch (error) {
    next(error);
  }
};

// Get all patients with pagination
const getAllPatients = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await patientService.getAllPatients(page, limit);
    
    return ApiResponse.success(res, 200, 'Patients retrieved successfully', {
      patients: result.patients,
      pagination: {
        total: result.total,
        currentPage: page,
        totalPages: Math.ceil(result.total / limit),
        limit
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get patient by ID
const getPatientById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const patient = await patientService.getPatientById(id);
    
    if (!patient) {
      throw new NotFoundError(`Patient with ID ${id} not found`);
    }
    
    return ApiResponse.success(res, 200, 'Patient retrieved successfully', patient);
  } catch (error) {
    next(error);
  }
};

// Update patient by ID
const updatePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const patientData = req.body;
    
    const updatedPatient = await patientService.updatePatient(id, patientData);
    return ApiResponse.success(res, 200, 'Patient updated successfully', updatedPatient);
  } catch (error) {
    next(error);
  }
};

// Delete patient by ID
const deletePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    await patientService.deletePatient(id);
    return ApiResponse.success(res, 200, 'Patient deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient
};