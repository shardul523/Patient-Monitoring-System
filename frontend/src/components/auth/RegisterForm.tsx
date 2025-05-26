// frontend/src/components/auth/RegisterForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { register, reset } from '../../features/auth/authSlice';
import LoadingSpinner from '../ui/LoadingSpinner';
import AlertMessage from '../ui/AlertMessage';

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const { firstName, lastName, email, password, confirmPassword } = formData;

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, isError, isSuccess, message } = useAppSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isSuccess && message.includes('Registration successful')) { // Check specific success message
      // Don't navigate immediately, let user see success message
      // Optionally navigate after a delay or on user action
      // navigate('/login');
    }
  }, [isSuccess, message, navigate]);

  useEffect(() => {
    return () => {
        dispatch(reset()); // Reset on unmount
    }
  }, [dispatch]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch(reset());
    if (password !== confirmPassword) {
      dispatch(reset()); // Clear previous messages
      // Use Redux for this message or local state
      // For now, directly setting a message in authSlice is not ideal for form validation
      // Consider local state for "passwords do not match"
      alert("Passwords do not match!"); // Simple alert for now
    } else {
      dispatch(register({ firstName, lastName, email, password }));
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 border border-gray-300 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">Register</h2>
      {message && <AlertMessage message={message} type={isError ? 'error' : (isSuccess ? 'success' : 'info')} onClose={() => dispatch(reset())} />}
      {isLoading && <LoadingSpinner />}
      <form onSubmit={onSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstName">First Name</label>
          <input className="input-field" id="firstName" type="text" name="firstName" value={firstName} onChange={onChange} />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lastName">Last Name</label>
          <input className="input-field" id="lastName" type="text" name="lastName" value={lastName} onChange={onChange} />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
          <input className="input-field" id="email" type="email" name="email" value={email} onChange={onChange} required />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password</label>
          <input className="input-field" id="password" type="password" name="password" value={password} onChange={onChange} required minLength={8}/>
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">Confirm Password</label>
          <input className="input-field" id="confirmPassword" type="password" name="confirmPassword" value={confirmPassword} onChange={onChange} required />
        </div>
        <button className="btn-primary w-full" type="submit" disabled={isLoading}>
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
};
// Add helper CSS classes to index.css or use Tailwind directly
// .input-field { @apply shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline; }
// .btn-primary { @apply bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline; }

export default RegisterForm;