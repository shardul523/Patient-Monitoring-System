// frontend/src/components/ui/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';

const ProtectedRoute: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  console.log(user);
  

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />; // Renders child routes
};

export default ProtectedRoute;