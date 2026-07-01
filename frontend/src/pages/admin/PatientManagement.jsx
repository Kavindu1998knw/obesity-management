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
  FaCalendarCheck
} from 'react-icons/fa6';
import DashboardLayout from '../../layouts/DashboardLayout';

// Custom Searchable Select (Reusable component for dropdown logic)
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

export default function PatientManagement() {
  const navigate = useNavigate();

  // State lists
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // View modal tab state
  const [viewTab, setViewTab] = useState('overview');

  // Notification state
  const [notification, setNotification] = useState(null);

  // Form states
  const [addForm, setAddForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    medicalHistory: '',
    assignedDoctorId: '',
    password: '',
    confirmPassword: ''
  });

  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    gender: '',
    medicalHistory: '',
    assignedDoctorId: '',
    status: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showAddConfirmPassword, setShowAddConfirmPassword] = useState(false);

  // Sidebar navigation configuration
  const menuItems = [
    { label: 'Dashboard', icon: FaShieldHalved, onClick: () => navigate('/admin/dashboard') },
    { label: 'Doctors', icon: FaUserDoctor, onClick: () => navigate('/admin/doctors') },
    { label: 'Patients', icon: FaUser, active: true, onClick: () => navigate('/admin/patients') },
    { label: 'Appointments', icon: FaCalendarCheck, onClick: () => navigate('/admin/appointments') }
  ];

  // Fetch helper notifications
  const triggerNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Age calculation helper
  const calculateAge = (dobString) => {
    if (!dobString) return 'N/A';
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age >= 0 ? age : 0;
  };

  // Fetch doctors & patients
  useEffect(() => {
    fetchDoctors();
    fetchPatients();
  }, []);

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/doctors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setDoctors(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load doctors list:', err);
    }
  };

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/patients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setPatients(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load patients list:', err);
      triggerNotification('Failed to retrieve patient records.', 'error');
    }
  };

  // Filter & Sort patients logic
  const filteredPatients = patients.filter(pat => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = 
      pat.fullName.toLowerCase().includes(query) ||
      pat.email.toLowerCase().includes(query) ||
      pat._id.toLowerCase().includes(query) ||
      pat.phone.toLowerCase().includes(query);

    const matchesGender = selectedGender ? pat.gender === selectedGender : true;
    const matchesDoctor = selectedDoctorId ? pat.assignedDoctorId === selectedDoctorId : true;
    const matchesStatus = selectedStatus ? pat.status.toLowerCase() === selectedStatus.toLowerCase() : true;

    return matchesSearch && matchesGender && matchesDoctor && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    if (sortBy === 'oldest') return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
    if (sortBy === 'alphabetical') return a.fullName.localeCompare(b.fullName);
    return 0;
  });

  // Password strength logic
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { label: 'None', barColorClass: 'bg-slate-200 w-0', colorClass: 'text-slate-400' };
    if (pwd.length < 8) return { label: 'Very Weak (Min. 8 chars)', barColorClass: 'bg-rose-500 w-1/4', colorClass: 'text-rose-500' };
    
    let score = 0;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    switch (score) {
      case 0:
      case 1:
        return { label: 'Weak', barColorClass: 'bg-amber-500 w-2/4', colorClass: 'text-amber-500' };
      case 2:
        return { label: 'Medium', barColorClass: 'bg-sky-500 w-3/4', colorClass: 'text-sky-500' };
      case 3:
      default:
        return { label: 'Strong', barColorClass: 'bg-emerald-500 w-full', colorClass: 'text-emerald-500' };
    }
  };

  // Add handlers
  const openAddModal = () => {
    setAddForm({
      fullName: '',
      email: '',
      phone: '',
      dob: '',
      gender: '',
      medicalHistory: '',
      assignedDoctorId: '',
      password: '',
      confirmPassword: ''
    });
    setFormErrors({});
    setShowAddPassword(false);
    setShowAddConfirmPassword(false);
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!addForm.fullName) errors.fullName = 'Full Name is required';
    if (!addForm.email) errors.email = 'Email Address is required';
    if (!addForm.phone) errors.phone = 'Phone number is required';
    if (!addForm.dob) errors.dob = 'Date of birth is required';
    if (!addForm.gender) errors.gender = 'Gender selection is required';
    
    if (!addForm.password) {
      errors.password = 'Password is required';
    } else if (addForm.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    if (!addForm.confirmPassword) {
      errors.confirmPassword = 'Password confirmation is required';
    } else if (addForm.password !== addForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      triggerNotification('Please correct validation errors.', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/patients', addForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setIsAddModalOpen(false);
        triggerNotification('Patient registered successfully.');
        fetchPatients();
      }
    } catch (err) {
      console.error(err);
      triggerNotification(err.response?.data?.message || 'Failed to create patient record.', 'error');
    }
  };

  // Edit handlers
  const handleEditClick = (pat) => {
    setSelectedPatient(pat);
    setEditForm({
      fullName: pat.fullName,
      email: pat.email,
      phone: pat.phone,
      dob: pat.dob ? new Date(pat.dob).toISOString().split('T')[0] : '',
      gender: pat.gender,
      medicalHistory: pat.medicalHistory || '',
      assignedDoctorId: pat.assignedDoctorId || '',
      status: pat.status.charAt(0).toUpperCase() + pat.status.slice(1) // Capitalize
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!editForm.fullName) errors.fullName = 'Full Name is required';
    if (!editForm.email) errors.email = 'Email Address is required';
    if (!editForm.phone) errors.phone = 'Phone number is required';
    if (!editForm.dob) errors.dob = 'Date of birth is required';
    if (!editForm.gender) errors.gender = 'Gender selection is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      triggerNotification('Please correct validation errors.', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/patients/${selectedPatient._id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setIsEditModalOpen(false);
        triggerNotification('Patient details updated successfully.');
        fetchPatients();
      }
    } catch (err) {
      console.error(err);
      triggerNotification(err.response?.data?.message || 'Failed to update patient record.', 'error');
    }
  };

  // View Details handlers
  const handleViewClick = (pat) => {
    setSelectedPatient(pat);
    setViewTab('overview');
    setIsViewModalOpen(true);
  };

  // Status toggle handler
  const handleToggleStatus = async (pat) => {
    const isCurrentlyActive = pat.status.toLowerCase() === 'active';
    const action = isCurrentlyActive ? 'deactivate' : 'activate';
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`http://localhost:5000/api/patients/${pat._id}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        triggerNotification(`Patient is now ${isCurrentlyActive ? 'Inactive' : 'Active'}.`);
        fetchPatients();
      }
    } catch (err) {
      console.error(err);
      triggerNotification('Failed to toggle account status.', 'error');
    }
  };

  // Delete handlers
  const handleDeleteClick = (pat) => {
    setSelectedPatient(pat);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`http://localhost:5000/api/patients/${selectedPatient._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setIsDeleteModalOpen(false);
        triggerNotification('Patient record deleted successfully.');
        fetchPatients();
      }
    } catch (err) {
      console.error(err);
      triggerNotification('Failed to delete patient account.', 'error');
    }
  };

  // Mapping doctors to selector options
  const doctorOptions = [
    { label: 'Unassigned', value: '' },
    ...doctors.map(d => ({
      label: `${d.fullName} (${d.department} • ${d.specialization})`,
      value: d._id
    }))
  ];

  // Count stats
  const totalCount = patients.length;
  const activeCount = patients.filter(p => p.status.toLowerCase() === 'active').length;
  const assignedCount = patients.filter(p => p.assignedDoctorId).length;
  const pendingRequests = Math.round(patients.length * 0.15); // Mocked pending appointments ratio for UX

  return (
    <DashboardLayout role="admin" menuItems={menuItems}>
      
      {/* Toast Alert Wrapper (Raised z-index to clear blur filters) */}
      {notification && (
        <div className="fixed top-6 right-6 z-[100] flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-xl border bg-white dark:bg-slate-900 animate-slide-in duration-200 transition-all border-slate-200 dark:border-slate-800">
          <span className={`w-2.5 h-2.5 rounded-full ${notification.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{notification.message}</p>
        </div>
      )}

      <div className="space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Patient Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Manage all registered patients in the healthcare system.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-white text-xs font-bold transition-all duration-200 shadow-lg shadow-slate-900/10 active:scale-[0.98] cursor-pointer"
          >
            <FaPlus className="text-xs" />
            <span>Add Patient</span>
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Total Patients</span>
                <h3 className="text-3xl font-black mt-2 text-slate-900 dark:text-white">{totalCount}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white shadow-lg">
                <FaUser className="text-lg" />
              </div>
            </div>
            <div className="flex items-center space-x-1.5 mt-4 text-[10px] text-slate-400">
              <FaCircleInfo className="text-blue-500" />
              <span>Overall database count</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Active Patients</span>
                <h3 className="text-3xl font-black mt-2 text-slate-900 dark:text-white">{activeCount}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-lg">
                <FaCircleCheck className="text-lg" />
              </div>
            </div>
            <div className="flex items-center space-x-1.5 mt-4 text-[10px] text-slate-400">
              <FaCircleInfo className="text-emerald-500" />
              <span>Actively participating patients</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Assigned to Doctors</span>
                <h3 className="text-3xl font-black mt-2 text-slate-900 dark:text-white">{assignedCount}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white shadow-lg">
                <FaUserDoctor className="text-lg" />
              </div>
            </div>
            <div className="flex items-center space-x-1.5 mt-4 text-[10px] text-slate-400">
              <FaCircleInfo className="text-purple-500" />
              <span>Assigned to specialists</span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-rose-500" />
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Pending Requests</span>
                <h3 className="text-3xl font-black mt-2 text-slate-900 dark:text-white">{pendingRequests}</h3>
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-lg">
                <FaCalendar className="text-lg" />
              </div>
            </div>
            <div className="flex items-center space-x-1.5 mt-4 text-[10px] text-slate-400">
              <FaCircleInfo className="text-amber-500" />
              <span>Awaiting consultation booking</span>
            </div>
          </div>

        </div>

        {/* Search & Filters */}
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
                placeholder="Search by ID, Name, Phone, or Email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60 text-slate-900 dark:text-white placeholder-slate-400 text-xs transition-all shadow-inner"
              />
            </div>

            {/* Select Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 min-h-[38px]"
                >
                  <option value="">All Genders</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
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
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 min-h-[38px]"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 min-h-[38px]"
                >
                  <option value="newest">Sort by Newest</option>
                  <option value="oldest">Sort by Oldest</option>
                  <option value="alphabetical">Sort Alphabetical</option>
                </select>
              </div>
            </div>

          </div>

          {/* Reset Filters Section */}
          {(searchTerm || selectedGender || selectedDoctorId || selectedStatus) && (
            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <span>Showing {filteredPatients.length} of {patients.length} patients</span>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedGender('');
                  setSelectedDoctorId('');
                  setSelectedStatus('');
                  setSortBy('newest');
                }}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Patient Table (Completely Avatar-Free) */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                  <th className="pb-3 font-semibold">Patient ID</th>
                  <th className="pb-3 font-semibold">Full Name</th>
                  <th className="pb-3 font-semibold">Email</th>
                  <th className="pb-3 font-semibold">Phone</th>
                  <th className="pb-3 font-semibold">Gender</th>
                  <th className="pb-3 font-semibold text-center">Age</th>
                  <th className="pb-3 font-semibold">Assigned Doctor</th>
                  <th className="pb-3 font-semibold text-center">Latest BMI</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-8 text-center text-slate-400 dark:text-slate-500">
                      No patients found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((pat) => (
                    <tr key={pat._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-150">
                      <td className="py-3.5 font-mono font-bold text-slate-500 dark:text-slate-400">
                        {pat._id.substring(pat._id.length - 8).toUpperCase()}
                      </td>
                      <td className="py-3.5 font-bold text-slate-900 dark:text-white">
                        {pat.fullName}
                      </td>
                      <td className="py-3.5 text-slate-500 dark:text-slate-400 font-medium">
                        {pat.email}
                      </td>
                      <td className="py-3.5 text-slate-500 dark:text-slate-400 font-mono">
                        {pat.phone || 'N/A'}
                      </td>
                      <td className="py-3.5 text-slate-500 dark:text-slate-400">
                        {pat.gender || 'N/A'}
                      </td>
                      <td className="py-3.5 font-mono text-center text-slate-900 dark:text-white font-bold">
                        {calculateAge(pat.dob)}
                      </td>
                      <td className="py-3.5 text-slate-500 dark:text-slate-400">
                        {pat.assignedDoctorName}
                      </td>
                      <td className="py-3.5 font-mono text-center font-bold text-slate-900 dark:text-white">
                        {pat.latestBmi ? pat.latestBmi : 'N/A'}
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          pat.status.toLowerCase() === 'active'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            pat.status.toLowerCase() === 'active' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`} />
                          <span>{pat.status.charAt(0).toUpperCase() + pat.status.slice(1)}</span>
                        </span>
                      </td>
                      <td className="py-3.5 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleViewClick(pat)}
                          title="View Details"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-600 transition-all cursor-pointer inline-flex items-center"
                        >
                          <FaEye className="text-xs" />
                        </button>
                        <button
                          onClick={() => handleEditClick(pat)}
                          title="Edit Details"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600 transition-all cursor-pointer inline-flex items-center"
                        >
                          <FaPen className="text-xs" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(pat)}
                          title={pat.status.toLowerCase() === 'active' ? 'Deactivate Account' : 'Activate Account'}
                          className={`p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 transition-all cursor-pointer inline-flex items-center ${
                            pat.status.toLowerCase() === 'active'
                              ? 'hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600'
                              : 'hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600'
                          }`}
                        >
                          <FaPowerOff className="text-xs" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(pat)}
                          title="Delete Account"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 transition-all cursor-pointer inline-flex items-center"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL: VIEW DETAILS */}
        {isViewModalOpen && selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-2xl relative">
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer"
              >
                <FaXmark />
              </button>

              <div className="mb-5">
                <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-mono font-bold tracking-widest uppercase">Patient Profile Portal</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{selectedPatient.fullName}</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">ID: {selectedPatient._id.toUpperCase()}</p>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-slate-100 dark:border-slate-800 mb-5">
                <button
                  onClick={() => setViewTab('overview')}
                  className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                    viewTab === 'overview'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Overview & Stats
                </button>
                <button
                  onClick={() => setViewTab('appointments')}
                  className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                    viewTab === 'appointments'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Appointment History
                </button>
                <button
                  onClick={() => setViewTab('progress')}
                  className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                    viewTab === 'progress'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Weight Progress
                </button>
              </div>

              {/* Tab: Overview */}
              {viewTab === 'overview' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Email Address</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 break-all">{selectedPatient.email}</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Phone Number</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{selectedPatient.phone || 'N/A'}</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Gender / DOB</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {selectedPatient.gender || 'N/A'} • {selectedPatient.dob ? new Date(selectedPatient.dob).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Assigned Medical Doctor</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <FaUserDoctor className="text-slate-400 text-[10px]" />
                        {selectedPatient.assignedDoctorName}
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Account Status</span>
                      <span className={`inline-flex items-center gap-1.5 font-bold uppercase text-[9px] px-2 py-0.5 rounded-full mt-1 border ${
                        selectedPatient.status.toLowerCase() === 'active' 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-600'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${selectedPatient.status.toLowerCase() === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {selectedPatient.status}
                      </span>
                    </div>
                  </div>

                  {/* Health Stats */}
                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Latest Health Indicators</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 rounded-2xl bg-indigo-500/5 dark:bg-indigo-950/20 border border-indigo-500/10 text-center">
                        <FaWeightScale className="mx-auto text-indigo-500 mb-1" />
                        <span className="block text-[9px] text-slate-400 font-bold uppercase">Weight</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{selectedPatient.latestWeight ? `${selectedPatient.latestWeight} kg` : 'N/A'}</span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-cyan-500/5 dark:bg-cyan-950/20 border border-cyan-500/10 text-center">
                        <FaHeartPulse className="mx-auto text-cyan-500 mb-1" />
                        <span className="block text-[9px] text-slate-400 font-bold uppercase">BMI Indicator</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{selectedPatient.latestBmi ? selectedPatient.latestBmi : 'N/A'}</span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/10 text-center">
                        <FaNotesMedical className="mx-auto text-purple-500 mb-1" />
                        <span className="block text-[9px] text-slate-400 font-bold uppercase">Prediction Class</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white truncate block">{selectedPatient.latestPrediction || 'N/A'}</span>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/10 text-center">
                        <FaUtensils className="mx-auto text-amber-500 mb-1" />
                        <span className="block text-[9px] text-slate-400 font-bold uppercase">Meal Plan</span>
                        <span className="text-[10px] font-bold text-slate-900 dark:text-white truncate block" title={selectedPatient.latestMealPlan}>{selectedPatient.latestMealPlan || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase mb-1.5">Medical History Summary</span>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px] whitespace-pre-line bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800">
                      {selectedPatient.medicalHistory || 'No previous medical history recorded.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab: Appointments (Mocked) */}
              {viewTab === 'appointments' && (
                <div className="space-y-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                          <th className="pb-2 font-semibold">Appointment Date</th>
                          <th className="pb-2 font-semibold">Doctor</th>
                          <th className="pb-2 font-semibold">Status</th>
                          <th className="pb-2 font-semibold">Clinical Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {[
                          { date: '2026-06-20', doctor: selectedPatient.assignedDoctorName !== 'Unassigned' ? selectedPatient.assignedDoctorName : 'Obesity Management Specialist', status: 'Completed', notes: 'Checked patient weight profile and adjusted dietary caloric targets. Instructed activity levels tracking.' },
                          { date: '2026-05-18', doctor: selectedPatient.assignedDoctorName !== 'Unassigned' ? selectedPatient.assignedDoctorName : 'General Physician', status: 'Completed', notes: 'Initial intake complete. Basic metabolic lab testing panel ordered and food diary guidelines issued.' }
                        ].map((appt, i) => (
                          <tr key={i} className="text-[11px]">
                            <td className="py-2.5 font-mono font-bold text-slate-600 dark:text-slate-300">{appt.date}</td>
                            <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">{appt.doctor}</td>
                            <td className="py-2.5">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-bold uppercase text-[9px]">
                                {appt.status}
                              </span>
                            </td>
                            <td className="py-2.5 text-slate-500 dark:text-slate-400 leading-normal">{appt.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab: Progress (Mocked) */}
              {viewTab === 'progress' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-indigo-500/5 dark:bg-indigo-950/20 border border-indigo-500/10 flex items-center justify-between">
                    <div>
                      <span className="block text-[9px] text-slate-400 font-bold uppercase">Target / Latest Weight</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white mt-1 block">
                        {selectedPatient.latestWeight ? `${selectedPatient.latestWeight} kg` : 'N/A'} • Risk Score: {selectedPatient.riskScore}%
                      </span>
                    </div>
                    <span className="text-xs px-2.5 py-1 font-bold bg-indigo-500 text-white rounded-xl shadow-md font-mono">-1.2 kg Loss</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                          <th className="pb-2 font-semibold">Log Date</th>
                          <th className="pb-2 font-semibold">Logged Weight</th>
                          <th className="pb-2 font-semibold">Calculated BMI</th>
                          <th className="pb-2 font-semibold">Status Change</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {[
                          { date: '2026-06-20', weight: `${selectedPatient.latestWeight} kg`, bmi: selectedPatient.latestBmi, change: '-1.2 kg Loss' },
                          { date: '2026-05-18', weight: `${(selectedPatient.latestWeight + 1.2).toFixed(1)} kg`, bmi: (selectedPatient.latestBmi + 0.4).toFixed(1), change: 'Intake Baseline' }
                        ].map((log, i) => (
                          <tr key={i} className="text-[11px] font-mono">
                            <td className="py-2.5 text-slate-500 dark:text-slate-400">{log.date}</td>
                            <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">{log.weight}</td>
                            <td className="py-2.5 text-slate-600 dark:text-slate-350">{log.bmi}</td>
                            <td className={`py-2.5 font-bold ${i === 0 ? 'text-emerald-500' : 'text-slate-400'}`}>{log.change}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                >
                  Close Profile
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL: ADD PATIENT */}
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
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Add New Patient</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Register a new patient into the CarePath management panel.</p>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><FaUser className="text-xs" /></span>
                      <input
                        type="text"
                        required
                        value={addForm.fullName}
                        onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                        placeholder="e.g. Jane Doe"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border ${
                          formErrors.fullName ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/30'
                        } focus:outline-none focus:ring-2 text-slate-900 dark:text-white placeholder-slate-400 text-xs`}
                      />
                    </div>
                    {formErrors.fullName && <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.fullName}</span>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><FaEnvelope className="text-xs" /></span>
                      <input
                        type="email"
                        required
                        value={addForm.email}
                        onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                        placeholder="jane.doe@gmail.com"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border ${
                          formErrors.email ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/30'
                        } focus:outline-none focus:ring-2 text-slate-900 dark:text-white placeholder-slate-400 text-xs`}
                      />
                    </div>
                    {formErrors.email && <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.email}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><FaPhone className="text-xs" /></span>
                      <input
                        type="text"
                        required
                        value={addForm.phone}
                        onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                        placeholder="+94 77 123 4567"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border ${
                          formErrors.phone ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/30'
                        } focus:outline-none focus:ring-2 text-slate-900 dark:text-white placeholder-slate-400 text-xs`}
                      />
                    </div>
                    {formErrors.phone && <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.phone}</span>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Date of Birth</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><FaCalendar className="text-xs" /></span>
                      <input
                        type="date"
                        required
                        value={addForm.dob}
                        onChange={(e) => setAddForm({ ...addForm, dob: e.target.value })}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border ${
                          formErrors.dob ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/30'
                        } focus:outline-none focus:ring-2 text-slate-700 dark:text-slate-300 text-xs`}
                      />
                    </div>
                    {formErrors.dob && <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.dob}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Gender</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><FaVenusMars className="text-xs" /></span>
                      <select
                        required
                        value={addForm.gender}
                        onChange={(e) => setAddForm({ ...addForm, gender: e.target.value })}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border ${
                          formErrors.gender ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/30'
                        } focus:outline-none focus:ring-2 text-slate-700 dark:text-slate-350 text-xs min-h-[38px]`}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    {formErrors.gender && <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.gender}</span>}
                  </div>

                  <div>
                    <SearchableSelect
                      label="Assign Treating Doctor"
                      value={addForm.assignedDoctorId}
                      onChange={(docId) => setAddForm({ ...addForm, assignedDoctorId: docId })}
                      options={doctorOptions}
                      placeholder="Select Medical Specialist"
                      error={formErrors.assignedDoctorId}
                      icon={FaUserDoctor}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Clinical Medical History</label>
                  <textarea
                    rows="2"
                    value={addForm.medicalHistory}
                    onChange={(e) => setAddForm({ ...addForm, medicalHistory: e.target.value })}
                    placeholder="Enter patient diagnosis log, known medical conditions, diabetes profile, current drugs..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/65 text-slate-900 dark:text-white placeholder-slate-400 text-xs"
                  />
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">System Access Password</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><FaLock className="text-xs" /></span>
                      <input
                        type={showAddPassword ? 'text' : 'password'}
                        required
                        value={addForm.password}
                        onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                        placeholder="••••••••"
                        className={`w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border ${
                          formErrors.password ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/30'
                        } focus:outline-none focus:ring-2 text-slate-900 dark:text-white placeholder-slate-400 text-xs`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowAddPassword(!showAddPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-650 cursor-pointer"
                      >
                        {showAddPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                    {formErrors.password && <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.password}</span>}

                    {/* Password Strength Indicator */}
                    {addForm.password && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-bold">
                          <span className="text-slate-500">Security Target:</span>
                          <span className={getPasswordStrength(addForm.password).colorClass}>{getPasswordStrength(addForm.password).label}</span>
                        </div>
                        <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-300 ${getPasswordStrength(addForm.password).barColorClass}`} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><FaLock className="text-xs" /></span>
                      <input
                        type={showAddConfirmPassword ? 'text' : 'password'}
                        required
                        value={addForm.confirmPassword}
                        onChange={(e) => setAddForm({ ...addForm, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        className={`w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border ${
                          formErrors.confirmPassword ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/30'
                        } focus:outline-none focus:ring-2 text-slate-900 dark:text-white placeholder-slate-400 text-xs`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowAddConfirmPassword(!showAddConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-650 cursor-pointer"
                      >
                        {showAddConfirmPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                    {formErrors.confirmPassword && <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.confirmPassword}</span>}
                  </div>
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
                    Register Patient
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDIT PATIENT */}
        {isEditModalOpen && selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-2xl relative">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer"
              >
                <FaXmark />
              </button>

              <div className="mb-6">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Edit Patient Record</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Modify registered user attributes or medical assignments.</p>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><FaUser className="text-xs" /></span>
                      <input
                        type="text"
                        required
                        value={editForm.fullName}
                        onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border ${
                          formErrors.fullName ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/30'
                        } focus:outline-none focus:ring-2 text-slate-900 dark:text-white placeholder-slate-400 text-xs`}
                      />
                    </div>
                    {formErrors.fullName && <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.fullName}</span>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><FaEnvelope className="text-xs" /></span>
                      <input
                        type="email"
                        required
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border ${
                          formErrors.email ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/30'
                        } focus:outline-none focus:ring-2 text-slate-900 dark:text-white placeholder-slate-400 text-xs`}
                      />
                    </div>
                    {formErrors.email && <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.email}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><FaPhone className="text-xs" /></span>
                      <input
                        type="text"
                        required
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border ${
                          formErrors.phone ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/30'
                        } focus:outline-none focus:ring-2 text-slate-900 dark:text-white placeholder-slate-400 text-xs`}
                      />
                    </div>
                    {formErrors.phone && <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.phone}</span>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Date of Birth</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><FaCalendar className="text-xs" /></span>
                      <input
                        type="date"
                        required
                        value={editForm.dob}
                        onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border ${
                          formErrors.dob ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/30'
                        } focus:outline-none focus:ring-2 text-slate-750 dark:text-slate-300 text-xs`}
                      />
                    </div>
                    {formErrors.dob && <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.dob}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Gender</label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400"><FaVenusMars className="text-xs" /></span>
                      <select
                        required
                        value={editForm.gender}
                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border ${
                          formErrors.gender ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/30'
                        } focus:outline-none focus:ring-2 text-slate-750 dark:text-slate-350 text-xs min-h-[38px]`}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    {formErrors.gender && <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.gender}</span>}
                  </div>

                  <div>
                    <SearchableSelect
                      label="Assign Treating Doctor"
                      value={editForm.assignedDoctorId}
                      onChange={(docId) => setEditForm({ ...editForm, assignedDoctorId: docId })}
                      options={doctorOptions}
                      placeholder="Select Medical Specialist"
                      error={formErrors.assignedDoctorId}
                      icon={FaUserDoctor}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Account Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 min-h-[38px]"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">Clinical Medical History</label>
                  <textarea
                    rows="2"
                    value={editForm.medicalHistory}
                    onChange={(e) => setEditForm({ ...editForm, medicalHistory: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/65 text-slate-900 dark:text-white placeholder-slate-400 text-xs"
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
        {isDeleteModalOpen && selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-2xl relative text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 flex items-center justify-center mx-auto mb-4 text-xl">
                <FaTrash />
              </div>
              
              <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">Delete Patient Account?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Are you sure you want to delete this patient profile?<br />
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPatient.fullName}</span>
                <br />This action deletes credentials and cannot be undone.
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
