import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  CalendarCheck,
  FileBarChart,
  FileText,
  Utensils,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export default function DashboardLayout({ children, role }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      navigate('/login');
      return;
    }

    try {
      const parsed = JSON.parse(savedUser);
      if (role && parsed.role !== role) {
        navigate('/login');
      } else {
        setUser(parsed);
      }
    } catch {
      navigate('/login');
    }
  }, [navigate, role]);

  const getMenuItems = () => {
    if (role === 'admin') {
      return [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Doctors', href: '/admin/doctors', icon: Stethoscope },
        { name: 'Patients', href: '/admin/patients', icon: Users },
        { name: 'Appointments', href: '/admin/appointments', icon: CalendarCheck },
        { name: 'Reports', href: '/admin/reports', icon: FileBarChart },
      ];
    }
    if (role === 'doctor') {
      return [
        { name: 'Dashboard', href: '/doctor/dashboard', icon: LayoutDashboard },
        { name: 'My Patients', href: '/doctor/patients', icon: Users },
        { name: 'Appointments', href: '/doctor/appointments', icon: CalendarCheck },
        { name: 'Obesity Assessments', href: '/doctor/assessments', icon: Stethoscope },
        { name: 'Meal Plans', href: '/doctor/meals', icon: Utensils },
        { name: 'Reports', href: '/doctor/reports', icon: FileText },
      ];
    }
    if (role === 'patient') {
      return [
        { name: 'Dashboard', href: '/patient/dashboard', icon: LayoutDashboard },
        { name: 'Appointments', href: '/patient/appointments', icon: CalendarCheck },
        { name: 'My Assessments', href: '/patient/assessment', icon: Stethoscope },
        { name: 'My Meal Plan', href: '/patient/meals', icon: Utensils },
        { name: 'Progress Tracker', href: '/patient/progress', icon: TrendingUp },
        { name: 'Reports', href: '/patient/reports', icon: FileText }
      ];
    }
    return [];
  };

  const requestLogout = () => {
    setShowLogoutModal(true);
    setSidebarOpen(false);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-800 antialiased overflow-hidden">
      <DashboardSidebar 
        role={role} 
        menuItems={getMenuItems()} 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onLogout={requestLogout}
      />

      <div className="flex-1 flex flex-col lg:pl-72 w-full min-w-0 h-screen overflow-hidden">
        <DashboardHeader 
          user={user} 
          onOpenSidebar={() => setSidebarOpen(true)} 
          onLogout={requestLogout} 
        />
        
        <main className="flex-1 overflow-y-auto w-full bg-slate-50/60 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Custom Modern Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Confirm Logout</h3>
            <p className="text-xs text-slate-500 mb-6">
              Are you sure you want to exit your session? You will need to log in again to access the portal.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={confirmLogout}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
