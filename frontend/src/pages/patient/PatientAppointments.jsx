import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  FaHouseChimney, FaBrain, FaUtensils, FaCalendarDays,
  FaChartLine, FaWeightScale, FaUser, FaGear,
  FaArrowRightFromBracket, FaBars, FaXmark, FaBell,
  FaChevronRight, FaCircleCheck, FaCircleXmark, FaCircleInfo,
  FaPlus, FaStethoscope, FaClock, FaCheck, FaPen, FaEye, FaTrash, FaBan, FaUserDoctor
} from 'react-icons/fa6';
import DashboardLayout from '../../layouts/DashboardLayout'; // Not used directly, but we preserve the same layout structure

// Reuse Custom Searchable Select for Doctors lookup in Request form
function SearchableSelect({ label, value, onChange, options, placeholder, error, disabled, icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setSearch('');
  }, [value]);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border ${
            error 
              ? 'border-rose-500 focus:ring-rose-500/20' 
              : 'border-slate-200 focus:ring-sky-500/20'
          } text-left text-slate-800 text-xs focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-between min-h-[38px] transition-all`}
        >
          <div className="flex items-center space-x-2.5 truncate">
            {Icon && <Icon className="text-slate-400 text-xs shrink-0" />}
            <span className={value ? 'text-slate-850 font-medium' : 'text-slate-400'}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <span className="text-slate-400 text-[9px] shrink-0 font-semibold select-none ml-2">
            {isOpen ? '▲' : '▼'}
          </span>
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-56 flex flex-col">
          <div className="p-2 border-b border-slate-100 bg-slate-50">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 focus:outline-none focus:border-sky-500 text-slate-800 text-xs"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto flex-1 py-1 divide-y divide-slate-50">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-2.5 text-center text-slate-400 text-xs">
                No matches found
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 text-xs transition-colors cursor-pointer block truncate ${
                    opt.value === value 
                      ? 'bg-sky-50 text-sky-600 font-semibold' 
                      : 'text-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
      {error && (
        <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{error}</span>
      )}
    </div>
  );
}

// Format 24h ISO time value into reader-friendly 12h AM/PM
const formatTime12Hour = (timeStr) => {
  if (!timeStr) return 'N/A';
  if (!timeStr.includes(':')) return timeStr;
  const [hourStr, minStr] = timeStr.split(':');
  let hour = parseInt(hourStr, 10);
  if (isNaN(hour)) return timeStr;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${hour}:${minStr} ${ampm}`;
};

