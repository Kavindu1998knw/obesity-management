import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import { FaCalendarPlus, FaEye, FaBan, FaCalendarCheck, FaSearch, FaFilter } from 'react-icons/fa';

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
    } catch (err) {
      setError('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await apiClient.get('/patient/appointments/doctors');
      setDoctors(res.data.data);
    } catch (err) {
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
    const matchesSearch = appt.doctorId?.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? appt.status === statusFilter : true;
    const matchesDate = dateFilter ? new Date(appt.date).toISOString().split('T')[0] === dateFilter : true;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-bold uppercase">Pending</span>;
      case 'approved': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-bold uppercase">Approved</span>;
      case 'completed': return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-bold uppercase">Completed</span>;
      case 'rejected': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-bold uppercase">Rejected</span>;
      case 'cancelled': return <span className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs font-bold uppercase">Cancelled</span>;
      default: return <span>{status}</span>;
    }
  };

  return (
    <DashboardLayout role="patient">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172033]">Appointments</h1>
          <p className="text-sm text-[#64748B] mt-1">Manage your consultations and schedule new ones.</p>
        </div>
        <button 
          onClick={() => setShowRequestModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm"
        >
          <FaCalendarPlus /> Request Appointment
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6 p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by doctor name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <FaFilter className="text-slate-400" />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input 
            type="date" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-slate-300 rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading appointments...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-800">
                <tr>
                  <th className="px-6 py-4 font-bold">Appointment ID</th>
                  <th className="px-6 py-4 font-bold">Doctor</th>
                  <th className="px-6 py-4 font-bold">Date & Time</th>
                  <th className="px-6 py-4 font-bold">Reason</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredAppointments.length > 0 ? filteredAppointments.map(appt => (
                  <tr key={appt._id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {appt._id.substring(appt._id.length - 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">Dr. {appt.doctorId?.fullName || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{appt.doctorSpecialisation}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{new Date(appt.date).toLocaleDateString()}</p>
                      <p className="text-xs text-slate-500">{appt.time}</p>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate" title={appt.reason}>
                      {appt.reason}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(appt.status)}
                    </td>
                    <td className="px-6 py-4 flex justify-center gap-2">
                      <button 
                        onClick={() => openViewModal(appt)}
                        className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition"
                        title="View"
                      >
                        <FaEye />
                      </button>
                      {(appt.status === 'pending' || appt.status === 'approved') && (
                        <button 
                          onClick={() => openCancelModal(appt)}
                          className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded transition"
                          title="Cancel"
                        >
                          <FaBan />
                        </button>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                      <FaCalendarCheck className="mx-auto text-4xl text-slate-300 mb-3" />
                      <p className="font-medium">No appointments found.</p>
                      <p className="text-sm">Adjust your filters or request a new appointment.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Request Appointment Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h2 className="font-bold text-lg text-slate-800">Request Appointment</h2>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <form onSubmit={handleRequestSubmit} className="p-6">
              {requestError && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm border border-red-200 rounded">{requestError}</div>}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Doctor *</label>
                  <select 
                    value={doctorId} 
                    onChange={e => setDoctorId(e.target.value)}
                    required
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="">-- Choose a Doctor --</option>
                    {doctors.map(doc => (
                      <option key={doc._id} value={doc._id}>Dr. {doc.fullName} ({doc.specialisation})</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Date *</label>
                    <input 
                      type="date" 
                      value={date} 
                      onChange={e => setDate(e.target.value)}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Time *</label>
                    <input 
                      type="time" 
                      value={time} 
                      onChange={e => setTime(e.target.value)}
                      required
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Visit *</label>
                  <input 
                    type="text" 
                    value={reason} 
                    onChange={e => setReason(e.target.value)}
                    required
                    placeholder="e.g. Monthly checkup"
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Additional Note (Optional)</label>
                  <textarea 
                    value={additionalNote} 
                    onChange={e => setAdditionalNote(e.target.value)}
                    rows="2"
                    placeholder="Any specific symptoms or questions?"
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 text-sm"
                  ></textarea>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={requesting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {requesting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Appointment Modal */}
      {showViewModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h2 className="font-bold text-lg text-slate-800">Appointment Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Appointment ID</p>
                  <p className="font-mono text-slate-800">{selectedAppointment._id.toUpperCase()}</p>
                </div>
                <div>
                  {getStatusBadge(selectedAppointment.status)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Doctor</p>
                  <p className="font-medium">Dr. {selectedAppointment.doctorId?.fullName}</p>
                  <p className="text-xs text-slate-500">{selectedAppointment.doctorSpecialisation}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Date & Time</p>
                  <p className="font-medium">{new Date(selectedAppointment.date).toLocaleDateString()}</p>
                  <p className="text-xs text-slate-500">{selectedAppointment.time}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 uppercase font-bold">Reason</p>
                <p className="bg-slate-50 p-2 rounded border border-slate-100">{selectedAppointment.reason}</p>
              </div>

              {selectedAppointment.patientNote && (
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Your Note</p>
                  <p className="bg-slate-50 p-2 rounded border border-slate-100">{selectedAppointment.patientNote}</p>
                </div>
              )}

              {selectedAppointment.adminNote && (
                <div>
                  <p className="text-xs text-indigo-500 uppercase font-bold">Admin Note</p>
                  <p className="bg-indigo-50 p-2 rounded border border-indigo-100 text-indigo-900">{selectedAppointment.adminNote}</p>
                </div>
              )}

              {selectedAppointment.rejectionReason && (
                <div>
                  <p className="text-xs text-red-500 uppercase font-bold">Rejection Reason</p>
                  <p className="bg-red-50 p-2 rounded border border-red-100 text-red-900">{selectedAppointment.rejectionReason}</p>
                </div>
              )}

              {selectedAppointment.cancellationReason && (
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Cancellation Reason</p>
                  <p className="bg-slate-100 p-2 rounded border border-slate-200 text-slate-700">{selectedAppointment.cancellationReason}</p>
                </div>
              )}
              
              <div className="text-xs text-slate-400 pt-2 border-t text-right">
                Created: {new Date(selectedAppointment.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Appointment Modal */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-rose-50 flex justify-between items-center">
              <h2 className="font-bold text-lg text-rose-800">Cancel Appointment</h2>
              <button onClick={() => setShowCancelModal(false)} className="text-rose-400 hover:text-rose-600">×</button>
            </div>
            <form onSubmit={handleCancelSubmit} className="p-6">
              {cancelError && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm border border-red-200 rounded">{cancelError}</div>}
              
              <div className="bg-slate-50 p-3 rounded border border-slate-200 text-sm mb-4">
                <p><strong>Doctor:</strong> Dr. {selectedAppointment.doctorId?.fullName}</p>
                <p><strong>Date:</strong> {new Date(selectedAppointment.date).toLocaleDateString()} at {selectedAppointment.time}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Cancellation *</label>
                <textarea 
                  value={cancellationReason} 
                  onChange={e => setCancellationReason(e.target.value)}
                  required
                  rows="3"
                  placeholder="Please state why you are cancelling..."
                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-rose-500 text-sm"
                ></textarea>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                >
                  Keep Appointment
                </button>
                <button 
                  type="submit" 
                  disabled={cancelling}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
