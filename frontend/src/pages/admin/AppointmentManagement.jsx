import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaUser, 
  FaPlus, 
  FaMagnifyingGlass, 
  FaPen, 
  FaTrash, 
  FaEye, 
  FaPowerOff, 
  FaCircleCheck, 
  FaCircleXmark, 
  FaCircleInfo, 
  FaXmark, 
  FaPhone, 
  FaEnvelope, 
  FaLock, 
  FaCalendar, 
  FaVenusMars, 
  FaNotesMedical, 
  FaHeartPulse, 
  FaUtensils, 
  FaWeightScale, 
  FaUserDoctor,
  FaShieldHalved,
  FaCalendarCheck,
  FaCalendarDays,
  FaClock,
  FaBuilding,
  FaCheck,
  FaBan,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa6';
import DashboardLayout from '../../layouts/DashboardLayout';

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

// Custom Searchable Select Component for Patients/Doctors Selectors
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
      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border ${
            error 
              ? 'border-rose-500 focus:ring-rose-500/20' 
              : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/30'
          } text-left text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-between min-h-[38px] transition-all duration-205`}
        >
          <div className="flex items-center space-x-2.5 truncate">
            {Icon && <Icon className="text-slate-400 text-xs shrink-0" />}
            <span className={value ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400'}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <span className="text-slate-400 text-[9px] shrink-0 font-semibold select-none ml-2">
            {isOpen ? '▲' : '▼'}
          </span>
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden max-h-56 flex flex-col">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500 text-slate-900 dark:text-white text-xs"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto flex-1 py-1 divide-y divide-slate-50 dark:divide-slate-800/40">
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
                  className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs transition-colors cursor-pointer block truncate ${
                    opt.value === value 
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold' 
                      : 'text-slate-700 dark:text-slate-300'
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

export default function AppointmentManagement() {
  const navigate = useNavigate();

  // Core lists state
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedFilterDate, setSelectedFilterDate] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Calendar states
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Toast notification
  const [notification, setNotification] = useState(null);

  // Recent Activity Log state
  const [activityLogs, setActivityLogs] = useState(() => {
    const saved = localStorage.getItem('carepath_appt_activities');
    if (saved) return JSON.parse(saved);
    return [
      { id: 1, action: 'Obesity registry synced', time: '10 mins ago', type: 'info' },
      { id: 2, action: 'Weekly schedule initialized', time: '1 hour ago', type: 'success' }
    ];
  });

  // Forms state
  const [addForm, setAddForm] = useState({
    patientId: '',
    doctorId: '',
    department: '',
    appointmentDate: '',
    appointmentTime: '',
    reasonForVisit: '',
    notes: ''
  });

  const [editForm, setEditForm] = useState({
    doctorId: '',
    department: '',
    appointmentDate: '',
    appointmentTime: '',
    status: '',
    notes: ''
  });

  const [formErrors, setFormErrors] = useState({});

  // Sidebar Configuration
  const menuItems = [
    { label: 'Dashboard', icon: FaShieldHalved, onClick: () => navigate('/admin/dashboard') },
    { label: 'Doctors', icon: FaUserDoctor, onClick: () => navigate('/admin/doctors') },
    { label: 'Patients', icon: FaUser, onClick: () => navigate('/admin/patients') },
    { label: 'Appointments', icon: FaCalendarCheck, active: true, onClick: () => navigate('/admin/appointments') }
  ];

  // Helper notification log trigger
  const triggerNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const addActivityLog = (action, type = 'info') => {
    const newLog = {
      id: Date.now(),
      action,
      time: 'Just now',
      type
    };
    const updated = [newLog, ...activityLogs.slice(0, 4)];
    setActivityLogs(updated);
    localStorage.setItem('carepath_appt_activities', JSON.stringify(updated));
  };

  // Fetch lists
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [apptRes, patRes, docRes] = await Promise.all([
        axios.get('http://localhost:5000/api/appointments', { headers }),
        axios.get('http://localhost:5000/api/patients', { headers }),
        axios.get('http://localhost:5000/api/doctors', { headers })
      ]);

      if (apptRes.data.success) setAppointments(apptRes.data.data);
      if (patRes.data.success) setPatients(patRes.data.data);
      if (docRes.data.success) setDoctors(docRes.data.data);
    } catch (err) {
      console.error(err);
      triggerNotification('Failed to fetch appointments & lookup records.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter & Sort Logic
  const filteredAppointments = appointments.filter(app => {
    const pName = app.patientName ? app.patientName.toLowerCase() : '';
    const dName = app.doctorName ? app.doctorName.toLowerCase() : '';
    const search = searchTerm.toLowerCase();
    const matchesSearch = pName.includes(search) || dName.includes(search) || app._id.toLowerCase().includes(search);

    const matchesStatus = selectedStatus ? app.status.toLowerCase() === selectedStatus.toLowerCase() : true;
    const matchesDoctor = selectedDoctorId ? app.doctorId === selectedDoctorId : true;
    const matchesDept = selectedDept ? app.department === selectedDept : true;

    // Direct Calendar date selection filter or date search filter
    let matchesDate = true;
    if (selectedCalendarDate) {
      const calDateString = new Date(selectedCalendarDate).toISOString().split('T')[0];
      const appDateString = new Date(app.appointmentDate).toISOString().split('T')[0];
      matchesDate = calDateString === appDateString;
    } else if (selectedFilterDate) {
      const filterDateString = new Date(selectedFilterDate).toISOString().split('T')[0];
      const appDateString = new Date(app.appointmentDate).toISOString().split('T')[0];
      matchesDate = filterDateString === appDateString;
    }

    return matchesSearch && matchesStatus && matchesDoctor && matchesDept && matchesDate;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    if (sortBy === 'upcoming') return new Date(a.appointmentDate) - new Date(b.appointmentDate);
    return 0;
  });

  // Calculate statistics
  const totalCount = appointments.length;
  const pendingCount = appointments.filter(a => a.status === 'Pending').length;
  const confirmedCount = appointments.filter(a => a.status === 'Confirmed').length;
  
  // Completed today count logic
  const todayStr = new Date().toISOString().split('T')[0];
  const completedTodayCount = appointments.filter(a => {
    const apptDateStr = new Date(a.appointmentDate).toISOString().split('T')[0];
    return a.status === 'Completed' && apptDateStr === todayStr;
  }).length;

  // Search options mapping
  const patientOptions = patients.map(p => ({
    label: `${p.fullName} (Age: ${p.dob ? (new Date().getFullYear() - new Date(p.dob).getFullYear()) : 'N/A'} • ${p.email})`,
    value: p._id
  }));

  const doctorOptions = doctors.map(d => ({
    label: `${d.fullName} (${d.department} • ${d.specialization})`,
    value: d._id
  }));

  const departments = [...new Set(doctors.map(d => d.department))];

  // Auto prefill department when doctor is chosen in Add Form
  const handleAddDoctorChange = (docId) => {
    const chosenDoctor = doctors.find(d => d._id === docId);
    setAddForm(prev => ({
      ...prev,
      doctorId: docId,
      department: chosenDoctor ? chosenDoctor.department : ''
    }));
    if (formErrors.doctorId) setFormErrors(prev => ({ ...prev, doctorId: '', department: '' }));
  };

  // Add submission handler
  const openAddModal = () => {
    setAddForm({
      patientId: '',
      doctorId: '',
      department: '',
      appointmentDate: '',
      appointmentTime: '',
      reasonForVisit: '',
      notes: ''
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!addForm.patientId) errors.patientId = 'Patient selection is required';
    if (!addForm.doctorId) errors.doctorId = 'Doctor assignment is required';
    if (!addForm.department) errors.department = 'Department is required';
    if (!addForm.appointmentDate) errors.appointmentDate = 'Appointment date is required';
    if (!addForm.appointmentTime) errors.appointmentTime = 'Time schedule is required';
    if (!addForm.reasonForVisit) errors.reasonForVisit = 'Reason for consultation is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      triggerNotification('Please correct validation errors.', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/appointments', addForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setIsAddModalOpen(false);
        triggerNotification('Appointment scheduled successfully.');
        addActivityLog(`Appointment created for patient`, 'success');
        fetchInitialData();
      }
    } catch (err) {
      console.error(err);
      triggerNotification(err.response?.data?.message || 'Failed to create appointment.', 'error');
    }
  };

  // Status handlers (approve, reject, cancel, complete)
  const handleApprove = async (appt) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`http://localhost:5000/api/appointments/${appt._id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        triggerNotification('Appointment approved & confirmed.');
        addActivityLog(`Appointment Approved for ${appt.patientName}`, 'success');
        fetchInitialData();
      }
    } catch (err) {
      console.error(err);
      triggerNotification('Failed to approve appointment.', 'error');
    }
  };

  const handleReject = async (appt) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`http://localhost:5000/api/appointments/${appt._id}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        triggerNotification('Appointment status marked as Rejected.');
        addActivityLog(`Appointment Rejected for ${appt.patientName}`, 'error');
        fetchInitialData();
      }
    } catch (err) {
      console.error(err);
      triggerNotification('Failed to reject appointment.', 'error');
    }
  };

  const handleCancelStatus = async (appt) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/appointments/${appt._id}`, { status: 'Cancelled' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        triggerNotification('Appointment cancelled.');
        addActivityLog(`Appointment Cancelled for ${appt.patientName}`, 'info');
        fetchInitialData();
      }
    } catch (err) {
      console.error(err);
      triggerNotification('Failed to cancel appointment.', 'error');
    }
  };

  // Delete handlers
  const handleDeleteClick = (appt) => {
    setSelectedAppointment(appt);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`http://localhost:5000/api/appointments/${selectedAppointment._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setIsDeleteModalOpen(false);
        triggerNotification('Appointment record deleted.');
        fetchInitialData();
      }
    } catch (err) {
      console.error(err);
      triggerNotification('Failed to delete appointment.', 'error');
    }
  };

  // View modal handler
  const handleViewClick = (appt) => {
    setSelectedAppointment(appt);
    setIsViewModalOpen(true);
  };

  // Edit handlers
  const handleEditClick = (appt) => {
    setSelectedAppointment(appt);
    setEditForm({
      doctorId: appt.doctorId,
      department: appt.department,
      appointmentDate: appt.appointmentDate ? new Date(appt.appointmentDate).toISOString().split('T')[0] : '',
      appointmentTime: appt.appointmentTime,
      status: appt.status,
      notes: appt.notes || ''
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!editForm.doctorId) errors.doctorId = 'Doctor is required';
    if (!editForm.department) errors.department = 'Department is required';
    if (!editForm.appointmentDate) errors.appointmentDate = 'Appointment date is required';
    if (!editForm.appointmentTime) errors.appointmentTime = 'Appointment time is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      triggerNotification('Please correct validation errors.', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/appointments/${selectedAppointment._id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setIsEditModalOpen(false);
        triggerNotification('Appointment updated successfully.');
        addActivityLog(`Appointment edited for ${selectedAppointment.patientName}`, 'info');
        fetchInitialData();
      }
    } catch (err) {
      console.error(err);
      triggerNotification(err.response?.data?.message || 'Failed to update appointment.', 'error');
    }
  };

  // Monthly Calendar logic helpers
  const getDaysInMonth = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Align to Monday start (0=Mon, 6=Sun)
    
    const days = [];
    // Prev month padding days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    // Next month padding days
    const totalSlots = 42; // standard grid size
    const nextPaddingCount = totalSlots - days.length;
    for (let i = 1; i <= nextPaddingCount; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    return days;
  };

  const getAppointmentsForCalendarDate = (date) => {
    const dStr = new Date(date).toISOString().split('T')[0];
    return appointments.filter(a => new Date(a.appointmentDate).toISOString().split('T')[0] === dStr);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const calendarDays = getDaysInMonth(currentCalendarMonth);

  const prevMonth = () => {
    setCurrentCalendarMonth(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentCalendarMonth(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() + 1, 1));
  };

  // Today's schedule data list
  const todaySchedule = appointments.filter(a => {
    const aDateStr = new Date(a.appointmentDate).toISOString().split('T')[0];
    return aDateStr === todayStr;
  }).sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime));

  return (
    <DashboardLayout role="admin" menuItems={menuItems}>
      
      {/* Toast notifications */}
      {notification && (
        <div className="fixed top-6 right-6 z-[100] flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-xl border bg-white dark:bg-slate-900 animate-slide-in border-slate-200 dark:border-slate-800">
          <span className={`w-2.5 h-2.5 rounded-full ${notification.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{notification.message}</p>
        </div>
      )}

      <div className="space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Appointment Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Monitor, manage and schedule patient appointments.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-white text-xs font-bold transition-all duration-200 shadow-lg shadow-slate-900/10 active:scale-[0.98] cursor-pointer"
          >
            <FaPlus className="text-xs" />
            <span>Create Appointment</span>
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Total Appointments</span>
                <h3 className="text-3xl font-black mt-2 text-slate-900 dark:text-white">{totalCount}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white shadow-lg">
                <FaCalendarDays className="text-lg" />
              </div>
            </div>
            <div className="flex items-center space-x-1.5 mt-4 text-[10px] text-slate-400">
              <FaCircleInfo className="text-blue-500" />
              <span>Overall scheduler registry</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Pending Appointments</span>
                <h3 className="text-3xl font-black mt-2 text-slate-900 dark:text-white">{pendingCount}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-lg">
                <FaClock className="text-lg" />
              </div>
            </div>
            <div className="flex items-center space-x-1.5 mt-4 text-[10px] text-slate-400">
              <FaCircleInfo className="text-amber-500" />
              <span>Awaiting admin review</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Confirmed Appointments</span>
                <h3 className="text-3xl font-black mt-2 text-slate-900 dark:text-white">{confirmedCount}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-lg">
                <FaCircleCheck className="text-lg" />
              </div>
            </div>
            <div className="flex items-center space-x-1.5 mt-4 text-[10px] text-slate-400">
              <FaCircleInfo className="text-indigo-500" />
              <span>Confirmed booking profiles</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Completed Today</span>
                <h3 className="text-3xl font-black mt-2 text-slate-900 dark:text-white">{completedTodayCount}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-lg">
                <FaCheck className="text-lg" />
              </div>
            </div>
            <div className="flex items-center space-x-1.5 mt-4 text-[10px] text-slate-400">
              <FaCircleInfo className="text-emerald-500" />
              <span>Finished consultations today</span>
            </div>
          </div>
        </div>

        {/* Dashboard Panels Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Calendar Widget Panel */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-slate-850 dark:text-white tracking-wide">Monthly Calendar</h3>
              <div className="flex items-center space-x-1">
                <button 
                  onClick={prevMonth}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-800 cursor-pointer"
                >
                  <FaChevronLeft className="text-[10px]" />
                </button>
                <span className="text-xs font-bold px-2 py-0.5 select-none bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg">
                  {currentCalendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </span>
                <button 
                  onClick={nextMonth}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-800 cursor-pointer"
                >
                  <FaChevronRight className="text-[10px]" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-1 font-bold text-[9px] text-slate-400 uppercase tracking-widest">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((day, idx) => {
                const dateAppts = getAppointmentsForCalendarDate(day.date);
                const hasAppts = dateAppts.length > 0;
                const isSelected = selectedCalendarDate && 
                  day.date.getDate() === selectedCalendarDate.getDate() &&
                  day.date.getMonth() === selectedCalendarDate.getMonth() &&
                  day.date.getFullYear() === selectedCalendarDate.getFullYear();
                
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCalendarDate(null);
                      } else {
                        setSelectedCalendarDate(day.date);
                      }
                    }}
                    className={`aspect-square rounded-xl p-1 flex flex-col justify-between items-center text-xs font-bold transition-all relative border cursor-pointer ${
                      day.isCurrentMonth 
                        ? 'text-slate-800 dark:text-slate-200' 
                        : 'text-slate-300 dark:text-slate-700/60'
                    } ${
                      isSelected 
                        ? 'bg-slate-950 dark:bg-slate-100 text-white dark:text-slate-950 shadow-md border-transparent scale-[1.05]'
                        : isToday(day.date)
                          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5'
                          : 'border-slate-100 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span>{day.date.getDate()}</span>
                    {hasAppts && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-500' : 'bg-indigo-500 animate-pulse'}`} />
                    )}
                  </button>
                );
              })}
            </div>
            
            {selectedCalendarDate && (
              <div className="mt-4 flex justify-between items-center text-xs p-2 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                <span className="text-slate-500">Filtered: <strong className="text-slate-800 dark:text-slate-200">{selectedCalendarDate.toLocaleDateString()}</strong></span>
                <button 
                  onClick={() => setSelectedCalendarDate(null)}
                  className="font-bold text-indigo-500 hover:underline cursor-pointer"
                >
                  Reset Date Filter
                </button>
              </div>
            )}
          </div>

          {/* Today's Schedule Timeline Panel */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm">
            <h3 className="font-bold text-sm tracking-wide mb-4">Today's Schedule</h3>
            <div className="overflow-y-auto max-h-[260px] pr-1 space-y-3.5">
              {todaySchedule.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs flex flex-col justify-center items-center gap-1.5 h-full">
                  <FaCalendarDays className="text-lg opacity-40" />
                  <span>No appointments scheduled for today.</span>
                </div>
              ) : (
                todaySchedule.map((appt) => (
                  <div key={appt._id} className="relative pl-6 border-l border-slate-200 dark:border-slate-800 flex flex-col gap-1">
                    <span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-900" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-slate-900 dark:text-white font-mono flex items-center gap-1">
                        <FaClock className="text-[10px] text-slate-400" /> {formatTime12Hour(appt.appointmentTime)}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                        appt.status === 'Confirmed' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' :
                        appt.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                        appt.status === 'Cancelled' ? 'bg-slate-500/10 text-slate-600 border-slate-500/20' :
                        appt.status === 'Rejected' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                        'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}>{appt.status}</span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-750 dark:text-slate-350">
                      Pat: <span className="font-semibold text-slate-600 dark:text-slate-400">{appt.patientName}</span>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Doc: <span className="font-semibold text-slate-500">{appt.doctorName} ({appt.department})</span>
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Action Activity logs */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm">
            <h3 className="font-bold text-sm tracking-wide mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {activityLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/30">
                  <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                    log.type === 'success' ? 'bg-emerald-500' : log.type === 'error' ? 'bg-rose-500' : 'bg-sky-500'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-relaxed text-slate-700 dark:text-slate-300 break-words">{log.action}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">{log.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Search, Filter Tools */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            
            {/* Search Input */}
            <div className="flex-1 relative group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <FaMagnifyingGlass className="text-xs" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Patient or Doctor Name..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60 text-slate-900 dark:text-white placeholder-slate-400 text-xs transition-all shadow-inner"
              />
            </div>

            {/* Filter selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 min-h-[38px]"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 min-h-[38px]"
                >
                  <option value="">All Doctors</option>
                  {doctors.map(doc => (
                    <option key={doc._id} value={doc._id}>{doc.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 min-h-[38px]"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept, i) => (
                    <option key={i} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <input
                  type="date"
                  value={selectedFilterDate}
                  onChange={(e) => setSelectedFilterDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 min-h-[38px]"
                />
              </div>

              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 min-h-[38px]"
                >
                  <option value="newest">Sort by Newest</option>
                  <option value="oldest">Sort by Oldest</option>
                  <option value="upcoming">Sort by Upcoming</option>
                </select>
              </div>
            </div>

          </div>

          {/* Reset Filters Section */}
          {(searchTerm || selectedStatus || selectedDoctorId || selectedDept || selectedFilterDate || selectedCalendarDate) && (
            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <span>Showing {filteredAppointments.length} of {appointments.length} appointments</span>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStatus('');
                  setSelectedDoctorId('');
                  setSelectedDept('');
                  setSelectedFilterDate('');
                  setSelectedCalendarDate(null);
                  setSortBy('newest');
                }}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Appointment Table */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="py-12 space-y-4">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-3/4 mx-auto" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-5/6 mx-auto" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-2/3 mx-auto" />
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                No appointments found matching the criteria.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                    <th className="pb-3 font-semibold">Appointment ID</th>
                    <th className="pb-3 font-semibold">Patient Name</th>
                    <th className="pb-3 font-semibold">Doctor Name</th>
                    <th className="pb-3 font-semibold">Department</th>
                    <th className="pb-3 font-semibold">Appointment Date</th>
                    <th className="pb-3 font-semibold">Appointment Time</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Created Date</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAppointments.map((appt) => (
                    <tr key={appt._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-150">
                      <td className="py-3.5 font-mono font-bold text-slate-500 dark:text-slate-400">
                        {appt._id.substring(appt._id.length - 8).toUpperCase()}
                      </td>
                      <td className="py-3.5 font-bold text-slate-900 dark:text-white">
                        {appt.patientName}
                      </td>
                      <td className="py-3.5 font-bold text-slate-900 dark:text-white">
                        {appt.doctorName}
                      </td>
                      <td className="py-3.5 text-slate-500 dark:text-slate-400">
                        <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                          {appt.department}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-500 dark:text-slate-400 font-mono">
                        {appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3.5 text-slate-500 dark:text-slate-400 font-mono">
                        {formatTime12Hour(appt.appointmentTime)}
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          appt.status === 'Confirmed' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' :
                          appt.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                          appt.status === 'Cancelled' ? 'bg-slate-500/10 text-slate-600 border-slate-500/20' :
                          appt.status === 'Rejected' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                          'bg-amber-500/10 text-amber-600 border-amber-500/20' // Pending
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            appt.status === 'Confirmed' ? 'bg-indigo-500' :
                            appt.status === 'Completed' ? 'bg-emerald-500' :
                            appt.status === 'Cancelled' ? 'bg-slate-400' :
                            appt.status === 'Rejected' ? 'bg-rose-500' :
                            'bg-amber-500'
                          }`} />
                          <span>{appt.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-400 dark:text-slate-500 font-mono">
                        {appt.createdAt ? new Date(appt.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleViewClick(appt)}
                          title="View Details"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-600 transition-all cursor-pointer inline-flex items-center"
                        >
                          <FaEye className="text-xs" />
                        </button>
                        <button
                          onClick={() => handleEditClick(appt)}
                          title="Edit"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600 transition-all cursor-pointer inline-flex items-center"
                        >
                          <FaPen className="text-xs" />
                        </button>
                        {appt.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(appt)}
                              title="Approve & Confirm"
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 transition-all cursor-pointer inline-flex items-center"
                            >
                              <FaCheck className="text-xs" />
                            </button>
                            <button
                              onClick={() => handleReject(appt)}
                              title="Reject"
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 transition-all cursor-pointer inline-flex items-center"
                            >
                              <FaXmark className="text-xs" />
                            </button>
                          </>
                        )}
                        {appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
                          <button
                            onClick={() => handleCancelStatus(appt)}
                            title="Cancel Appointment"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-500 hover:text-white dark:hover:bg-slate-600 transition-all cursor-pointer inline-flex items-center"
                          >
                            <FaBan className="text-xs" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteClick(appt)}
                          title="Delete"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 transition-all cursor-pointer inline-flex items-center"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* MODAL: VIEW DETAILS */}
        {isViewModalOpen && selectedAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-2xl relative">
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer"
              >
                <FaXmark />
              </button>

              <div className="mb-6">
                <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-mono font-bold tracking-widest uppercase">Appointment Profile</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">Details Overview</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">ID: {selectedAppointment._id.toUpperCase()}</p>
              </div>

              <div className="space-y-4 text-xs">
                
                {/* Patient/Doctor details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Patient Details</span>
                    <span className="font-bold text-slate-900 dark:text-white block">{selectedAppointment.patientName}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{selectedAppointment.patientEmail}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Doctor Details</span>
                    <span className="font-bold text-slate-900 dark:text-white block">{selectedAppointment.doctorName}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{selectedAppointment.doctorEmail}</span>
                  </div>
                </div>

                {/* Logistics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 text-center">
                    <span className="block text-[9px] text-slate-400 font-bold uppercase mb-1">Date</span>
                    <span className="font-bold text-slate-850 dark:text-slate-200 block font-mono">
                      {selectedAppointment.appointmentDate ? new Date(selectedAppointment.appointmentDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 text-center">
                    <span className="block text-[9px] text-slate-400 font-bold uppercase mb-1">Time Schedule</span>
                    <span className="font-bold text-slate-850 dark:text-slate-200 block font-mono">{formatTime12Hour(selectedAppointment.appointmentTime)}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 text-center">
                    <span className="block text-[9px] text-slate-400 font-bold uppercase mb-1">Department</span>
                    <span className="font-bold text-slate-850 dark:text-slate-200 block truncate">{selectedAppointment.department}</span>
                  </div>
                </div>

                {/* Patient Health Indicators (BMIs / predictions) */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Patient Health Trackers</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-2xl bg-cyan-500/5 dark:bg-cyan-950/20 border border-cyan-500/10 text-center">
                      <FaHeartPulse className="mx-auto text-cyan-500 mb-1" />
                      <span className="block text-[9px] text-slate-450 font-bold uppercase">BMI</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white font-mono">{selectedAppointment.latestBmi || 'N/A'}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/10 text-center">
                      <FaNotesMedical className="mx-auto text-purple-500 mb-1" />
                      <span className="block text-[9px] text-slate-450 font-bold uppercase">Prediction</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white truncate block">{selectedAppointment.latestPrediction || 'N/A'}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/10 text-center">
                      <FaUtensils className="mx-auto text-amber-500 mb-1" />
                      <span className="block text-[9px] text-slate-450 font-bold uppercase">Diet/Meal Plan</span>
                      <span className="text-[10px] font-bold text-slate-900 dark:text-white truncate block" title={selectedAppointment.latestMealPlan}>{selectedAppointment.latestMealPlan || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Reason for Visit</span>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800 text-[11px]">
                    {selectedAppointment.reasonForVisit}
                  </p>
                </div>

                {selectedAppointment.notes && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Consultation / Admin Notes</span>
                    <p className="text-slate-600 dark:text-slate-350 leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800 text-[11px] whitespace-pre-line">
                      {selectedAppointment.notes}
                    </p>
                  </div>
                )}

              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                >
                  Close Record
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL: CREATE APPOINTMENT */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-2xl relative">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer"
              >
                <FaXmark />
              </button>

              <div className="mb-6">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Create Appointment</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Schedule a new consultation for a registered patient.</p>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <SearchableSelect
                      label="Select Patient"
                      value={addForm.patientId}
                      onChange={(patId) => setAddForm({ ...addForm, patientId: patId })}
                      options={patientOptions}
                      placeholder="Search patient..."
                      error={formErrors.patientId}
                      icon={FaUser}
                    />
                  </div>

                  <div>
                    <SearchableSelect
                      label="Assign Medical Doctor"
                      value={addForm.doctorId}
                      onChange={handleAddDoctorChange}
                      options={doctorOptions}
                      placeholder="Search doctor specialist..."
                      error={formErrors.doctorId}
                      icon={FaUserDoctor}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Department</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><FaBuilding className="text-xs" /></span>
                      <input
                        type="text"
                        required
                        readOnly
                        value={addForm.department}
                        placeholder="Select Doctor first"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-300 text-xs focus:outline-none"
                      />
                    </div>
                    {formErrors.department && <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.department}</span>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Appointment Date</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><FaCalendar className="text-xs" /></span>
                      <input
                        type="date"
                        required
                        value={addForm.appointmentDate}
                        onChange={(e) => setAddForm({ ...addForm, appointmentDate: e.target.value })}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border ${
                          formErrors.appointmentDate ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/30'
                        } focus:outline-none focus:ring-2 text-slate-700 dark:text-slate-300 text-xs`}
                      />
                    </div>
                    {formErrors.appointmentDate && <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.appointmentDate}</span>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Appointment Time</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><FaClock className="text-xs" /></span>
                      <input
                        type="time"
                        required
                        value={addForm.appointmentTime}
                        onChange={(e) => setAddForm({ ...addForm, appointmentTime: e.target.value })}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border ${
                          formErrors.appointmentTime ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/30'
                        } focus:outline-none focus:ring-2 text-slate-700 dark:text-slate-350 text-xs`}
                      />
                    </div>
                    {formErrors.appointmentTime && <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.appointmentTime}</span>}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Reason for Visit</label>
                  <input
                    type="text"
                    required
                    value={addForm.reasonForVisit}
                    onChange={(e) => setAddForm({ ...addForm, reasonForVisit: e.target.value })}
                    placeholder="Enter reason for visit (e.g. Weight log review, dietary consultation)"
                    className={`w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border ${
                      formErrors.reasonForVisit ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/30'
                    } focus:outline-none focus:ring-2 text-slate-905 dark:text-white placeholder-slate-400 text-xs`}
                  />
                  {formErrors.reasonForVisit && <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.reasonForVisit}</span>}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Additional Notes</label>
                  <textarea
                    rows="2"
                    value={addForm.notes}
                    onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                    placeholder="Add any specific clinical notes or instructions..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/65 text-slate-900 dark:text-white placeholder-slate-400 text-xs"
                  />
                </div>

                <div className="pt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-white text-xs font-bold transition-all shadow-lg active:scale-[0.98] cursor-pointer"
                  >
                    Create Appointment
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDIT APPOINTMENT */}
        {isEditModalOpen && selectedAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-2xl relative">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer"
              >
                <FaXmark />
              </button>

              <div className="mb-6">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Edit Appointment</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Modify scheduled details for patient {selectedAppointment.patientName}.</p>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <SearchableSelect
                      label="Assign Medical Doctor"
                      value={editForm.doctorId}
                      onChange={(docId) => {
                        const doc = doctors.find(d => d._id === docId);
                        setEditForm({
                          ...editForm,
                          doctorId: docId,
                          department: doc ? doc.department : ''
                        });
                      }}
                      options={doctorOptions}
                      placeholder="Select Doctor Specialist"
                      error={formErrors.doctorId}
                      icon={FaUserDoctor}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Department</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><FaBuilding className="text-xs" /></span>
                      <input
                        type="text"
                        readOnly
                        required
                        value={editForm.department}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-300 text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Appointment Date</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><FaCalendar className="text-xs" /></span>
                      <input
                        type="date"
                        required
                        value={editForm.appointmentDate}
                        onChange={(e) => setEditForm({ ...editForm, appointmentDate: e.target.value })}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border ${
                          formErrors.appointmentDate ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/30'
                        } focus:outline-none focus:ring-2 text-slate-700 dark:text-slate-300 text-xs`}
                      />
                    </div>
                    {formErrors.appointmentDate && <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.appointmentDate}</span>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Appointment Time</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><FaClock className="text-xs" /></span>
                      <input
                        type="time"
                        required
                        value={editForm.appointmentTime}
                        onChange={(e) => setEditForm({ ...editForm, appointmentTime: e.target.value })}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border ${
                          formErrors.appointmentTime ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/30'
                        } focus:outline-none focus:ring-2 text-slate-700 dark:text-slate-350 text-xs`}
                      />
                    </div>
                    {formErrors.appointmentTime && <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.appointmentTime}</span>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Appointment Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-705 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 min-h-[38px]"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Consultation Notes / Instructions</label>
                  <textarea
                    rows="3"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/65 text-slate-900 dark:text-white text-xs"
                  />
                </div>

                <div className="pt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-white text-xs font-bold transition-all shadow-lg active:scale-[0.98] cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* MODAL: CONFIRM DELETE */}
        {isDeleteModalOpen && selectedAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-2xl relative text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 flex items-center justify-center mx-auto mb-4 text-xl">
                <FaTrash />
              </div>
              
              <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">Delete Appointment?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Are you sure you want to delete this appointment?<br />
                <span className="font-bold text-slate-805 dark:text-slate-200">Patient: {selectedAppointment.patientName}</span>
                <br />This action is permanent and cannot be undone.
              </p>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-lg active:scale-[0.98] cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
