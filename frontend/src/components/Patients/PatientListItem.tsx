// frontend/src/components/patients/PatientListItem.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Patient } from '../../features/patients/types';
import { useAppDispatch } from '../../app/hooks';
import { deletePatient } from '../../features/patients/patientSlice';

interface PatientListItemProps {
  patient: Patient;
}

const PatientListItem: React.FC<PatientListItemProps> = ({ patient }) => {
  const dispatch = useAppDispatch();

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to deactivate patient ${patient.firstName} ${patient.lastName}?`)) {
      dispatch(deletePatient(patient.id));
    }
  };

  return (
    <tr className="bg-white border-b hover:bg-gray-50">
      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{patient.patientNumber}</td>
      <td className="px-6 py-4">{patient.firstName} {patient.lastName}</td>
      <td className="px-6 py-4">{patient.email}</td>
      <td className="px-6 py-4">{new Date(patient.dateOfBirth).toLocaleDateString()}</td>
      <td className="px-6 py-4">{patient.gender}</td>
      <td className="px-6 py-4">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            patient.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
            {patient.isActive ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-6 py-4 text-right space-x-2">
        <Link to={`/patients/edit/${patient.id}`} className="font-medium text-blue-600 hover:underline">Edit</Link>
        {patient.isActive && (
            <button onClick={handleDelete} className="font-medium text-red-600 hover:underline">Deactivate</button>
        )}
      </td>
    </tr>
  );
};

export default PatientListItem;