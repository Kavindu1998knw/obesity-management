import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import DoctorModal from '../../components/admin/DoctorModal';
import apiClient from '../../services/apiClient';
import { FaPlus, FaMagnifyingGlass, FaPen, FaBan, FaCheck, FaUserDoctor, FaEye, FaTrash, FaFilter } from 'react-icons/fa6';

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
      // Typically you'd pass this error back to the modal, but for simplicity we alert
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
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172033] flex items-center gap-2">
            <FaUserDoctor className="text-blue-600" />
            Doctor Management
          </h1>
          <p className="text-sm text-[#64748B] mt-1">Add, edit, or deactivate medical practitioners.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <FaPlus /> Add Doctor
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
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
                value={specFilter}
                onChange={(e) => setSpecFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white max-w-[150px] truncate"
              >
                {uniqueSpecialisations.map(spec => (
                  <option key={spec} value={spec}>
                    {spec === 'all' ? 'All Specialisations' : spec}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="text-sm text-slate-500 font-medium whitespace-nowrap">
            Total Results: {filteredDoctors.length}
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64 text-slate-500">Loading doctors...</div>
          ) : error ? (
            <div className="flex justify-center items-center h-64 text-rose-500">{error}</div>
          ) : filteredDoctors.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-64 text-slate-500">
              <FaUserDoctor className="text-4xl text-slate-300 mb-3" />
              <p>No doctors found.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Doctor ID</th>
                  <th className="px-6 py-4 font-semibold">Doctor Name</th>
                  <th className="px-6 py-4 font-semibold">Email & Phone</th>
                  <th className="px-6 py-4 font-semibold">Specialisation</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDoctors.map((doctor) => (
                  <tr key={doctor._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 uppercase">...{doctor._id.slice(-6)}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">Dr. {doctor.fullName}</div>
                      {doctor.profile?.qualification && <div className="text-xs text-slate-500 mt-0.5">{doctor.profile.qualification}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900">{doctor.email}</div>
                      <div className="text-xs text-slate-500">{doctor.profile?.phoneNumber || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{doctor.profile?.specialisation || 'Not Set'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        doctor.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {doctor.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <button 
                          onClick={() => handleOpenModal(doctor, true)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                          title="View Doctor"
                        >
                          <FaEye />
                        </button>
                        <button 
                          onClick={() => handleOpenModal(doctor, false)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Doctor"
                        >
                          <FaPen />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(doctor._id, doctor.status)}
                          className={`p-1.5 rounded transition-colors ${
                            doctor.status === 'active' 
                              ? 'text-amber-600 hover:bg-amber-50' 
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={doctor.status === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          {doctor.status === 'active' ? <FaBan /> : <FaCheck />}
                        </button>
                        <button 
                          onClick={() => handleDelete(doctor._id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete Doctor"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
