// frontend/src/features/patients/patientSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import patientService from './patientService';
import { Patient, PatientState, CreatePatientDto, UpdatePatientDto, PatientQuery } from './types';

const initialState: PatientState = {
  patients: [],
  currentPatient: null,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
  totalPatients: 0,
  currentPage: 1,
  limit: 10,
};

export const createPatient = createAsyncThunk(
  'patients/create',
  async (patientData: CreatePatientDto, thunkAPI) => {
    try {
      return await patientService.createPatient(patientData);
    } catch (error: any) {
      const message = (error.response?.data?.message) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const getPatients = createAsyncThunk(
  'patients/getAll',
  async (query: PatientQuery | undefined, thunkAPI) => {
    try {
      return await patientService.getPatients(query);
    } catch (error: any) {
      const message = (error.response?.data?.message) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const getPatientById = createAsyncThunk(
  'patients/getById',
  async (id: string, thunkAPI) => {
    try {
      return await patientService.getPatientById(id);
    } catch (error: any) {
      const message = (error.response?.data?.message) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const updatePatient = createAsyncThunk(
  'patients/update',
  async ({ id, patientData }: { id: string; patientData: UpdatePatientDto }, thunkAPI) => {
    try {
      return await patientService.updatePatient(id, patientData);
    } catch (error: any) {
      const message = (error.response?.data?.message) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const deletePatient = createAsyncThunk(
  'patients/delete',
  async (id: string, thunkAPI) => {
    try {
      return await patientService.deletePatient(id);
    } catch (error: any) {
      const message = (error.response?.data?.message) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const patientSlice = createSlice({
  name: 'patients',
  initialState,
  reducers: {
    resetPatientState: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = '';
      state.currentPatient = null;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
        state.currentPage = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create Patient
      .addCase(createPatient.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createPatient.fulfilled, (state, action: PayloadAction<Patient>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.patients.push(action.payload); // Or refetch list
        state.message = 'Patient created successfully!';
      })
      .addCase(createPatient.rejected, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get Patients
      .addCase(getPatients.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPatients.fulfilled, (state, action: PayloadAction<{ data: Patient[]; total: number }>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.patients = action.payload.data;
        state.totalPatients = action.payload.total;
      })
      .addCase(getPatients.rejected, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.patients = [];
      })
      // Get Patient By ID
      .addCase(getPatientById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPatientById.fulfilled, (state, action: PayloadAction<Patient>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentPatient = action.payload;
      })
      .addCase(getPatientById.rejected, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.currentPatient = null;
      })
      // Update Patient
      .addCase(updatePatient.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updatePatient.fulfilled, (state, action: PayloadAction<Patient>) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.patients = state.patients.map((p) =>
          p.id === action.payload.id ? action.payload : p
        );
        state.currentPatient = action.payload;
        state.message = 'Patient updated successfully!';
      })
      .addCase(updatePatient.rejected, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Delete Patient
      .addCase(deletePatient.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deletePatient.fulfilled, (state, action: PayloadAction<string>) => { // action.payload is patientId
        state.isLoading = false;
        state.isSuccess = true;
        // Instead of filtering, mark as inactive or refetch list
        // For now, let's refetch or assume the backend handles the list update on next GET
        state.patients = state.patients.filter((p) => p.id !== action.payload);
        state.message = 'Patient deactivated successfully!';
      })
      .addCase(deletePatient.rejected, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetPatientState, setCurrentPage } = patientSlice.actions;
export default patientSlice.reducer;