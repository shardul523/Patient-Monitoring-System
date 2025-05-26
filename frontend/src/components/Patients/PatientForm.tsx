// frontend/src/components/patients/PatientForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { createPatient, getPatientById, updatePatient, resetPatientState } from '../../features/patients/patientSlice';
import { CreatePatientDto, Patient, UpdatePatientDto } from '../../features/patients/types';
import LoadingSpinner from '../ui/LoadingSpinner';
import AlertMessage from '../ui/AlertMessage';

interface PatientFormProps {
  isEditMode?: boolean;
}

const PatientForm: React.FC<PatientFormProps> = ({ isEditMode = false }) => {
  const { id: patientId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { currentPatient, isLoading, isError, isSuccess, message } = useAppSelector(
    (state) => state.patients
  );
  const authUser = useAppSelector((state) => state.auth.user);

  const [formData, setFormData] = useState<CreatePatientDto | UpdatePatientDto>({
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '', // Format YYYY-MM-DD
    gender: 'MALE',
    email: '',
    phoneNumber: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });

  useEffect(() => {
    // Reset state on mount and when mode changes
    dispatch(resetPatientState());
    if (isEditMode && patientId) {
      dispatch(getPatientById(patientId));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, isEditMode, patientId]); // Removed navigate from deps

  useEffect(() => {
    if (isEditMode && currentPatient && currentPatient.id === patientId) {
      setFormData({
        firstName: currentPatient.firstName,
        lastName: currentPatient.lastName,
        middleName: currentPatient.middleName || '',
        dateOfBirth: currentPatient.dateOfBirth.split('T')[0], // Assuming ISO string from backend
        gender: currentPatient.gender,
        email: currentPatient.email,
        phoneNumber: currentPatient.phoneNumber,
        address: currentPatient.address || '',
        emergencyContactName: currentPatient.emergencyContactName || '',
        emergencyContactPhone: currentPatient.emergencyContactPhone || '',
      });
    }
  }, [isEditMode, currentPatient, patientId]);

  useEffect(() => {
    if (isSuccess && (message.includes('created') || message.includes('updated'))) {
      const timer = setTimeout(() => {
        navigate('/patients');
      }, 1500); // Navigate after showing success message
      return () => clearTimeout(timer);
    }
  }, [isSuccess, message, navigate]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch(resetPatientState()); // Clear previous messages

    if (!authUser) {
        alert("User not authenticated."); // Should not happen if protected route
        return;
    }

    // Basic validation example (add more as needed)
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.dateOfBirth || !formData.gender || !formData.phoneNumber) {
        alert("Please fill all required fields: First Name, Last Name, Email, DOB, Gender, Phone Number.");
        return;
    }


    if (isEditMode && patientId) {
      dispatch(updatePatient({ id: patientId, patientData: formData as UpdatePatientDto }));
    } else {
      dispatch(createPatient(formData as CreatePatientDto));
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-6 bg-white p-8 border border-gray-300 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">
        {isEditMode ? 'Edit Patient' : 'Create New Patient'}
      </h2>
      {message && <AlertMessage message={message} type={isError ? 'error' : (isSuccess ? 'success' : 'info')} onClose={() => dispatch(resetPatientState())} />}
      {isLoading && <LoadingSpinner />}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name*</label>
            <input type="text" name="firstName" id="firstName" value={formData.firstName} onChange={handleChange} className="input-field mt-1" required />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name*</label>
            <input type="text" name="lastName" id="lastName" value={formData.lastName} onChange={handleChange} className="input-field mt-1" required />
          </div>
        </div>

        <div>
          <label htmlFor="middleName" className="block text-sm font-medium text-gray-700">Middle Name</label>
          <input type="text" name="middleName" id="middleName" value={formData.middleName} onChange={handleChange} className="input-field mt-1" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">Date of Birth*</label>
            <input type="date" name="dateOfBirth" id="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="input-field mt-1" required />
          </div>
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender*</label>
            <select name="gender" id="gender" value={formData.gender} onChange={handleChange} className="input-field mt-1" required>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email*</label>
          <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} className="input-field mt-1" required />
        </div>

        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number*</label>
          <input type="tel" name="phoneNumber" id="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="input-field mt-1" required />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
          <textarea name="address" id="address" value={formData.address} onChange={handleChange} rows={3} className="input-field mt-1"></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700">Emergency Contact Name</label>
                <input type="text" name="emergencyContactName" id="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} className="input-field mt-1" />
            </div>
            <div>
                <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-700">Emergency Contact Phone</label>
                <input type="tel" name="emergencyContactPhone" id="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} className="input-field mt-1" />
            </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={() => navigate('/patients')} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Saving...' : (isEditMode ? 'Update Patient' : 'Create Patient')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;