// frontend/src/features/patients/types.ts
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string; // Keep as string for form, convert as needed
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  patientNumber: string;
  email: string;
  phoneNumber: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  isActive: boolean;
  registeredByUserId: string;
  createdAt: string;
  updatedAt: string;
  // appointments?: any[]; // Define Appointment type later if needed
}

export type CreatePatientDto = Omit<Patient, 'id' | 'patientNumber' | 'isActive' | 'registeredByUserId' | 'createdAt' | 'updatedAt'>;
export type UpdatePatientDto = Partial<CreatePatientDto>;

export interface PatientState {
  patients: Patient[];
  currentPatient: Patient | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  message: string;
  totalPatients: number;
  currentPage: number;
  limit: number;
}

export interface PatientQuery {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
}