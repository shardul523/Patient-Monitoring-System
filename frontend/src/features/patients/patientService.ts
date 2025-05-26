// frontend/src/features/patients/patientService.ts
import api from '../../services/api';
import { CreatePatientDto, UpdatePatientDto, Patient, PatientQuery } from './types';

const API_URL = '/patients/';

const createPatient = async (patientData: CreatePatientDto) => {
  const response = await api.post(API_URL, patientData);
  return response.data;
};

const getPatients = async (query?: PatientQuery) => {
  const response = await api.get(API_URL, { params: query });
  // Backend returns { data: Patient[], total: number }
  return response.data;
};

const getPatientById = async (id: string) => {
  const response = await api.get(API_URL + id);
  return response.data;
};

const updatePatient = async (id: string, patientData: UpdatePatientDto) => {
  const response = await api.patch(API_URL + id, patientData); // Changed from PUT to PATCH
  return response.data;
};

const deletePatient = async (id: string) => {
  // Backend uses soft delete, so it might return 204 or the updated (deactivated) patient
  // For simplicity, we'll assume 204 or just handle the ID for removal from state
  await api.delete(API_URL + id);
  return id; // Return id to identify which patient was deleted
};

const patientService = {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
};

export default patientService;