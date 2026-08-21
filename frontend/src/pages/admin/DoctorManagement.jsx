import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import DoctorModal from '../../components/admin/DoctorModal';
import apiClient from '../../services/apiClient';
import {
  Stethoscope,
  Plus,
  Search,
  Eye,
  PenSquare,
  Ban,
  CheckCircle2,
  Trash2
} from 'lucide-react';

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [specFilter, setSpecFilter] = useState('all');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/doctors');
      setDoctors(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleOpenModal = (doctor = null, viewOnly = false) => {
    setSelectedDoctor(doctor);
    setIsViewOnly(viewOnly);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDoctor(null);
    setIsViewOnly(false);
  };

  const handleModalSubmit = async (formData) => {
    try {
      setModalLoading(true);
      if (selectedDoctor) {
        // Edit
        await apiClient.put(`/admin/doctors/${selectedDoctor._id}`, formData);
      } else {
        // Create
        await apiClient.post('/admin/doctors', formData);
      }
      await fetchDoctors();
      handleCloseModal();
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus === 'active' ? 'deactivate' : 'activate'} this doctor?`)) return;
    
    try {
      await apiClient.patch(`/admin/doctors/${id}/status`);
      fetchDoctors(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('WARNING: Are you sure you want to permanently delete this doctor? This action cannot be undone.')) return;
    
    try {
      await apiClient.delete(`/admin/doctors/${id}`);
      fetchDoctors(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete doctor');
    }
  };

  const uniqueSpecialisations = ['all', ...new Set(doctors.map(d => d.profile?.specialisation).filter(Boolean))];

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesSpec = specFilter === 'all' || doc.profile?.specialisation === specFilter;
    
    return matchesSearch && matchesStatus && matchesSpec;
  });

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 pb-10">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-xs">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Doctor Management</h1>
                <p className="text-xs text-slate-500 mt-0.5">Register, manage medical credentials, and oversee clinical practitioners.</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-sm shadow-teal-900/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Doctor</span>
          </button>
        </div>

        {/* Main Card Container */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[520px]">
          
          {/* Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              {/* Search Bar */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search doctor by name or email..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
              
              {/* Status & Specialisation Filters */}
              <div className="flex gap-2.5">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-xs bg-white text-slate-700 font-medium cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <select 
                  value={specFilter}
                  onChange={(e) => setSpecFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-xs bg-white text-slate-700 font-medium max-w-[180px] truncate cursor-pointer"
                >
                  {uniqueSpecialisations.map(spec => (
                    <option key={spec} value={spec}>
                      {spec === 'all' ? 'All Specialisations' : spec}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Results Pill */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full">
                Total: {filteredDoctors.length} {filteredDoctors.length === 1 ? 'Doctor' : 'Doctors'}
              </span>
            </div>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="flex flex-col justify-center items-center h-64 text-slate-400 space-y-2">
                <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-medium">Loading clinical directory...</span>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center h-64 text-rose-500 text-xs font-medium p-4 text-center">
                {error}
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-64 text-slate-400 space-y-2">
                <Stethoscope className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-medium text-slate-500">No doctors match your filter criteria.</p>
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">Doctor ID</th>
                    <th className="px-5 py-3.5">Doctor Name</th>
                    <th className="px-5 py-3.5">Contact Details</th>
                    <th className="px-5 py-3.5">Specialisation</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDoctors.map((doctor) => {
                    const initials = doctor.fullName
                      ? doctor.fullName
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      : 'DR';

                    return (
                      <tr key={doctor._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-semibold uppercase">
                            #{doctor._id.slice(-6).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-xs shrink-0 border border-teal-100">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-900 block truncate">
                                Dr. {doctor.fullName}
                              </span>
                              {doctor.profile?.qualification && (
                                <span className="text-[11px] text-slate-400 block truncate">
                                  {doctor.profile.qualification}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="text-slate-800 font-medium">{doctor.email}</div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {doctor.profile?.phoneNumber || 'No phone'}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700">
                            {doctor.profile?.specialisation || 'General Practice'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            doctor.status === 'active' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {doctor.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex justify-end items-center gap-1">
                            <button 
                              onClick={() => handleOpenModal(doctor, true)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="View Doctor Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleOpenModal(doctor, false)}
                              className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Doctor Account"
                            >
                              <PenSquare className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleToggleStatus(doctor._id, doctor.status)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                doctor.status === 'active' 
                                  ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' 
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={doctor.status === 'active' ? 'Deactivate Doctor' : 'Activate Doctor'}
                            >
                              {doctor.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            </button>
                            <button 
                              onClick={() => handleDelete(doctor._id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Doctor"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      <DoctorModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleModalSubmit}
        doctor={selectedDoctor}
        loading={modalLoading}
        isViewOnly={isViewOnly}
      />
    </DashboardLayout>
  );
}
