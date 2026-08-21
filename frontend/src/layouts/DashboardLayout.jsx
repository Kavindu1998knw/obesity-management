import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';

import { 
  FaHouse, 
  FaUserDoctor, 
  FaUsers, 
  FaCalendarCheck, 
  FaUtensils, 
  FaChartLine, 
  FaClipboardList, 
  FaGear,
  FaStethoscope,
  FaFileLines,
  FaUser,
  FaNotesMedical,
  FaBell
} from 'react-icons/fa6';

export default function DashboardLayout({ children, role }) {
  const navigate = useNavigate();
  const location = useLocation();
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
    } catch (e) {
      navigate('/login');
    }
  }, [navigate, role]);

  const getMenuItems = () => {
    if (role === 'admin') {
      return [
        { name: 'Dashboard', href: '/admin/dashboard', icon: FaHouse },
        { name: 'Doctors', href: '/admin/doctors', icon: FaUserDoctor },
        { name: 'Patients', href: '/admin/patients', icon: FaUsers },
        { name: 'Appointments', href: '/admin/appointments', icon: FaCalendarCheck },
        { name: 'Reports', href: '/admin/reports', icon: FaChartLine },
      ];
    }
    if (role === 'doctor') {
      return [
        { name: 'Dashboard', href: '/doctor/dashboard', icon: FaHouse },
        { name: 'My Patients', href: '/doctor/patients', icon: FaUsers },
        { name: 'Appointments', href: '/doctor/appointments', icon: FaCalendarCheck },
        { name: 'Obesity Assessments', href: '/doctor/assessments', icon: FaStethoscope },
        { name: 'Meal Plans', href: '/doctor/meals', icon: FaUtensils },
        { name: 'Reports', href: '/doctor/reports', icon: FaFileLines },
      ];
    }
    if (role === 'patient') {
      return [
        { name: 'Dashboard', href: '/patient/dashboard', icon: FaHouse },
        { name: 'Appointments', href: '/patient/appointments', icon: FaCalendarCheck },
        { name: 'My Assessments', href: '/patient/assessment', icon: FaStethoscope },
        { name: 'My Meal Plan', href: '/patient/meals', icon: FaUtensils },
        { name: 'Progress Tracker', href: '/patient/progress', icon: FaChartLine },
        { name: 'Reports', href: '/patient/reports', icon: FaFileLines }
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
    sessionStorage.clear(); // Clear any protected cached data
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="h-screen flex bg-[#F5F7FA] font-sans text-[#172033] overflow-hidden">
      <DashboardSidebar 
        role={role} 
        menuItems={getMenuItems()} 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onLogout={requestLogout}
      />

      <div className="flex-1 flex flex-col lg:pl-72 w-full h-full overflow-hidden">
        <DashboardHeader user={user} onOpenSidebar={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto w-full">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Custom Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 text-center">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Logout</h3>
            <p className="text-slate-600 mb-6">Are you sure you want to log out?</p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmLogout}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
