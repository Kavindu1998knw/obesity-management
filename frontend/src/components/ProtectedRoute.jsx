import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  
  if (!token || !userString) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userString);

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect an authenticated user trying to access wrong role's page
      if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
      if (user.role === 'doctor') return <Navigate to="/doctor/dashboard" replace />;
      if (user.role === 'patient') return <Navigate to="/patient/dashboard" replace />;
      return <Navigate to="/login" replace />;
    }
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  return children;
}
