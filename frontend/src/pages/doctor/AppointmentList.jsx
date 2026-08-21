import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import { FaSearch, FaFilter, FaCalendarAlt, FaStethoscope, FaEye, FaCheck, FaTimes, FaCalendarCheck } from 'react-icons/fa';

export default function AppointmentList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  // Modal States
  const [viewModalData, setViewModalData] = useState(null);
  
  const [completeModalData, setCompleteModalData] = useState(null);
  const [consultationNote, setConsultationNote] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [suggestedFollowUpDate, setSuggestedFollowUpDate] = useState('');
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/doctor/appointments');
      setAppointments(response.data.data);
    } catch (err) {
      setError('Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAppointment = async (e) => {
    e.preventDefault();
    if (!consultationNote.trim()) {
      setCompleteError('Consultation note is required.');
      return;
    }

    try {
      setCompleting(true);
      setCompleteError('');
      await apiClient.put(`/doctor/appointments/${completeModalData._id}/complete`, {
        consultationNote,
        followUpRequired,
        suggestedFollowUpDate: followUpRequired ? suggestedFollowUpDate : null
      });
      
      // Refresh list and close modal
      await fetchAppointments();
      closeCompleteModal();
    } catch (err) {
      setCompleteError(err.response?.data?.message || 'Failed to complete appointment.');
    } finally {
      setCompleting(false);
    }
  };

  const openCompleteModal = (appt) => {
    setCompleteModalData(appt);
    setConsultationNote('');
    setFollowUpRequired(false);
    setSuggestedFollowUpDate('');
    setCompleteError('');
  };

  const closeCompleteModal = () => {
    setCompleteModalData(null);
  };

  const filteredAppointments = appointments.filter(appt => {
    const matchesSearch = appt.patient.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' ? true : appt.status === statusFilter.toLowerCase();
    
    let matchesDate = true;
    if (dateFilter) {
      const apptDate = new Date(appt.date).toISOString().split('T')[0];
      matchesDate = apptDate === dateFilter;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <DashboardLayout role="doctor">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172033]">Appointments</h1>
          <p className="text-sm text-[#64748B] mt-1">Manage your approved and completed patient consultations.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search patient by name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div className="w-full md:w-48 relative">
            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="w-full md:w-48 relative">
            <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
            Loading appointments...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 bg-red-50">{error}</div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <div className="bg-slate-100 p-4 rounded-full mb-4">
              <FaCalendarAlt className="text-slate-400 text-3xl" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">No appointments found</h3>
            <p>We couldn't find any appointments matching your current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Patient Details</th>
                  <th className="px-6 py-4 font-medium">Schedule</th>
                  <th className="px-6 py-4 font-medium">Reason</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredAppointments.map((appt) => (
                  <tr key={appt._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{appt.patient.name}</div>
                      <div className="text-slate-500 text-xs mt-1">
                        ID: {appt._id.substring(appt._id.length - 8).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{new Date(appt.date).toLocaleDateString()}</div>
                      <div className="text-slate-500 text-xs mt-1">{appt.time}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700 truncate max-w-[200px]" title={appt.reason}>
                        {appt.reason || 'General Follow-up'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
                        appt.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        appt.status === 'approved' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        appt.status === 'cancelled' ? 'bg-slate-100 text-slate-700 border-slate-300' : ''
                      }`}>
                        {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setViewModalData(appt)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Appointment"
                        >
                          <FaEye />
                        </button>
                        
                        {appt.patient.userId && (
                          <Link 
                            to={`/doctor/patients/${appt.patient.userId}`}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View Patient Profile"
                          >
                            <FaUserIcon />
                          </Link>
                        )}
                        
                        {appt.status === 'approved' && (
                          <>
                            <Link 
                              to={`/doctor/assessments/new?patient=${appt.patient.userId}`}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Start Assessment"
                            >
                              <FaStethoscope />
                            </Link>
                            <button 
                              onClick={() => openCompleteModal(appt)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Mark as Completed"
                            >
                              <FaCheck />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Appointment Modal */}
      {viewModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Appointment Details</h3>
              <button 
                onClick={() => setViewModalData(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Patient Name</label>
                  <p className="font-medium text-slate-900">{viewModalData.patient.name}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Status</label>
                  <p className="font-medium text-slate-900 capitalize">{viewModalData.status}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Date</label>
                  <p className="font-medium text-slate-900">{new Date(viewModalData.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Time</label>
                  <p className="font-medium text-slate-900">{viewModalData.time}</p>
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-100">
                <label className="text-xs font-semibold text-slate-500 uppercase">Reason for Visit</label>
                <p className="text-sm text-slate-700 mt-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {viewModalData.reason || 'Not specified'}
                </p>
              </div>

              {viewModalData.patientNote && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 uppercase">Patient Note</label>
                  <p className="text-sm text-slate-700 mt-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {viewModalData.patientNote}
                  </p>
                </div>
              )}

              {viewModalData.adminNote && (
                <div>
                  <label className="text-xs font-semibold text-amber-600 uppercase">Admin Note</label>
                  <p className="text-sm text-slate-700 mt-1 bg-amber-50 p-3 rounded-lg border border-amber-100">
                    {viewModalData.adminNote}
                  </p>
                </div>
              )}

              {viewModalData.status === 'completed' && viewModalData.consultationNote && (
                <div>
                  <label className="text-xs font-semibold text-emerald-600 uppercase">Your Consultation Note</label>
                  <p className="text-sm text-slate-700 mt-1 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    {viewModalData.consultationNote}
                  </p>
                  {viewModalData.followUpRequired && (
                    <div className="mt-2 text-xs text-emerald-700 font-medium">
                      Follow-up recommended: {viewModalData.suggestedFollowUpDate ? new Date(viewModalData.suggestedFollowUpDate).toLocaleDateString() : 'Yes'}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setViewModalData(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
              >
                Close
              </button>
              {viewModalData.status === 'approved' && (
                <button 
                  onClick={() => {
                    const data = viewModalData;
                    setViewModalData(null);
                    openCompleteModal(data);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <FaCheck /> Mark Completed
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Complete Appointment Modal */}
      {completeModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
              <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                <FaCalendarCheck /> Complete Appointment
              </h3>
              <button 
                onClick={closeCompleteModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCompleteAppointment} className="p-6">
              {completeError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
                  {completeError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Patient Name</label>
                  <input type="text" value={completeModalData.patient.name} disabled className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-slate-100 text-slate-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input type="text" value={new Date(completeModalData.date).toLocaleDateString()} disabled className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-slate-100 text-slate-500 cursor-not-allowed" />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Consultation Note <span className="text-red-500">*</span></label>
                <textarea 
                  rows="4"
                  value={consultationNote}
                  onChange={(e) => setConsultationNote(e.target.value)}
                  placeholder="Enter your clinical findings, diagnosis, and recommendations..."
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                ></textarea>
              </div>

              <div className="mb-4 flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <input 
                  type="checkbox" 
                  id="followUp"
                  checked={followUpRequired}
                  onChange={(e) => setFollowUpRequired(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <label htmlFor="followUp" className="text-sm font-medium text-slate-800">
                  Follow-up Required?
                </label>
              </div>

              {followUpRequired && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Suggested Follow-up Date (Optional)</label>
                  <input 
                    type="date"
                    value={suggestedFollowUpDate}
                    onChange={(e) => setSuggestedFollowUpDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">This will help highlight the patient in your Dashboard.</p>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={closeCompleteModal}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={completing || !consultationNote.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {completing ? 'Saving...' : 'Complete Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}

// Simple internal icon for User
function FaUserIcon() {
  return (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
      <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z"></path>
    </svg>
  );
}
