import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import PatientModal from '../../components/admin/PatientModal';
import PatientViewModal from '../../components/admin/PatientViewModal';
import apiClient from '../../services/apiClient';
import { FaMagnifyingGlass, FaUserDoctor, FaBan, FaCheck, FaUsers, FaEye, FaTrash } from 'react-icons/fa6';

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

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await apiClient.get('/admin/doctors');
      setAllDoctors(res.data.data.filter(d => d.status === 'active'));
    } catch (err) {
      console.error('Failed to fetch doctors for filter');
    }
  };

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#172033] flex items-center gap-2">
          <FaUsers className="text-blue-600" />
          Patient Management
        </h1>
        <p className="text-sm text-[#64748B] mt-1">View patient records, assign doctors, and manage access.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search name or email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
              />
            </div>
            
            <div className="flex gap-3">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select 
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white max-w-[180px] truncate"
              >
                <option value="all">All Doctors</option>
                <option value="unassigned">Unassigned</option>
                {allDoctors.map(doc => (
                  <option key={doc._id} value={doc._id}>Dr. {doc.fullName}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="text-sm text-slate-500 font-medium whitespace-nowrap">
            Total Patients: {patients.length}
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64 text-slate-500">Loading patients...</div>
          ) : error ? (
            <div className="flex justify-center items-center h-64 text-rose-500">{error}</div>
          ) : patients.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-64 text-slate-500">
              <FaUsers className="text-4xl text-slate-300 mb-3" />
              <p>No patients found.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Patient ID</th>
                  <th className="px-6 py-4 font-semibold">Patient Name</th>
                  <th className="px-6 py-4 font-semibold">Age</th>
                  <th className="px-6 py-4 font-semibold">Gender</th>
                  <th className="px-6 py-4 font-semibold">Email Address</th>
                  <th className="px-6 py-4 font-semibold">Phone Number</th>
                  <th className="px-6 py-4 font-semibold">Assigned Doctor</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((patient) => {
                  return (
                    <tr key={patient._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">...{patient._id.slice(-6)}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{patient.fullName}</td>
                      <td className="px-6 py-4 text-slate-600">{patient.age ?? 'N/A'}</td>
                      <td className="px-6 py-4 text-slate-600 capitalize">{patient.profile?.gender || 'Not Provided'}</td>
                      <td className="px-6 py-4 text-slate-600">{patient.email}</td>
                      <td className="px-6 py-4 text-slate-600">{patient.profile?.phoneNumber || 'Not Provided'}</td>
                      <td className="px-6 py-4 text-slate-900 font-medium">
                        {patient.assignedDoctor?.fullName ? `Dr. ${patient.assignedDoctor.fullName}` : <span className="text-amber-600 text-xs bg-amber-50 px-2 py-1 rounded">Unassigned</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          patient.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {patient.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <button onClick={() => handleOpenView(patient)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded" title="View Medical Profile">
                            <FaEye />
                          </button>
                          <button onClick={() => handleOpenAssignDoctor(patient)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Assign Doctor">
                            <FaUserDoctor />
                          </button>
                          <button onClick={() => handleToggleStatus(patient._id, patient.status)} className={`p-1.5 rounded ${patient.status === 'active' ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`} title={patient.status === 'active' ? 'Deactivate' : 'Activate'}>
                            {patient.status === 'active' ? <FaBan /> : <FaCheck />}
                          </button>
                          <button onClick={() => handleDelete(patient._id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded" title="Delete Patient">
                            <FaTrash />
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

      <PatientModal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} onSubmit={handleAssignSubmit} patient={selectedPatient} loading={modalLoading} />
      <PatientViewModal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} patientId={selectedPatient?._id} />
    </DashboardLayout>
  );
}
