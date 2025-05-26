// frontend/src/pages/PatientEditPage.tsx
import React from 'react';
import PatientForm from '../components/patients/PatientForm';

const PatientEditPage: React.FC = () => {
  return <PatientForm isEditMode={true} />;
};
export default PatientEditPage;