// frontend/src/pages/HomePage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector } from '../app/hooks';

const HomePage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  return (
    <div className="text-center mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-4xl font-bold mb-4">Welcome to the Patient Management System</h1>
      <p className="text-lg text-gray-700 mb-6">
        Manage patient records and appointments efficiently.
      </p>
      {user ? (
        <div>
          <p className="text-xl mb-4">Hello, {user.firstName || user.email}!</p>
          <Link to="/patients" className="btn-primary text-lg px-6 py-3">
            View Patients
          </Link>
        </div>
      ) : (
        <div className="space-x-4">
          <Link to="/login" className="btn-primary text-lg px-6 py-3">
            Login
          </Link>
          <Link to="/register" className="btn-secondary text-lg px-6 py-3">
            Register
          </Link>
        </div>
      )}
    </div>
  );
};
export default HomePage;