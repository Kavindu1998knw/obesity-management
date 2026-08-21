import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import AppointmentViewModal from '../../components/admin/AppointmentViewModal';
import AppointmentRejectModal from '../../components/admin/AppointmentRejectModal';
import AppointmentRescheduleModal from '../../components/admin/AppointmentRescheduleModal';
import AppointmentApproveModal from '../../components/admin/AppointmentApproveModal';
import AppointmentCancelModal from '../../components/admin/AppointmentCancelModal';
import apiClient from '../../services/apiClient';
import {
  CalendarCheck,
  Search,
  Eye,
  Check,
  Ban,
  CalendarDays,
  Trash2
} from 'lucide-react';

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
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      completed: 'bg-sky-50 text-sky-700 border-sky-200',
      rejected: 'bg-rose-50 text-rose-700 border-rose-200',
      cancelled: 'bg-slate-100 text-slate-700 border-slate-200'
    };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${styles[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>{status}</span>;
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 pb-10">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-xs">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Appointment Management</h1>
                <p className="text-xs text-slate-500 mt-0.5">Approve, reschedule, track, and manage clinic consultation requests.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Card Container */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[520px]">
          
          {/* Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 flex-wrap">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search ID, Patient or Doctor..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
              
              {/* Date Filter */}
              <input 
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-xs bg-white text-slate-700 font-medium cursor-pointer"
              />

              {/* Status Filter */}
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-xs bg-white text-slate-700 font-medium cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Doctor Filter */}
              <select 
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-xs bg-white text-slate-700 font-medium max-w-[170px] truncate cursor-pointer"
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
            
            {/* Total Count */}
            <div className="flex items-center gap-2 self-end lg:self-auto">
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full">
                Results: {filteredApps.length}
              </span>
            </div>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="flex flex-col justify-center items-center h-64 text-slate-400 space-y-2">
                <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-medium">Loading appointments schedule...</span>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center h-64 text-rose-500 text-xs font-medium p-4 text-center">
                {error}
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-64 text-slate-400 space-y-2">
                <CalendarCheck className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-medium text-slate-500">No appointments match your filters.</p>
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">Appt ID</th>
                    <th className="px-5 py-3.5">Patient</th>
                    <th className="px-5 py-3.5">Doctor</th>
                    <th className="px-5 py-3.5">Schedule</th>
                    <th className="px-5 py-3.5">Reason</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApps.map((app) => (
                    <tr key={app._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-semibold uppercase">
                          #{app._id.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-900 block truncate">
                          {app.patientId?.fullName || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 font-medium">
                        Dr. {app.doctorId?.fullName ? app.doctorId.fullName.replace(/^Dr\.\s*/i, '') : 'Unassigned'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-800">
                          {new Date(app.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {app.time || '10:00 AM'}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 max-w-[160px] truncate" title={app.reason || 'No reason'}>
                        {app.reason || 'General Consultation'}
                      </td>
                      <td className="px-5 py-3.5">
                        {getStatusBadge(app.status)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end items-center gap-1">
                          <button 
                            onClick={() => openView(app)} 
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" 
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {app.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => openApprove(app)} 
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer" 
                                title="Approve Request"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => openReject(app)} 
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" 
                                title="Reject Request"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {(app.status === 'pending' || app.status === 'approved') && (
                            <>
                              <button 
                                onClick={() => openReschedule(app)} 
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer" 
                                title="Reschedule Session"
                              >
                                <CalendarDays className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => openCancel(app)} 
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" 
                                title="Cancel Appointment"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {/* Note: Admin cannot mark as completed */}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
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
