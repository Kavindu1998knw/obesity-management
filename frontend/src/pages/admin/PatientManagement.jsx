import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PatientModal from '../../components/admin/PatientModal';
import PatientViewModal from '../../components/admin/PatientViewModal';
import apiClient from '../../services/apiClient';
import {
  Users,
  Search,
  Eye,
  Stethoscope,
  Ban,
  CheckCircle2,
  Trash2
} from 'lucide-react';

export default function PatientManagement() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('all');
  
  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  
  // For doctor dropdown in filters
  const [allDoctors, setAllDoctors] = useState([]);

  const fetchDoctors = async () => {
    try {
      const res = await apiClient.get('/admin/doctors');
      setAllDoctors(res.data.data.filter(d => d.status === 'active'));
    } catch {
      console.error('Failed to fetch doctors for filter');
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (doctorFilter !== 'all') params.append('doctorId', doctorFilter);
      
      const res = await apiClient.get(`/admin/patients?${params.toString()}`);
      setPatients(res.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, doctorFilter]);

  const handleOpenAssignDoctor = (patient) => {
    setSelectedPatient(patient);
    setIsAssignModalOpen(true);
  };

  const handleOpenView = (patient) => {
    setSelectedPatient(patient);
    setIsViewModalOpen(true);
  };

  const handleAssignSubmit = async (formData) => {
    try {
      setModalLoading(true);
      await apiClient.patch(`/admin/patients/${selectedPatient._id}/assign-doctor`, {
        doctorId: formData.assignedDoctor
      });
      await fetchPatients();
      setIsAssignModalOpen(false);
      setSelectedPatient(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus === 'active' ? 'deactivate' : 'activate'} this patient?`)) return;
    try {
      await apiClient.patch(`/admin/patients/${id}/status`);
      fetchPatients();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('WARNING: Are you sure you want to permanently delete this patient? This action cannot be undone.')) return;
    try {
      await apiClient.delete(`/admin/patients/${id}`);
      fetchPatients();
    } catch (err) {
      if (err.response?.status === 409) {
        alert(err.response.data.message);
      } else {
        alert(err.response?.data?.message || 'Failed to delete patient');
      }
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 pb-10">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-xs">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Patient Management</h1>
                <p className="text-xs text-slate-500 mt-0.5">Directory of registered patients, clinical assignments, and profile records.</p>
              </div>
            </div>
          </div>
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
                  placeholder="Search by patient name or email..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
              
              {/* Status & Doctor Filters */}
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
                  value={doctorFilter}
                  onChange={(e) => setDoctorFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-xs bg-white text-slate-700 font-medium max-w-[190px] truncate cursor-pointer"
                >
                  <option value="all">All Doctors</option>
                  <option value="unassigned">Unassigned</option>
                  {allDoctors.map(doc => (
                    <option key={doc._id} value={doc._id}>Dr. {doc.fullName}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Total Results Pill */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full">
                Total: {patients.length} {patients.length === 1 ? 'Patient' : 'Patients'}
              </span>
            </div>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="flex flex-col justify-center items-center h-64 text-slate-400 space-y-2">
                <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-medium">Loading patient directory...</span>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center h-64 text-rose-500 text-xs font-medium p-4 text-center">
                {error}
              </div>
            ) : patients.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-64 text-slate-400 space-y-2">
                <Users className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-medium text-slate-500">No patient records found.</p>
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">Patient ID</th>
                    <th className="px-5 py-3.5">Patient Name</th>
                    <th className="px-5 py-3.5">Demographics</th>
                    <th className="px-5 py-3.5">Contact Details</th>
                    <th className="px-5 py-3.5">Assigned Doctor</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.map((patient) => {
                    const initials = patient.fullName
                      ? patient.fullName
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      : 'PT';

                    return (
                      <tr key={patient._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-semibold uppercase">
                            #{patient._id.slice(-6).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-xs shrink-0 border border-teal-100">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-900 block truncate" title={patient.fullName}>
                                {patient.fullName}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          <span className="font-medium text-slate-800">{patient.age ? `${patient.age} yrs` : 'N/A'}</span>
                          <span className="text-slate-400 mx-1.5">•</span>
                          <span className="capitalize">{patient.profile?.gender || 'Not specified'}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="text-slate-800 font-medium">{patient.email}</div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {patient.profile?.phoneNumber || 'No phone'}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {patient.assignedDoctor?.fullName ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-100">
                              <Stethoscope className="w-3 h-3" />
                              Dr. {patient.assignedDoctor.fullName}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            patient.status === 'active' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {patient.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex justify-end items-center gap-1">
                            <button 
                              onClick={() => handleOpenView(patient)} 
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" 
                              title="View Patient Record"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleOpenAssignDoctor(patient)} 
                              className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer" 
                              title="Assign / Reassign Doctor"
                            >
                              <Stethoscope className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleToggleStatus(patient._id, patient.status)} 
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                patient.status === 'active' 
                                  ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' 
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`} 
                              title={patient.status === 'active' ? 'Deactivate Patient' : 'Activate Patient'}
                            >
                              {patient.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            </button>
                            <button 
                              onClick={() => handleDelete(patient._id)} 
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" 
                              title="Delete Patient"
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

      <PatientModal 
        isOpen={isAssignModalOpen} 
        onClose={() => setIsAssignModalOpen(false)} 
        onSubmit={handleAssignSubmit} 
        patient={selectedPatient} 
        loading={modalLoading} 
      />
      <PatientViewModal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
        patientId={selectedPatient?._id} 
      />
    </DashboardLayout>
  );
}
