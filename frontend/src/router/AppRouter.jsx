import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import AdminDashboard from '../pages/admin/AdminDashboard';
import DoctorManagement from '../pages/admin/DoctorManagement';
import PatientManagement from '../pages/admin/PatientManagement';
import AppointmentManagement from '../pages/admin/AppointmentManagement';
import DoctorDashboard from '../pages/doctor/DoctorDashboard';
import PatientDashboard from '../pages/patient/PatientDashboard';
import ProtectedRoute from '../components/ProtectedRoute';

function RootRedirect() {
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  
  if (token && userString) {
    try {
      const user = JSON.parse(userString);
      if (['admin', 'doctor', 'patient'].includes(user.role)) {
        return <Navigate to={`/${user.role}/dashboard`} replace />;
      }
    } catch (e) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
  
  return <Navigate to="/login" replace />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/doctors" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DoctorManagement />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/patients" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PatientManagement />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/appointments" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AppointmentManagement />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/doctor/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/patient/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
