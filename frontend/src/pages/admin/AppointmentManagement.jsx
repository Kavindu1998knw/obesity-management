import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import AppointmentViewModal from '../../components/admin/AppointmentViewModal';
import AppointmentRejectModal from '../../components/admin/AppointmentRejectModal';
import AppointmentRescheduleModal from '../../components/admin/AppointmentRescheduleModal';
import AppointmentApproveModal from '../../components/admin/AppointmentApproveModal';
import AppointmentCancelModal from '../../components/admin/AppointmentCancelModal';
import apiClient from '../../services/apiClient';
import { FaMagnifyingGlass, FaCalendarCheck, FaEye, FaCheck, FaBan, FaCalendarDay, FaTrash } from 'react-icons/fa6';

export default function AppointmentManagement() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  // Modals
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/appointments');
      setAppointments(res.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleApproveSubmit = async (data) => {
    try {
      setModalLoading(true);
      await apiClient.patch(`/admin/appointments/${selectedAppointment._id}/status`, { 
        status: 'approved',
        adminNote: data.adminNote 
      });
      await fetchAppointments();
      setIsApproveOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCancelSubmit = async (data) => {
    try {
      setModalLoading(true);
      await apiClient.patch(`/admin/appointments/${selectedAppointment._id}/status`, { 
        status: 'cancelled',
        cancellationReason: data.cancellationReason
      });
      await fetchAppointments();
      setIsCancelOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel');
    } finally {
      setModalLoading(false);
    }
  };

  const handleRejectSubmit = async (reason) => {
    try {
      setModalLoading(true);
      await apiClient.patch(`/admin/appointments/${selectedAppointment._id}/status`, { 
        status: 'rejected',
        rejectionReason: reason
      });
      await fetchAppointments();
      setIsRejectOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject');
    } finally {
      setModalLoading(false);
    }
  };

  const handleRescheduleSubmit = async (formData) => {
    try {
      setModalLoading(true);
      await apiClient.put(`/admin/appointments/${selectedAppointment._id}/reschedule`, formData);
      await fetchAppointments();
      setIsRescheduleOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reschedule');
    } finally {
      setModalLoading(false);
    }
  };

  const openReject = (app) => {
    setSelectedAppointment(app);
    setIsRejectOpen(true);
  };

  const openReschedule = (app) => {
    setSelectedAppointment(app);
    setIsRescheduleOpen(true);
  };

  const openApprove = (app) => {
    setSelectedAppointment(app);
    setIsApproveOpen(true);
  };

  const openCancel = (app) => {
    setSelectedAppointment(app);
    setIsCancelOpen(true);
  };

  const openView = (app) => {
    setSelectedAppointment(app);
    setIsViewOpen(true);
  };

  const filteredApps = appointments.filter(a => {
    const searchMatch = 
      a.patientId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.doctorId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a._id.toLowerCase().includes(searchTerm.toLowerCase());
      
    const statusMatch = statusFilter === 'all' || a.status === statusFilter;
    const docMatch = doctorFilter === 'all' || a.doctorId?._id === doctorFilter;
    const dateMatch = !dateFilter || new Date(a.date).toISOString().split('T')[0] === dateFilter;

    return searchMatch && statusMatch && docMatch && dateMatch;
  });

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-800 border-amber-200',
      approved: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      rejected: 'bg-rose-100 text-rose-800 border-rose-200',
      cancelled: 'bg-slate-100 text-slate-800 border-slate-200'
    };
    return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${styles[status]}`}>{status}</span>;
  };

  return (
    <DashboardLayout role="admin">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#172033] flex items-center gap-2">
          <FaCalendarCheck className="text-blue-600" />
          Appointment Management
        </h1>
        <p className="text-sm text-[#64748B] mt-1">Review, approve, and reschedule clinic appointments.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto">
            <div className="relative w-full md:w-64">
              <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search ID, Patient or Doctor..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
              />
            </div>
            
            <input 
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
            />

            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select 
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white max-w-[150px] truncate"
            >
              <option value="all">All Doctors</option>
              {appointments
                .map(a => a.doctorId)
                .filter((v, i, a) => v && a.findIndex(t => t._id === v._id) === i)
                .map(doc => (
                  <option key={doc._id} value={doc._id}>Dr. {doc.fullName}</option>
                ))}
            </select>
          </div>
          
          <div className="text-sm text-slate-500 font-medium whitespace-nowrap">
            Results: {filteredApps.length}
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64 text-slate-500">Loading appointments...</div>
          ) : error ? (
            <div className="flex justify-center items-center h-64 text-rose-500">{error}</div>
          ) : filteredApps.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-64 text-slate-500">
              <FaCalendarCheck className="text-4xl text-slate-300 mb-3" />
              <p>No appointments match your filters.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Appointment ID</th>
                  <th className="px-6 py-4 font-semibold">Patient Name</th>
                  <th className="px-6 py-4 font-semibold">Doctor Name</th>
                  <th className="px-6 py-4 font-semibold">Appointment Date</th>
                  <th className="px-6 py-4 font-semibold">Appointment Time</th>
                  <th className="px-6 py-4 font-semibold">Reason</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApps.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 uppercase">...{app._id.slice(-6)}</td>
                    <td className="px-6 py-4 text-slate-900 font-medium">{app.patientId?.fullName || 'Unknown'}</td>
                    <td className="px-6 py-4 text-slate-700">Dr. {app.doctorId?.fullName || 'Unknown'}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{new Date(app.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{app.time}</td>
                    <td className="px-6 py-4 text-slate-600 truncate max-w-[150px]">{app.reason || 'N/A'}</td>
                    <td className="px-6 py-4">{getStatusBadge(app.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openView(app)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded" title="View Details">
                          <FaEye />
                        </button>
                        
                        {app.status === 'pending' && (
                          <>
                            <button onClick={() => openApprove(app)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" title="Approve">
                              <FaCheck />
                            </button>
                            <button onClick={() => openReject(app)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded" title="Reject">
                              <FaBan />
                            </button>
                          </>
                        )}

                        {(app.status === 'pending' || app.status === 'approved') && (
                          <>
                            <button onClick={() => openReschedule(app)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded" title="Reschedule">
                              <FaCalendarDay />
                            </button>
                            <button onClick={() => openCancel(app)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded" title="Cancel">
                              <FaTrash />
                            </button>
                          </>
                        )}
                        {/* Note: No Completed Action for Admin */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AppointmentViewModal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} appointment={selectedAppointment} />
      <AppointmentRejectModal isOpen={isRejectOpen} onClose={() => setIsRejectOpen(false)} onSubmit={handleRejectSubmit} appointment={selectedAppointment} loading={modalLoading} />
      <AppointmentRescheduleModal isOpen={isRescheduleOpen} onClose={() => setIsRescheduleOpen(false)} onSubmit={handleRescheduleSubmit} appointment={selectedAppointment} loading={modalLoading} />
      <AppointmentApproveModal isOpen={isApproveOpen} onClose={() => setIsApproveOpen(false)} onSubmit={handleApproveSubmit} appointment={selectedAppointment} loading={modalLoading} />
      <AppointmentCancelModal isOpen={isCancelOpen} onClose={() => setIsCancelOpen(false)} onSubmit={handleCancelSubmit} appointment={selectedAppointment} loading={modalLoading} />
    </DashboardLayout>
  );
}
