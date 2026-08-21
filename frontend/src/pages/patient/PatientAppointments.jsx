import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import {
  CalendarCheck,
  CalendarPlus,
  Search,
  Eye,
  Ban,
  Loader2,
  X,
  Clock,
  AlertTriangle
} from 'lucide-react';

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Modals state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  // Request Form state
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [additionalNote, setAdditionalNote] = useState('');
  const [requestError, setRequestError] = useState('');
  const [requesting, setRequesting] = useState(false);

  // Cancel Form state
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/patient/appointments');
      setAppointments(res.data.data);
    } catch {
      setError('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await apiClient.get('/patient/appointments/doctors');
      setDoctors(res.data.data);
    } catch {
      console.error('Failed to load active doctors.');
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setRequestError('');
    
    if (!doctorId || !date || !time || !reason) {
      setRequestError('Please fill in all required fields.');
      return;
    }

    const today = new Date();
    today.setHours(0,0,0,0);
    const selectedDate = new Date(date);
    if (selectedDate < today) {
      setRequestError('Past dates are not allowed.');
      return;
    }

    try {
      setRequesting(true);
      await apiClient.post('/patient/appointments', { doctorId, date, time, reason, additionalNote });
      setShowRequestModal(false);
      setDoctorId('');
      setDate('');
      setTime('');
      setReason('');
      setAdditionalNote('');
      fetchAppointments();
    } catch (err) {
      setRequestError(err.response?.data?.message || 'Failed to request appointment.');
    } finally {
      setRequesting(false);
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    setCancelError('');

    if (!cancellationReason.trim()) {
      setCancelError('Please provide a reason for cancellation.');
      return;
    }

    try {
      setCancelling(true);
      await apiClient.put(`/patient/appointments/${selectedAppointment._id}/cancel`, { cancellationReason });
      setShowCancelModal(false);
      setCancellationReason('');
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Failed to cancel appointment.');
    } finally {
      setCancelling(false);
    }
  };

  const openViewModal = (appt) => {
    setSelectedAppointment(appt);
    setShowViewModal(true);
  };

  const openCancelModal = (appt) => {
    setSelectedAppointment(appt);
    setCancellationReason('');
    setCancelError('');
    setShowCancelModal(true);
  };

  const filteredAppointments = appointments.filter(appt => {
    const matchesSearch = appt.doctorId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || appt._id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? appt.status === statusFilter : true;
    const matchesDate = dateFilter ? new Date(appt.date).toISOString().split('T')[0] === dateFilter : true;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Pending</span>;
      case 'approved': 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Approved</span>;
      case 'completed': 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">Completed</span>;
      case 'rejected': 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Rejected</span>;
      case 'cancelled': 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">Cancelled</span>;
      default: 
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <DashboardLayout role="patient">
      <div className="space-y-6 pb-12">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-xs">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinical Appointments</h1>
                <p className="text-xs text-slate-500 mt-0.5">Manage consultations, view schedules, and request checkups with your doctor.</p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setShowRequestModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer self-end sm:self-auto"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Request Appointment</span>
          </button>
        </div>

        {/* Main Card Container */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[520px]">
          
          {/* Filter Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 flex-wrap">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search by doctor name or ID..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Status Filter */}
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-xs bg-white text-slate-700 font-medium cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {/* Date Filter */}
              <input 
                type="date" 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-xs bg-white text-slate-700 font-medium cursor-pointer"
              />
            </div>

            {/* Total Indicator */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full">
                Total: {filteredAppointments.length} {filteredAppointments.length === 1 ? 'Appointment' : 'Appointments'}
              </span>
            </div>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="flex flex-col justify-center items-center h-64 text-slate-400 space-y-2">
                <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-medium">Loading appointments...</span>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center h-64 text-rose-500 text-xs font-medium p-4 text-center">
                {error}
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-64 text-slate-400 space-y-2">
                <CalendarCheck className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-medium text-slate-500">No appointments found matching your criteria.</p>
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">Appointment ID</th>
                    <th className="px-5 py-3.5">Doctor</th>
                    <th className="px-5 py-3.5">Date & Time</th>
                    <th className="px-5 py-3.5">Reason for Visit</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.map((appt) => (
                    <tr key={appt._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-semibold uppercase">
                          #{appt._id.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">Dr. {appt.doctorId?.fullName || 'Assigned Specialist'}</div>
                        <div className="text-[11px] text-slate-400">{appt.doctorSpecialisation || 'Clinical Specialist'}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-800">{new Date(appt.date).toLocaleDateString()}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{appt.time}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 max-w-xs truncate" title={appt.reason}>
                        <span className="text-slate-700">{appt.reason}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {getStatusBadge(appt.status)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end items-center gap-1">
                          <button 
                            onClick={() => openViewModal(appt)}
                            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {(appt.status === 'pending' || appt.status === 'approved') && (
                            <button 
                              onClick={() => openCancelModal(appt)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Cancel Request"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Request Appointment Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={() => setShowRequestModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CalendarPlus className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900">Request Appointment</h3>
              </div>
              <button onClick={() => setShowRequestModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="p-6 space-y-4 text-xs">
              {requestError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{requestError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Doctor <span className="text-rose-500">*</span>
                </label>
                <select 
                  value={doctorId} 
                  onChange={e => setDoctorId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
                >
                  <option value="">-- Choose Assigned Doctor --</option>
                  {doctors.map(doc => (
                    <option key={doc._id} value={doc._id}>Dr. {doc.fullName} ({doc.specialisation})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Preferred Date <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Preferred Time <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="time" 
                    value={time} 
                    onChange={e => setTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Visit <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={reason} 
                  onChange={e => setReason(e.target.value)}
                  required
                  placeholder="e.g. Monthly progress checkup, diet consultation"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Additional Symptoms or Notes</label>
                <textarea 
                  value={additionalNote} 
                  onChange={e => setAdditionalNote(e.target.value)}
                  rows="2"
                  placeholder="Any specific symptoms, weight changes, or concerns?"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={requesting}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {requesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarPlus className="w-3.5 h-3.5" />}
                  <span>{requesting ? 'Submitting...' : 'Submit Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Appointment Modal */}
      {showViewModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={() => setShowViewModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900">Appointment Details</h3>
              </div>
              <button onClick={() => setShowViewModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Appointment ID</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-semibold uppercase mt-0.5">
                    #{selectedAppointment._id.slice(-6).toUpperCase()}
                  </span>
                </div>
                <div>
                  {getStatusBadge(selectedAppointment.status)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Attending Doctor</p>
                  <p className="font-bold text-slate-900 mt-0.5">Dr. {selectedAppointment.doctorId?.fullName || 'Assigned Specialist'}</p>
                  <p className="text-[11px] text-slate-500">{selectedAppointment.doctorSpecialisation}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Date & Scheduled Time</p>
                  <p className="font-bold text-slate-900 mt-0.5">{new Date(selectedAppointment.date).toLocaleDateString()}</p>
                  <p className="text-[11px] text-slate-500">{selectedAppointment.time}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Reason for Visit</p>
                <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-800">{selectedAppointment.reason}</p>
              </div>

              {selectedAppointment.patientNote && (
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Patient Notes</p>
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700">{selectedAppointment.patientNote}</p>
                </div>
              )}

              {selectedAppointment.adminNote && (
                <div>
                  <p className="text-[10px] text-teal-700 font-bold uppercase mb-1">Clinical Remarks</p>
                  <p className="p-3 bg-teal-50/70 rounded-xl border border-teal-100 text-teal-950 font-medium">{selectedAppointment.adminNote}</p>
                </div>
              )}

              {selectedAppointment.rejectionReason && (
                <div>
                  <p className="text-[10px] text-rose-700 font-bold uppercase mb-1">Rejection Reason</p>
                  <p className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-rose-900">{selectedAppointment.rejectionReason}</p>
                </div>
              )}

              {selectedAppointment.cancellationReason && (
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Cancellation Reason</p>
                  <p className="p-3 bg-slate-100 rounded-xl border border-slate-200 text-slate-700">{selectedAppointment.cancellationReason}</p>
                </div>
              )}
              
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 text-right">
                Recorded on {new Date(selectedAppointment.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Appointment Modal */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={() => setShowCancelModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-rose-100 bg-rose-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Ban className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-sm text-rose-900">Cancel Appointment Request</h3>
              </div>
              <button onClick={() => setShowCancelModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="p-6 space-y-4 text-xs">
              {cancelError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                  {cancelError}
                </div>
              )}
              
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                <p><strong>Doctor:</strong> Dr. {selectedAppointment.doctorId?.fullName}</p>
                <p><strong>Scheduled:</strong> {new Date(selectedAppointment.date).toLocaleDateString()} at {selectedAppointment.time}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Cancellation <span className="text-rose-500">*</span>
                </label>
                <textarea 
                  value={cancellationReason} 
                  onChange={e => setCancellationReason(e.target.value)}
                  required
                  rows="3"
                  placeholder="Please specify why you need to cancel this appointment..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Keep Appointment
                </button>
                <button 
                  type="submit" 
                  disabled={cancelling}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                  <span>{cancelling ? 'Cancelling...' : 'Confirm Cancellation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
