// frontend/src/components/patients/PatientList.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { getPatients, resetPatientState, setCurrentPage } from '../../features/patients/patientSlice';
import PatientListItem from './PatientListItem';
import LoadingSpinner from '../ui/LoadingSpinner';
import AlertMessage from '../ui/AlertMessage';

const PatientList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { patients, isLoading, isError, message, totalPatients, currentPage, limit } = useAppSelector(
    (state) => state.patients
  );
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(getPatients({ page: currentPage, limit, search: searchTerm || undefined }));
    console.log(patients);
    
    // return () => {
    //   // dispatch(resetPatientState()); // Optional: reset if you want fresh state on unmount
    // };
  }, [dispatch, currentPage, limit, searchTerm]);

  const handlePageChange = (newPage: number) => {
    dispatch(setCurrentPage(newPage));
  };
  
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch(setCurrentPage(1)); // Reset to first page on new search
    dispatch(getPatients({ page: 1, limit, search: searchTerm || undefined }));
  };


  const totalPages = Math.ceil(totalPatients / limit);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Patient Records</h2>
        <Link to="/patients/new" className="btn-primary">
          Add New Patient
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
            type="text"
            placeholder="Search by name or patient number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field flex-grow"
        />
        <button type="submit" className="btn-secondary">Search</button>
      </form>

      {message && !isLoading && <AlertMessage message={message} type={isError ? 'error' : 'info'} onClose={() => dispatch(resetPatientState())} />}
      {isLoading && <LoadingSpinner />}

      {!isLoading && !isError && patients.length === 0 && (
        <p className="text-center text-gray-500">No patients found.</p>
      )}

      {!isLoading && !isError && patients.length > 0 && (
        <>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Patient No.</th>
                <th scope="col" className="px-6 py-3">Name</th>
                <th scope="col" className="px-6 py-3">Email</th>
                <th scope="col" className="px-6 py-3">DOB</th>
                <th scope="col" className="px-6 py-3">Gender</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <PatientListItem key={patient.id} patient={patient} />
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center space-x-2">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                    Previous
                </button>
                <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        )}
        </>
      )}
    </div>
  );
};

export default PatientList;