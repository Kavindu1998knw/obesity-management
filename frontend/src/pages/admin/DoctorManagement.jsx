import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaUserDoctor, 
  FaUser, 
  FaCalendarCheck, 
  FaShieldHalved,
  FaPlus,
  FaMagnifyingGlass,
  FaPen,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaPowerOff,
  FaBuilding,
  FaCircleCheck,
  FaCircleXmark,
  FaCircleInfo,
  FaXmark,
  FaPhone,
  FaEnvelope,
  FaStethoscope,
  FaLock
} from 'react-icons/fa6';
import DashboardLayout from '../../layouts/DashboardLayout';

const DEPARTMENT_OPTIONS = [
  'Nutrition & Dietetics',
  'Weight Management',
  'Endocrinology',
  'General Medicine',
  'Internal Medicine',
  'Preventive Healthcare',
  'Lifestyle Medicine',
  'Clinical Nutrition'
];

const SPECIALIZATION_MAPPING = {
  'Nutrition & Dietetics': ['Clinical Nutritionist', 'Registered Dietitian'],
  'Weight Management': ['Obesity Management Specialist', 'Weight Loss Consultant'],
  'Endocrinology': ['Endocrinologist', 'Metabolic Health Specialist'],
  'General Medicine': ['General Physician'],
  'Internal Medicine': ['General Physician', 'Metabolic Health Specialist'],
  'Preventive Healthcare': ['Lifestyle Medicine Specialist'],
  'Lifestyle Medicine': ['Lifestyle Medicine Specialist'],
  'Clinical Nutrition': ['Clinical Nutritionist']
};

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
    opt.toLowerCase().includes(search.toLowerCase())
  );

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
              {value || placeholder}
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
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs transition-colors cursor-pointer block truncate ${
                    opt === value 
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold' 
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {opt}
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

export default function DoctorManagement() {
  const navigate = useNavigate();
  
  // State for doctor records
  const [doctors, setDoctors] = useState([]);
  
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // State for notification toasts
  const [notification, setNotification] = useState(null);
  
  // State for modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Form states
  const [addForm, setAddForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    specialization: '',
    department: '',
    licenseNumber: '',
    password: '',
    confirmPassword: ''
  });

  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    specialization: '',
    department: '',
    status: ''
  });

  // State for form errors
  const [formErrors, setFormErrors] = useState({});

  // Show/Hide password states
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showAddConfirmPassword, setShowAddConfirmPassword] = useState(false);

  // Password strength logic
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'None', colorClass: 'text-slate-400', barColorClass: 'bg-slate-200 w-0' };
    
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (pwd.length < 8) {
      return { score: 1, label: 'Very Weak (Min. 8 chars)', colorClass: 'text-rose-500', barColorClass: 'bg-rose-500 w-1/4' };
    }

    switch (score) {
      case 1:
        return { score: 1, label: 'Very Weak', colorClass: 'text-rose-500', barColorClass: 'bg-rose-500 w-1/4' };
      case 2:
        return { score: 2, label: 'Weak', colorClass: 'text-amber-500', barColorClass: 'bg-amber-500 w-2/4' };
      case 3:
        return { score: 3, label: 'Medium', colorClass: 'text-sky-500', barColorClass: 'bg-sky-500 w-3/4' };
      case 4:
      default:
        return { score: 4, label: 'Strong', colorClass: 'text-emerald-500', barColorClass: 'bg-emerald-500 w-full' };
    }
  };

  // Open add modal handler
  const openAddModal = () => {
    setAddForm({
      fullName: '',
      email: '',
      phone: '',
      specialization: '',
      department: '',
      licenseNumber: '',
      password: '',
      confirmPassword: ''
    });
    setFormErrors({});
    setShowAddPassword(false);
    setShowAddConfirmPassword(false);
    setIsAddModalOpen(true);
  };

  // Fetch doctors on component mount
  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/doctors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const mapped = response.data.data.map(d => ({
          ...d,
          id: d._id,
          assignedPatients: d.assignedPatientsCount,
          status: d.status.charAt(0).toUpperCase() + d.status.slice(1) // e.g. 'active' -> 'Active'
        }));
        setDoctors(mapped);
      }
    } catch (err) {
      console.error('Error in fetchDoctors:', err);
      triggerNotification('Failed to fetch doctor records.', 'error');
    }
  };

  // Unique departments and specializations for filters
  const departments = [...new Set(doctors.map(d => d.department))];
  const specializations = [...new Set(doctors.map(d => d.specialization))];

  // Helper: Trigger notification toast
  const triggerNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Sidebar configuration
  const menuItems = [
    { label: 'Dashboard', icon: FaShieldHalved, onClick: () => navigate('/admin/dashboard') },
    { label: 'Doctors', icon: FaUserDoctor, active: true, onClick: () => navigate('/admin/doctors') },
    { label: 'Patients', icon: FaUser, onClick: () => navigate('/admin/patients') },
    { label: 'Appointments', icon: FaCalendarCheck, onClick: () => navigate('/admin/appointments') }
  ];

  // Filter calculations
  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch = 
      doc.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.specialization && doc.specialization.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesDept = selectedDept ? doc.department === selectedDept : true;
    const matchesSpec = selectedSpec ? doc.specialization === selectedSpec : true;
    const matchesStatus = selectedStatus ? doc.status.toLowerCase() === selectedStatus.toLowerCase() : true;
    
    return matchesSearch && matchesDept && matchesSpec && matchesStatus;
  });

  // Calculate statistics
  const stats = [
    { title: 'Total Doctors', count: doctors.length, subtitle: 'Registered Specialists', icon: FaUserDoctor, color: 'from-blue-500 to-indigo-500' },
    { title: 'Active Doctors', count: doctors.filter(d => d.status === 'Active').length, subtitle: 'Currently Practicing', icon: FaCircleCheck, color: 'from-emerald-500 to-teal-500' },
    { title: 'Inactive Doctors', count: doctors.filter(d => d.status === 'Inactive').length, subtitle: 'On Leave/Suspended', icon: FaCircleXmark, color: 'from-amber-500 to-rose-500' },
    { title: 'Departments', count: new Set(doctors.map(d => d.department)).size, subtitle: 'Medical Areas', icon: FaBuilding, color: 'from-purple-500 to-pink-500' }
  ];

  const handleAddDepartmentChange = (dept) => {
    const specs = SPECIALIZATION_MAPPING[dept] || [];
    const updatedSpec = specs.includes(addForm.specialization) ? addForm.specialization : '';
    setAddForm(prev => ({
      ...prev,
      department: dept,
      specialization: updatedSpec
    }));
    if (formErrors.department) {
      setFormErrors(prev => ({ ...prev, department: '' }));
    }
  };

  const handleAddSpecializationChange = (spec) => {
    setAddForm(prev => ({ ...prev, specialization: spec }));
    if (formErrors.specialization) {
      setFormErrors(prev => ({ ...prev, specialization: '' }));
    }
  };

  const handleEditDepartmentChange = (dept) => {
    const specs = SPECIALIZATION_MAPPING[dept] || [];
    const updatedSpec = specs.includes(editForm.specialization) ? editForm.specialization : '';
    setEditForm(prev => ({
      ...prev,
      department: dept,
      specialization: updatedSpec
    }));
    if (formErrors.department) {
      setFormErrors(prev => ({ ...prev, department: '' }));
    }
  };

  const handleEditSpecializationChange = (spec) => {
    setEditForm(prev => ({ ...prev, specialization: spec }));
    if (formErrors.specialization) {
      setFormErrors(prev => ({ ...prev, specialization: '' }));
    }
  };

  // Handle Add Doctor Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!addForm.fullName) errors.fullName = 'Full Name is required.';
    if (!addForm.email) errors.email = 'Email Address is required.';
    if (!addForm.phone) errors.phone = 'Phone Number is required.';
    if (!addForm.specialization) errors.specialization = 'Specialization is required.';
    if (!addForm.department) errors.department = 'Department is required.';
    if (!addForm.licenseNumber) errors.licenseNumber = 'Medical License Number is required.';
    if (!addForm.password) {
      errors.password = 'Password is required.';
    } else if (addForm.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }
    
    if (!addForm.confirmPassword) {
      errors.confirmPassword = 'Confirm Password is required.';
    } else if (addForm.password !== addForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      triggerNotification('Please correct the validation errors.', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/doctors', addForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setIsAddModalOpen(false);
        triggerNotification('Doctor account created successfully.');
        fetchDoctors();
      }
    } catch (err) {
      console.error('Error creating doctor:', err);
      triggerNotification(err.response?.data?.message || 'Failed to create doctor account.', 'error');
    }
  };

  // Handle Edit Doctor click
  const handleEditDoctor = (doc) => {
    setSelectedDoctor(doc);
    setEditForm({
      fullName: doc.fullName,
      email: doc.email,
      phone: doc.phone || '',
      licenseNumber: doc.licenseNumber || '',
      specialization: doc.specialization,
      department: doc.department,
      status: doc.status
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Handle Edit Doctor Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!editForm.fullName) errors.fullName = 'Full Name is required.';
    if (!editForm.email) errors.email = 'Email Address is required.';
    if (!editForm.phone) errors.phone = 'Phone Number is required.';
    if (!editForm.specialization) errors.specialization = 'Specialization is required.';
    if (!editForm.department) errors.department = 'Department is required.';
    if (!editForm.licenseNumber) errors.licenseNumber = 'Medical License Number is required.';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      triggerNotification('Please correct the validation errors.', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...editForm,
        status: editForm.status.toLowerCase()
      };
      const response = await axios.put(`http://localhost:5000/api/doctors/${selectedDoctor.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setIsEditModalOpen(false);
        triggerNotification('Doctor details updated successfully.');
        fetchDoctors();
      }
    } catch (err) {
      console.error('Error updating doctor:', err);
      triggerNotification(err.response?.data?.message || 'Failed to update doctor details.', 'error');
    }
  };

  // Handle View Doctor details click
  const handleViewDoctor = (doc) => {
    setSelectedDoctor(doc);
    setIsViewModalOpen(true);
  };

  // Toggle Doctor Active Status (Deactivate / Activate)
  const handleToggleStatus = async (doc) => {
    const isCurrentlyActive = doc.status === 'Active';
    const action = isCurrentlyActive ? 'deactivate' : 'activate';
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`http://localhost:5000/api/doctors/${doc.id}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const nextStatus = isCurrentlyActive ? 'Inactive' : 'Active';
        triggerNotification(`Doctor account is now ${nextStatus}.`);
        fetchDoctors();
      }
    } catch (err) {
      console.error('Error toggling doctor status:', err);
      triggerNotification('Failed to toggle doctor status.', 'error');
    }
  };

  // Delete Request Click
  const handleDeleteRequest = (doc) => {
    setSelectedDoctor(doc);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`http://localhost:5000/api/doctors/${selectedDoctor.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setIsDeleteModalOpen(false);
        triggerNotification(`Doctor account deleted successfully.`);
        fetchDoctors();
      }
    } catch (err) {
      console.error('Error deleting doctor:', err);
      triggerNotification('Failed to delete doctor account.', 'error');
    }
  };

  return (
    <DashboardLayout role="admin" menuItems={menuItems}>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Doctor Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Manage all registered doctors in the system.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-white text-xs font-bold transition-all duration-200 shadow-lg shadow-slate-900/10 active:scale-[0.98] cursor-pointer"
          >
            <FaPlus className="text-xs" />
            <span>Add New Doctor</span>
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div 
                key={i} 
                className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`} />
                
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                      {stat.title}
                    </span>
                    <h3 className="text-3xl font-black mt-2 text-slate-900 dark:text-white">
                      {stat.count}
                    </h3>
                  </div>
                  <div className={`p-3 rounded-2xl bg-gradient-to-tr ${stat.color} text-white shadow-lg`}>
                    <Icon className="text-lg" />
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 mt-4 text-[10px] text-slate-500 dark:text-slate-400">
                  <FaCircleInfo className="text-indigo-500" />
                  <span>{stat.subtitle}</span>
                </div>
              </div>
            );
          })}
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
                placeholder="Search by ID, Name, or Email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60 text-slate-900 dark:text-white placeholder-slate-400 text-xs transition-all shadow-inner"
              />
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept, i) => (
                    <option key={i} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={selectedSpec}
                  onChange={(e) => setSelectedSpec(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="">All Specializations</option>
                  {specializations.map((spec, i) => (
                    <option key={i} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            
          </div>

          {/* Filters summary & reset */}
          {(searchTerm || selectedDept || selectedSpec || selectedStatus) && (
            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <span>Showing {filteredDoctors.length} of {doctors.length} doctors</span>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDept('');
                  setSelectedSpec('');
                  setSelectedStatus('');
                }}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Doctor Table */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-6 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                  <th className="pb-3 font-semibold">Doctor ID</th>
                  <th className="pb-3 font-semibold">Doctor Name</th>
                  <th className="pb-3 font-semibold">Email</th>
                  <th className="pb-3 font-semibold">Specialization</th>
                  <th className="pb-3 font-semibold">Department</th>
                  <th className="pb-3 font-semibold text-center">Assigned Patients</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDoctors.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-400 dark:text-slate-500">
                      No doctors found matching the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDoctors.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-150">
                      <td className="py-3.5 font-mono font-bold text-slate-500 dark:text-slate-400">
                        {doc.id}
                      </td>
                      <td className="py-3.5 font-bold text-slate-900 dark:text-white">
                        {doc.fullName}
                      </td>
                      <td className="py-3.5 text-slate-500 dark:text-slate-400 font-medium">
                        {doc.email}
                      </td>
                      <td className="py-3.5 text-slate-500 dark:text-slate-400">
                        {doc.specialization}
                      </td>
                      <td className="py-3.5 text-slate-500 dark:text-slate-400">
                        <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                          {doc.department}
                        </span>
                      </td>
                      <td className="py-3.5 font-mono text-center font-bold text-slate-950 dark:text-slate-50">
                        {doc.assignedPatients}
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          doc.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            doc.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`} />
                          <span>{doc.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 text-right space-x-1">
                        <button
                          onClick={() => handleViewDoctor(doc)}
                          title="View Details"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-600 transition-all cursor-pointer inline-flex items-center"
                        >
                          <FaEye className="text-[10px]" />
                        </button>
                        <button
                          onClick={() => handleEditDoctor(doc)}
                          title="Edit Details"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600 transition-all cursor-pointer inline-flex items-center"
                        >
                          <FaPen className="text-[10px]" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(doc)}
                          title={doc.status === 'Active' ? 'Deactivate' : 'Activate'}
                          className={`p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 transition-all cursor-pointer inline-flex items-center ${
                            doc.status === 'Active'
                              ? 'text-rose-500 hover:bg-rose-500 hover:text-white'
                              : 'text-emerald-500 hover:bg-emerald-500 hover:text-white'
                          }`}
                        >
                          <FaPowerOff className="text-[10px]" />
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(doc)}
                          title="Delete Doctor"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-rose-500 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 transition-all cursor-pointer inline-flex items-center"
                        >
                          <FaTrash className="text-[10px]" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* NOTIFICATION TOAST */}
        {notification && (
          <div className={`fixed bottom-5 right-5 z-[100] flex items-center space-x-2.5 px-4 py-3 rounded-2xl shadow-xl border ${
            notification.type === 'success' 
              ? 'bg-emerald-500 dark:bg-emerald-600 text-white border-emerald-500/20' 
              : 'bg-rose-500 dark:bg-rose-600 text-white border-rose-500/20'
          }`}>
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
              {notification.type === 'success' ? <FaCircleCheck /> : <FaCircleXmark />}
            </span>
            <span className="text-xs font-bold">{notification.message}</span>
          </div>
        )}

        {/* MODAL: VIEW DETAILS */}
        {isViewModalOpen && selectedDoctor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-2xl relative">
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer"
              >
                <FaXmark />
              </button>

              <div className="text-center mb-6">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedDoctor.fullName}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  {selectedDoctor.id}
                </span>
              </div>

              <div className="space-y-4 text-xs">
                
                <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800">
                  <div className="text-slate-400">
                    <FaEnvelope />
                  </div>
                  <div className="flex-1">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Email Address</span>
                    <span className="text-slate-700 dark:text-slate-200 font-semibold">{selectedDoctor.email}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800">
                    <div className="text-slate-400">
                      <FaPhone />
                    </div>
                    <div className="flex-1">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Phone Number</span>
                      <span className="text-slate-700 dark:text-slate-200 font-semibold">{selectedDoctor.phone || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800">
                    <div className="text-slate-400">
                      <FaStethoscope className="text-xs" />
                    </div>
                    <div className="flex-1">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">License Number</span>
                      <span className="text-slate-700 dark:text-slate-200 font-bold truncate block">{selectedDoctor.licenseNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800">
                    <div className="flex-1">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Specialization</span>
                      <span className="text-slate-700 dark:text-slate-200 font-bold">{selectedDoctor.specialization}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800">
                    <div className="flex-1">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Department</span>
                      <span className="text-slate-700 dark:text-slate-200 font-bold">{selectedDoctor.department}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800">
                    <div className="flex-1">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Assigned Patients</span>
                      <span className="text-slate-700 dark:text-slate-200 font-mono font-bold">{selectedDoctor.assignedPatients} Patients</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800">
                    <div className="flex-1">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">Status</span>
                      <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                        selectedDoctor.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-rose-500/10 text-rose-600'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${
                          selectedDoctor.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`} />
                        <span>{selectedDoctor.status}</span>
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ADD DOCTOR */}
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
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Add New Doctor
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Register a new medical specialist to the system workspace.
                </p>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <FaUserDoctor className="text-xs" />
                      </span>
                      <input
                        type="text"
                        required
                        value={addForm.fullName}
                        onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                        placeholder="e.g. John Watson"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border ${
                          formErrors.fullName ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/30'
                        } focus:outline-none focus:ring-2 text-slate-900 dark:text-white placeholder-slate-400 text-xs`}
                      />
                    </div>
                    {formErrors.fullName && (
                      <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.fullName}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <FaEnvelope className="text-xs" />
                      </span>
                      <input
                        type="email"
                        required
                        value={addForm.email}
                        onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                        placeholder="john.watson@carepath.com"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border ${
                          formErrors.email ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/30'
                        } focus:outline-none focus:ring-2 text-slate-900 dark:text-white placeholder-slate-400 text-xs`}
                      />
                    </div>
                    {formErrors.email && (
                      <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.email}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <FaPhone className="text-xs" />
                      </span>
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
                    {formErrors.phone && (
                      <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.phone}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Medical License Number
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <FaStethoscope className="text-xs" />
                      </span>
                      <input
                        type="text"
                        required
                        value={addForm.licenseNumber}
                        onChange={(e) => setAddForm({ ...addForm, licenseNumber: e.target.value })}
                        placeholder="SLMC-2026-12345"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border ${
                          formErrors.licenseNumber ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/30'
                        } focus:outline-none focus:ring-2 text-slate-900 dark:text-white placeholder-slate-400 text-xs`}
                      />
                    </div>
                    {formErrors.licenseNumber && (
                      <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.licenseNumber}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <SearchableSelect
                      label="Department"
                      value={addForm.department}
                      onChange={handleAddDepartmentChange}
                      options={DEPARTMENT_OPTIONS}
                      placeholder="Select Department"
                      error={formErrors.department}
                      icon={FaBuilding}
                    />
                  </div>

                  <div>
                    <SearchableSelect
                      label="Specialization"
                      value={addForm.specialization}
                      onChange={handleAddSpecializationChange}
                      options={addForm.department ? (SPECIALIZATION_MAPPING[addForm.department] || []) : []}
                      placeholder={addForm.department ? "Select Specialization" : "Select Department first"}
                      error={formErrors.specialization}
                      disabled={!addForm.department}
                      icon={FaStethoscope}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Password
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <FaLock className="text-xs" />
                      </span>
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
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-450 hover:text-slate-700 dark:hover:text-white focus:outline-none cursor-pointer"
                      >
                        {showAddPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {addForm.password && (
                      <div className="mt-2 space-y-1">
                        <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-300 ${getPasswordStrength(addForm.password).barColorClass}`} />
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400">Strength:</span>
                          <span className={`font-bold ${getPasswordStrength(addForm.password).colorClass}`}>
                            {getPasswordStrength(addForm.password).label}
                          </span>
                        </div>
                      </div>
                    )}
                    {formErrors.password && (
                      <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.password}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <FaLock className="text-xs" />
                      </span>
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
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-450 hover:text-slate-700 dark:hover:text-white focus:outline-none cursor-pointer"
                      >
                        {showAddConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {formErrors.confirmPassword && (
                      <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.confirmPassword}</span>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-white text-xs font-bold transition-all shadow-lg active:scale-[0.98] cursor-pointer"
                  >
                    Save Doctor
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDIT DOCTOR */}
        {isEditModalOpen && selectedDoctor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-2xl relative">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer"
              >
                <FaXmark />
              </button>

              <div className="mb-6">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Edit Doctor Details
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Update profile information for {selectedDoctor.id}
                </p>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <FaUserDoctor className="text-xs" />
                    </span>
                    <input
                      type="text"
                      required
                      value={editForm.fullName}
                      onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                      placeholder="e.g. John Watson"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white placeholder-slate-400 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <FaEnvelope className="text-xs" />
                      </span>
                      <input
                        type="email"
                        required
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        placeholder="john.watson@carepath.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-900 dark:text-white placeholder-slate-400 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <FaPhone className="text-xs" />
                      </span>
                      <input
                        type="text"
                        required
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        placeholder="+94 77 123 4567"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border ${
                          formErrors.phone ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/30'
                        } focus:outline-none focus:ring-2 text-slate-900 dark:text-white placeholder-slate-400 text-xs`}
                      />
                    </div>
                    {formErrors.phone && (
                      <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.phone}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Medical License Number
                    </label>
                    <div className="relative group">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <FaStethoscope className="text-xs" />
                      </span>
                      <input
                        type="text"
                        required
                        value={editForm.licenseNumber}
                        onChange={(e) => setEditForm({ ...editForm, licenseNumber: e.target.value })}
                        placeholder="SLMC-2026-12345"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border ${
                          formErrors.licenseNumber ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/30'
                        } focus:outline-none focus:ring-2 text-slate-900 dark:text-white placeholder-slate-400 text-xs`}
                      />
                    </div>
                    {formErrors.licenseNumber && (
                      <span className="text-[10px] text-rose-500 font-semibold mt-1 block">{formErrors.licenseNumber}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <SearchableSelect
                      label="Department"
                      value={editForm.department}
                      onChange={handleEditDepartmentChange}
                      options={DEPARTMENT_OPTIONS}
                      placeholder="Select Department"
                      error={formErrors.department}
                      icon={FaBuilding}
                    />
                  </div>

                  <div>
                    <SearchableSelect
                      label="Specialization"
                      value={editForm.specialization}
                      onChange={handleEditSpecializationChange}
                      options={editForm.department ? (SPECIALIZATION_MAPPING[editForm.department] || []) : []}
                      placeholder={editForm.department ? "Select Specialization" : "Select Department first"}
                      error={formErrors.specialization}
                      disabled={!editForm.department}
                      icon={FaStethoscope}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                      Account Status
                    </label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 h-[38px]"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
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
        {isDeleteModalOpen && selectedDoctor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-2xl relative text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 flex items-center justify-center mx-auto mb-4 text-xl">
                <FaTrash />
              </div>
              
              <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">
                Delete Doctor Account?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Are you sure you want to delete this doctor?<br />
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedDoctor.fullName} ({selectedDoctor.id})</span>
                <br />This action is permanent and cannot be undone.
              </p>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
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
