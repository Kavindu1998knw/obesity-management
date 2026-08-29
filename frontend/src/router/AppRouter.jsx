import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import ProtectedRoute from '../components/ProtectedRoute';

import AdminDashboard from '../pages/admin/AdminDashboard';
import DoctorManagement from '../pages/admin/DoctorManagement';
import PatientManagement from '../pages/admin/PatientManagement';
import AppointmentManagement from '../pages/admin/AppointmentManagement';
import ReportManagement from '../pages/admin/ReportManagement';
import DoctorDashboard from '../pages/doctor/DoctorDashboard';
import PatientList from '../pages/doctor/PatientList';
import PatientDetail from '../pages/doctor/PatientDetail';
import AppointmentList from '../pages/doctor/AppointmentList';
import AssessmentList from '../pages/doctor/AssessmentList';
import NewAssessment from '../pages/doctor/NewAssessment';
import AssessmentResult from '../pages/doctor/AssessmentResult';
import MealPlanList from '../pages/doctor/MealPlanList';
import MealPlanGenerator from '../pages/doctor/MealPlanGenerator';
import DoctorReports from '../pages/doctor/DoctorReports';
import PatientDashboard from '../pages/patient/PatientDashboard';
import PatientAppointments from '../pages/patient/PatientAppointments';
import PatientAssessments from '../pages/patient/PatientAssessments';
import PatientMealPlans from '../pages/patient/PatientMealPlans';
import PatientProgress from '../pages/patient/PatientProgress';
import PatientReports from '../pages/patient/PatientReports';
import UnauthorizedPage from '../pages/UnauthorizedPage';
import NotFoundPage from '../pages/NotFoundPage';

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
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
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
          path="/admin/reports" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ReportManagement />
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
          path="/doctor/patients" 
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <PatientList />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/doctor/patients/:id" 
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <PatientDetail />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/doctor/appointments" 
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <AppointmentList />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/doctor/assessments" 
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <AssessmentList />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/doctor/assessments/new" 
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <NewAssessment />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/doctor/assessments/:id" 
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <AssessmentResult />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/doctor/meals" 
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <MealPlanList />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/doctor/meals/:id" 
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <MealPlanGenerator />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/doctor/meals/:id/edit" 
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <MealPlanGenerator />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/doctor/reports" 
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorReports />
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

        <Route 
          path="/patient/appointments" 
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientAppointments />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/patient/assessment" 
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientAssessments />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/patient/meals" 
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientMealPlans />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/patient/progress" 
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientProgress />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/patient/reports" 
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientReports />
            </ProtectedRoute>
          } 
        />
        
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