const getTodayDateString = () => {
  try {
    return new Date().toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
};

export default function PatientAppointments() {
  const navigate = useNavigate();
  
  // Page states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [user, setUser] = useState({ fullName: 'John Perera', email: 'john@email.com' });
  
  // Dynamic lookup
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // upcoming, pending, completed, cancelled
  
  // Toast alert
  const [notification, setNotification] = useState(null);

  // Modals state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Forms state
  const [requestForm, setRequestForm] = useState({
    doctorId: '',
    department: '',
    appointmentDate: '',
    appointmentTime: '',
    reasonForVisit: '',
    notes: ''
  });

  const [rescheduleForm, setRescheduleForm] = useState({
    appointmentDate: '',
    appointmentTime: '',
    notes: ''
  });

  const [formErrors, setFormErrors] = useState({});

  // Sidebar Menu Layout Matching PatientDashboard
  const MENU = [
    { icon: FaHouseChimney, label: 'Dashboard', id: 'dashboard' },
    { icon: FaBrain, label: 'My Prediction', id: 'prediction' },
    { icon: FaUtensils, label: 'Meal Plan', id: 'meals' },
    { icon: FaCalendarDays, label: 'Appointments', id: 'appointments' },
    { icon: FaChartLine, label: 'Progress Tracker', id: 'progress' },
    { icon: FaWeightScale, label: 'BMI Calculator', id: 'bmi' },
    { icon: FaUser, label: 'Profile', id: 'profile' },
    { icon: FaGear, label: 'Settings', id: 'settings' },
  ];

  const triggerNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    // Load local storage session profile
    const saved = localStorage.getItem('user');
    if (saved) setUser(JSON.parse(saved));

    fetchData();
  }, []);

  useEffect(() => {
    if (location.state && location.state.openRequest) {
      openRequestModal();
      // Clear state so it doesn't reopen on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // API Call simulation with clean fallback mock datasets
  const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // 1. Fetch doctors lookup list
      let fetchedDoctors = [];
      try {
        const docRes = await axios.get('http://localhost:5000/api/doctors', { headers });
        if (docRes.data.success && Array.isArray(docRes.data.data) && docRes.data.data.length > 0) {
          fetchedDoctors = docRes.data.data;
        } else {
          throw new Error('No doctors registered in database.');
        }
      } catch (err) {
        console.warn('Doctors API empty or failed, loading mock specialists.');
        fetchedDoctors = [
          { _id: 'doc1', fullName: 'Dr. Sarah Connor', department: 'Nutrition & Dietetics', specialization: 'Obesity Endocrinology' },
          { _id: 'doc2', fullName: 'Dr. James Reed', department: 'Clinical Nutrition', specialization: 'Weight Management Counselor' }
        ];
      }
      setDoctors(fetchedDoctors);

      // 2. Fetch patient appointments list
      try {
        const apptRes = await axios.get('http://localhost:5000/api/patient/appointments', { headers });
        if (apptRes.data.success) {
          setAppointments(apptRes.data.data);
        } else {
          loadMockAppointments();
        }
      } catch (err) {
        console.warn('Patient appointments endpoint not ready or offline. Loading fallback data.');
        loadMockAppointments();
      }

    } catch (err) {
      console.error(err);
      triggerNotification('Failed to resolve database integration.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockAppointments = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const prevWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const mockData = [
      {
        _id: 'APT-109345',
        doctorId: 'doc1',
        doctorName: 'Dr. Sarah Connor',
        department: 'Nutrition & Dietetics',
        appointmentDate: nextWeek,
        appointmentTime: '10:30',
        status: 'Confirmed',
        reasonForVisit: 'Monthly review of ketogenic meal plans and progression logs.',
        notes: 'Please bring your weight tracker logs.',
        createdAt: new Date().toISOString()
      },
      {
        _id: 'APT-230948',
        doctorId: 'doc2',
        doctorName: 'Dr. James Reed',
        department: 'Clinical Nutrition',
        appointmentDate: nextWeek,
        appointmentTime: '14:30',
        status: 'Pending',
        reasonForVisit: 'Onboarding consultation and BMI classification.',
        notes: '',
        createdAt: new Date().toISOString()
      },
      {
        _id: 'APT-098234',
        doctorId: 'doc1',
        doctorName: 'Dr. Sarah Connor',
        department: 'Nutrition & Dietetics',
        appointmentDate: prevWeek,
        appointmentTime: '09:00',
        status: 'Completed',
        reasonForVisit: 'Obesity risk assessment calculation.',
        notes: 'Target calories set to 2100 kcal. Stay hydrated!',
        createdAt: new Date().toISOString()
      },
      {
        _id: 'APT-748392',
        doctorId: 'doc2',
        doctorName: 'Dr. James Reed',
        department: 'Clinical Nutrition',
        appointmentDate: prevWeek,
        appointmentTime: '11:15',
        status: 'Cancelled',
        reasonForVisit: 'Diet tracker checkup.',
        notes: '',
        createdAt: new Date().toISOString()
      }
    ];
    setAppointments(mockData);
  };

  // Nav actions
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const initials = (user?.fullName || 'JP')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const firstName = (user?.fullName || 'Patient').split(' ')[0];

  const doctorOptions = (doctors || [])
    .filter(d => d && d._id)
    .map(d => ({
      label: `${d.fullName || 'Unknown Doctor'} (${d.department || 'N/A'})`,
      value: d._id
    }));

  const handleRequestDoctorChange = (docId) => {
    const chosen = doctors.find(d => d._id === docId);
    setRequestForm(prev => ({
      ...prev,
      doctorId: docId,
      department: chosen ? chosen.department : ''
    }));
    if (formErrors.doctorId) setFormErrors(prev => ({ ...prev, doctorId: '', department: '' }));
  };

  // Create Appointment Request
  const openRequestModal = () => {
    setRequestForm({
      doctorId: '',
      department: '',
      appointmentDate: '',
      appointmentTime: '',
      reasonForVisit: '',
      notes: ''
    });
    setFormErrors({});
    setIsRequestModalOpen(true);
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!requestForm.doctorId) errors.doctorId = 'Doctor is required';
    if (!requestForm.appointmentDate) errors.appointmentDate = 'Date is required';
    if (!requestForm.appointmentTime) errors.appointmentTime = 'Time is required';
    if (!requestForm.reasonForVisit) errors.reasonForVisit = 'Reason is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      triggerNotification('Please correct validation errors.', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      // POST API integration path
      const response = await axios.post('http://localhost:5000/api/patient/appointments', requestForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setIsRequestModalOpen(false);
        triggerNotification('Appointment request submitted successfully.');
        fetchData();
      }
    } catch (err) {
      console.warn('POST appointments API not mounted, saving locally for mock demonstration.');
      // Local Mock fallback
      const chosenDoc = doctors.find(d => d._id === requestForm.doctorId);
      const newAppt = {
        _id: 'APT-' + Math.floor(100000 + Math.random() * 900000),
        doctorId: requestForm.doctorId,
        doctorName: chosenDoc ? chosenDoc.fullName : 'Specialist',
        department: requestForm.department,
        appointmentDate: requestForm.appointmentDate,
        appointmentTime: requestForm.appointmentTime,
        status: 'Pending',
        reasonForVisit: requestForm.reasonForVisit,
        notes: requestForm.notes,
        createdAt: new Date().toISOString()
      };
      setAppointments(prev => [newAppt, ...prev]);
      setIsRequestModalOpen(false);
      triggerNotification('Appointment request submitted successfully.');
    }
  };

  // View Modal
  const handleViewClick = (appt) => {
    setSelectedAppointment(appt);
    setIsViewModalOpen(true);
  };

  // Reschedule Modal
  const handleRescheduleClick = (appt) => {
    setSelectedAppointment(appt);
    setRescheduleForm({
      appointmentDate: appt.appointmentDate,
      appointmentTime: appt.appointmentTime,
      notes: ''
    });
    setFormErrors({});
    setIsRescheduleModalOpen(true);
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!rescheduleForm.appointmentDate) errors.appointmentDate = 'New preferred date is required';
    if (!rescheduleForm.appointmentTime) errors.appointmentTime = 'New preferred time is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/patient/appointments/${selectedAppointment._id}/reschedule`, rescheduleForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setIsRescheduleModalOpen(false);
        triggerNotification('Reschedule request sent.');
        fetchData();
      }
    } catch (err) {
      console.warn('PUT reschedule API not configured, fallback updates locally.');
      // Local Mock fallback update
      setAppointments(prev => prev.map(a => {
        if (a._id === selectedAppointment._id) {
          return {
            ...a,
            appointmentDate: rescheduleForm.appointmentDate,
            appointmentTime: rescheduleForm.appointmentTime,
            status: 'Reschedule Pending',
            notes: rescheduleForm.notes ? `${a.notes}\n[Reschedule Reason]: ${rescheduleForm.notes}`.trim() : a.notes
          };
        }
        return a;
      }));
      setIsRescheduleModalOpen(false);
      triggerNotification('Reschedule requested submitted (Mock mode).');
    }
  };

  // Cancel flow
  const handleCancelClick = (appt) => {
    setSelectedAppointment(appt);
    setIsCancelModalOpen(true);
  };

  const handleCancelConfirm = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`http://localhost:5000/api/patient/appointments/${selectedAppointment._id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setIsCancelModalOpen(false);
        triggerNotification('Appointment request cancelled.');
        fetchData();
      }
    } catch (err) {
      console.warn('PATCH cancel API not set up, toggling state locally.');
      setAppointments(prev => prev.map(a => {
        if (a._id === selectedAppointment._id) {
          return { ...a, status: 'Cancelled' };
        }
        return a;
      }));
      setIsCancelModalOpen(false);
      triggerNotification('Appointment status set to Cancelled.');
    }
  };

  // Calculate metrics
  const upcomingCount = appointments.filter(a => a.status === 'Confirmed' || a.status === 'Reschedule Pending').length;
  const completedCount = appointments.filter(a => a.status === 'Completed').length;
  const pendingCount = appointments.filter(a => a.status === 'Pending').length;
  const cancelledCount = appointments.filter(a => a.status === 'Cancelled' || a.status === 'Rejected').length;

  // Filter list by selected tab
  const filteredAppointments = appointments.filter(appt => {
    if (activeTab === 'upcoming') {
      return appt.status === 'Confirmed' || appt.status === 'Reschedule Pending';
    }
    if (activeTab === 'pending') {
      return appt.status === 'Pending';
    }
    if (activeTab === 'completed') {
      return appt.status === 'Completed';
    }
    if (activeTab === 'cancelled') {
      return appt.status === 'Cancelled' || appt.status === 'Rejected';
    }
    return true;
  });

  const isFormValid = !!(
    requestForm.doctorId &&
    requestForm.appointmentDate &&
    requestForm.appointmentTime &&
    requestForm.reasonForVisit &&
    requestForm.reasonForVisit.trim()
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800">
      
      {/* Toast Alert */}
      {notification && (
        <div className="fixed top-6 right-6 z-[100] flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-xl border bg-white border-slate-200 animate-slide-in">
          <span className={`w-2.5 h-2.5 rounded-full ${notification.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
          <p className="text-xs font-bold text-slate-800">{notification.message}</p>
        </div>
      )}

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/25 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ══════════════════════════════
          SIDEBAR
      ══════════════════════════════ */}
      <aside className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Logo */}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center shadow-sm">
                <FaCalendarDays className="text-white text-base" />
              </div>
              <div>
                <h1 className="text-[13px] font-bold text-slate-900">My Health Portal</h1>
                <p className="text-[10px] text-slate-400">Patient Dashboard</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600 p-1">
              <FaXmark />
            </button>
          </div>
        </div>

        {/* Navigation links matching core dashboard layout */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-3 mb-2">Menu</p>
          {MENU.map(item => {
            const Icon = item.icon;
            const isActive = item.id === 'appointments';
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'dashboard') {
                    navigate('/patient/dashboard');
                  } else if (item.id === 'appointments') {
                    // stays on current
                  } else {
                    navigate('/patient/dashboard');
                  }
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon className={`text-sm flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {isActive && <FaChevronRight className="ml-auto text-[10px] text-white/70" />}
              </button>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="px-3 pb-4 border-t border-slate-100 pt-4 space-y-3">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{user.fullName}</p>
              <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-semibold text-rose-500 border border-rose-100 hover:bg-rose-50 transition-colors"
          >
            <FaArrowRightFromBracket className="text-xs" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════
          MAIN PANEL
      ══════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP NAVBAR */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-5 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 lg:hidden">
              <FaBars />
            </button>
            <div>
              <h2 className="text-sm font-bold text-slate-900">My Appointments</h2>
              <p className="text-[11px] text-slate-400">Track and reschedule consultations with medical specialists.</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 relative">
              <FaBell className="text-sm" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center text-white font-bold text-sm hover:bg-sky-600 transition-colors shadow-sm"
              >
                {initials}
              </button>

              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                  <div className="absolute right-0 top-11 z-50 w-52 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                      <p className="text-xs font-bold text-slate-800">{user.fullName}</p>
                      <p className="text-[10px] text-slate-400">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 text-[9px] font-semibold border border-sky-100">Patient</span>
                    </div>
                    <div className="py-1.5">
                      <button onClick={() => navigate('/patient/dashboard')} className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors">
                        <FaUser className="text-slate-400 text-xs" /><span>My Profile</span>
                      </button>
                    </div>
                    <div className="border-t border-slate-100 p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 transition-colors"
                      >
                        <FaArrowRightFromBracket /><span>Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* WORKSPACE CONTENT */}
        <main className="flex-1 p-5 overflow-y-auto space-y-6">
          
          {/* HEADER ROW */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                My Appointments
              </h1>
              <p className="text-xs text-slate-400">
                Manage your upcoming and previous appointments.
              </p>
            </div>
            <button
              type="button"
              onClick={openRequestModal}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-sky-500 text-white hover:bg-sky-600 text-xs font-semibold shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              <FaPlus />
              <span>Request Appointment</span>
            </button>
          </div>

          {/* SUMMARY STATISTICS CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Upcoming Appointments', value: upcomingCount, icon: FaCalendarDays, color: 'text-sky-500', bg: 'bg-sky-50' },
              { label: 'Completed Appointments', value: completedCount, icon: FaCircleCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
              { label: 'Pending Requests', value: pendingCount, icon: FaClock, color: 'text-amber-500', bg: 'bg-amber-50' },
              { label: 'Cancelled Appointments', value: cancelledCount, icon: FaBan, color: 'text-slate-500', bg: 'bg-slate-50' }
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">{card.label}</span>
                    <div className={`w-7 h-7 rounded-lg ${card.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`text-xs ${card.color}`} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-850">{card.value}</h3>
                </div>
              );
            })}
          </div>

          {/* TABS CONTROLS */}
          <div className="border-b border-slate-200">
            <div className="flex space-x-6">
              {[
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'pending', label: 'Pending Requests' },
                { id: 'completed', label: 'Completed' },
                { id: 'cancelled', label: 'Cancelled' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'border-sky-500 text-sky-600'
                      : 'border-transparent text-slate-450 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* APPOINTMENT GRID / TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-8 space-y-4">
                <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-slate-100 rounded animate-pulse w-5/6" />
                <div className="h-4 bg-slate-100 rounded animate-pulse w-2/3" />
              </div>
            ) : filteredAppointments.length === 0 ? (
              
              /* EMPTY STATE */
              <div className="text-center py-12 px-4 flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                  <FaCalendarDays className="text-2xl" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">No appointments found</h3>
                  <p className="text-xs text-slate-400 mt-1">You don't have any appointments listed under this filter.</p>
                </div>
                <button
                  type="button"
                  onClick={openRequestModal}
                  className="px-4 py-2 rounded-xl bg-sky-500 text-white text-xs font-semibold shadow-sm hover:bg-sky-600 transition-colors cursor-pointer"
                >
                  Request Appointment
                </button>
              </div>

            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="px-5 py-3.5 font-semibold">Appointment ID</th>
                      <th className="px-4 py-3.5 font-semibold">Doctor</th>
                      <th className="px-4 py-3.5 font-semibold">Department</th>
                      <th className="px-4 py-3.5 font-semibold">Appointment Date</th>
                      <th className="px-4 py-3.5 font-semibold">Appointment Time</th>
                      <th className="px-4 py-3.5 font-semibold">Status</th>
                      <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAppointments.map(appt => (
                      <tr key={appt._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4 font-mono text-slate-450 font-bold">
                          {appt._id.toUpperCase()}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0 text-sky-400">
                              <FaStethoscope className="text-[10px]" />
                            </div>
                            <span className="font-bold text-slate-800">{appt.doctorName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-500">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-[10px] font-semibold">
                            {appt.department}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-650 font-mono">
                          {appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-4 text-slate-650 font-mono">
                          {formatTime12Hour(appt.appointmentTime)}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            appt.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                            appt.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                            appt.status === 'Reschedule Pending' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                            appt.status === 'Completed' ? 'bg-sky-50 text-sky-650 border-sky-200' :
                            appt.status === 'Cancelled' ? 'bg-slate-50 text-slate-500 border-slate-200' :
                            'bg-rose-50 text-rose-600 border-rose-200' // Rejected
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              appt.status === 'Confirmed' ? 'bg-emerald-500' :
                              appt.status === 'Pending' ? 'bg-amber-500' :
                              appt.status === 'Reschedule Pending' ? 'bg-indigo-500' :
                              appt.status === 'Completed' ? 'bg-sky-500' :
                              appt.status === 'Cancelled' ? 'bg-slate-400' :
                              'bg-rose-500'
                            }`} />
                            <span>{appt.status}</span>
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right space-x-1.5 whitespace-nowrap">
                          {activeTab === 'upcoming' && (
                            <>
                              <button
                                onClick={() => handleViewClick(appt)}
                                title="View Details"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all cursor-pointer inline-flex items-center"
                              >
                                <FaEye />
                              </button>
                              <button
                                onClick={() => handleRescheduleClick(appt)}
                                title="Reschedule Request"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-600 transition-all cursor-pointer inline-flex items-center"
                              >
                                <FaPen />
                              </button>
                              <button
                                onClick={() => handleCancelClick(appt)}
                                title="Cancel Appointment"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer inline-flex items-center"
                              >
                                <FaBan />
                              </button>
                            </>
                          )}
                          {activeTab === 'completed' && (
                            <button
                              onClick={() => handleViewClick(appt)}
                              title="View Summary"
                              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all cursor-pointer inline-flex items-center space-x-1"
                            >
                              <FaEye />
                              <span>Summary</span>
                            </button>
                          )}
                          {(activeTab === 'pending' || activeTab === 'cancelled') && (
                            <button
                              onClick={() => handleViewClick(appt)}
                              title="View Details"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all cursor-pointer inline-flex items-center"
                            >
                              <FaEye />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </main>
      </div>

      {/* MODAL: REQUEST APPOINTMENT */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all cursor-pointer"
            >
              <FaXmark />
            </button>

            <div className="mb-6">
              <h3 className="text-lg font-black text-slate-900">Request New Appointment</h3>
              <p className="text-xs text-slate-500">Fill in the details below to request a consultation.</p>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <SearchableSelect
                    label="Select Specialist Doctor"
                    value={requestForm.doctorId}
                    onChange={handleRequestDoctorChange}
                    options={doctorOptions}
                    placeholder="Search doctor..."
                    error={formErrors.doctorId}
                    icon={FaUserDoctor}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Department</label>
                  <input
                    type="text"
                    required
                    readOnly
                    value={requestForm.department}
                    placeholder="Choose Doctor first"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Preferred Date</label>
                  <input
                    type="date"
                    required
                    min={getTodayDateString()}
                    value={requestForm.appointmentDate}
                    onChange={e => setRequestForm({ ...requestForm, appointmentDate: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border ${
                      formErrors.appointmentDate ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 focus:ring-sky-500/20'
                    } text-slate-800 text-xs focus:outline-none focus:ring-2`}
                  />
                  {formErrors.appointmentDate && <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.appointmentDate}</span>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Preferred Time</label>
                  <input
                    type="time"
                    required
                    value={requestForm.appointmentTime}
                    onChange={e => setRequestForm({ ...requestForm, appointmentTime: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border ${
                      formErrors.appointmentTime ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 focus:ring-sky-500/20'
                    } text-slate-800 text-xs focus:outline-none focus:ring-2`}
                  />
                  {formErrors.appointmentTime && <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.appointmentTime}</span>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Reason for Visit</label>
                <textarea
                  required
                  rows="2"
                  value={requestForm.reasonForVisit}
                  onChange={e => setRequestForm({ ...requestForm, reasonForVisit: e.target.value })}
                  placeholder="Enter reason (e.g. Weight management consultation)"
                  className={`w-full px-3 py-2.5 rounded-xl border ${
                    formErrors.reasonForVisit ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 focus:ring-sky-500/20'
                  } text-slate-805 text-xs focus:outline-none focus:ring-2`}
                />
                {formErrors.reasonForVisit && <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.reasonForVisit}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Additional Notes (Optional)</label>
                <textarea
                  rows="2"
                  value={requestForm.notes}
                  onChange={e => setRequestForm({ ...requestForm, notes: e.target.value })}
                  placeholder="Enter any additional instructions or requests..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:outline-none text-slate-800 text-xs transition-all"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid}
                  className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                >
                  Submit Appointment Request
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW DETAILS / SUMMARY */}
      {isViewModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsViewModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all cursor-pointer"
            >
              <FaXmark />
            </button>

            <div className="mb-6">
              <span className="text-[10px] text-sky-500 font-bold uppercase tracking-wider">Appointment Overview</span>
              <h3 className="text-lg font-black text-slate-900 mt-0.5">Details Summary</h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {selectedAppointment._id.toUpperCase()}</p>
            </div>

            <div className="space-y-4 text-xs">
              
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Doctor Specialist</span>
                <span className="font-bold text-slate-800 block">{selectedAppointment.doctorName}</span>
                <span className="text-[10px] text-slate-500 block">{selectedAppointment.department}</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="block text-[9px] text-slate-400 font-bold uppercase mb-1">Scheduled Date</span>
                  <span className="font-bold text-slate-700 block font-mono">
                    {selectedAppointment.appointmentDate ? new Date(selectedAppointment.appointmentDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="block text-[9px] text-slate-400 font-bold uppercase mb-1">Scheduled Time</span>
                  <span className="font-bold text-slate-700 block font-mono">{formatTime12Hour(selectedAppointment.appointmentTime)}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="block text-[9px] text-slate-400 font-bold uppercase mb-1">Status</span>
                  <span className="font-bold text-sky-600 block">{selectedAppointment.status}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Reason for Consultation</span>
                <p className="text-slate-800 leading-relaxed font-medium bg-white p-2.5 rounded-lg border border-slate-150 text-[11px]">
                  {selectedAppointment.reasonForVisit}
                </p>
              </div>

              {selectedAppointment.notes && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Clinical Notes</span>
                  <p className="text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-150 text-[11px]">
                    {selectedAppointment.notes}
                  </p>
                </div>
              )}

            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-650 transition-all cursor-pointer"
              >
                Close Summary
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: RESCHEDULE REQUEST */}
      {isRescheduleModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsRescheduleModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all cursor-pointer"
            >
              <FaXmark />
            </button>

            <div className="mb-6">
              <h3 className="text-lg font-black text-slate-900">Reschedule Appointment</h3>
              <p className="text-xs text-slate-500">Submit a request with a new preferred date and time slot.</p>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">New Date</label>
                  <input
                    type="date"
                    required
                    value={rescheduleForm.appointmentDate}
                    onChange={e => setRescheduleForm({ ...rescheduleForm, appointmentDate: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border ${
                      formErrors.appointmentDate ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 focus:ring-sky-500/20'
                    } text-slate-800 text-xs focus:outline-none focus:ring-2`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">New Time</label>
                  <input
                    type="time"
                    required
                    value={rescheduleForm.appointmentTime}
                    onChange={e => setRescheduleForm({ ...rescheduleForm, appointmentTime: e.target.value })}
                    className={`w-full px-3 py-2.5 rounded-xl border ${
                      formErrors.appointmentTime ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 focus:ring-sky-500/20'
                    } text-slate-800 text-xs focus:outline-none focus:ring-2`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Reason for Rescheduling</label>
                <textarea
                  rows="2"
                  value={rescheduleForm.notes}
                  onChange={e => setRescheduleForm({ ...rescheduleForm, notes: e.target.value })}
                  placeholder="Enter reason for reschedule request (e.g. Schedule conflict)..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:outline-none text-slate-800 text-xs transition-all"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsRescheduleModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                >
                  Request Reschedule
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM CANCEL */}
      {isCancelModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4 text-xl">
              <FaBan />
            </div>
            
            <h3 className="text-base font-black text-slate-950 mb-2">Cancel Appointment?</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to cancel this appointment?<br />
              <span className="font-bold text-slate-800">Doctor: {selectedAppointment.doctorName}</span>
              <br />This action can be review-locked and cannot be undone.
            </p>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 transition-all cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleCancelConfirm}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
