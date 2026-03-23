import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const ProtectedRoute = ({ children, requireInternal = false }) => {
  const { user } = useApp();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireInternal && user.role !== 'internal') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

