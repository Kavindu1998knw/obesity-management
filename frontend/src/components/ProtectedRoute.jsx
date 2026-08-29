import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import UnauthorizedPage from '../pages/UnauthorizedPage';

export default function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  
  if (!token || !userString) {
    const fromPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?unauthorized=true&from=${fromPath}`} replace />;
  }

  try {
    const user = JSON.parse(userString);

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Intercept and display the Unauthorized URL Navigation Blocked screen
      return (
        <UnauthorizedPage 
          attemptedPath={location.pathname}
          allowedRoles={allowedRoles}
          userRole={user.role}
        />
      );
    }
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login?unauthorized=true" replace />;
  }

  return children;
}

