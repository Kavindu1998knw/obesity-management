import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import {
  CalendarCheck,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Activity,
  X,
  Loader2,
  FileText,
  AlertCircle
} from 'lucide-react';

export default function AppointmentList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  // Modal States
  const [viewModalData, setViewModalData] = useState(null);

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

  const filteredAppointments = appointments.filter(appt => {
    const matchesSearch = appt.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || appt._id.toLowerCase().includes(searchTerm.toLowerCase());
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
      <div className="space-y-6 pb-10">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-xs">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Doctor Consultations</h1>
                <p className="text-xs text-slate-500 mt-0.5">Manage patient consultation appointments, add notes, and complete clinical sessions.</p>
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
                  placeholder="Search by ID or patient name..." 
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
                <option value="All">All Statuses</option>
                <option value="pending_patient_confirmation">Awaiting Patient</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            {/* Total Results */}
            <div className="flex items-center gap-2 self-end lg:self-auto">
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full">
                Results: {filteredAppointments.length}
              </span>
            </div>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="flex flex-col justify-center items-center h-64 text-slate-400 space-y-2">
                <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-medium">Loading consultation schedule...</span>
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
                    <th className="px-5 py-3.5">Appt ID</th>
                    <th className="px-5 py-3.5">Patient Details</th>
                    <th className="px-5 py-3.5">Schedule</th>
                    <th className="px-5 py-3.5">Reason</th>
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
                        <div className="font-semibold text-slate-900">{appt.patient?.name || 'Unknown'}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {appt.patient?.age ? `${appt.patient.age} yrs` : ''} • {appt.patient?.gender || ''}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-800">
                          {new Date(appt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {appt.time || '10:00 AM'}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 max-w-[160px] truncate" title={appt.reason || 'General Consultation'}>
                        {appt.reason || 'General Consultation'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${
                          appt.status === 'completed' 
                            ? 'bg-sky-50 text-sky-700 border-sky-200' 
                            : appt.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : appt.status === 'pending_patient_confirmation'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {appt.status === 'pending_patient_confirmation' ? 'Awaiting Patient' : appt.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          <button
                            onClick={() => setViewModalData(appt)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="View Consultation Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {(appt.patient?.userId || appt.patient?.id) && (
                            <Link
                              to={`/doctor/patients/${appt.patient.userId || appt.patient.id}`}
                              className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                              title="View Patient Profile"
                            >
                              <User className="w-4 h-4" />
                            </Link>
                          )}

                          {appt.status === 'completed' && appt.assessmentId && (
                            <Link
                              to={`/doctor/assessments/${appt.assessmentId}`}
                              className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                              title="View Linked Assessment Report"
                            >
                              <FileText className="w-4 h-4 text-teal-600" />
                            </Link>
                          )}

                          {appt.status === 'approved' && (
                            <Link
                              to={`/doctor/assessments/new?patient=${appt.patient?.userId || appt.patient?.id}&appointment=${appt._id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-2xs transition-colors cursor-pointer ml-1"
                              title="Conduct Patient Assessment"
                            >
                              <Activity className="w-3.5 h-3.5" />
                              <span>Start Assessment</span>
                            </Link>
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

      {/* VIEW MODAL */}
      {viewModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={() => setViewModalData(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Consultation Details</h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-semibold uppercase mt-0.5">
                    #{viewModalData._id?.slice(-6).toUpperCase()}
                  </span>
                </div>
              </div>
              <button onClick={() => setViewModalData(null)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient:</span>
                  <span className="font-bold text-slate-900">{viewModalData.patient?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheduled Date:</span>
                  <span className="font-semibold text-slate-800">{new Date(viewModalData.date).toLocaleDateString()} at {viewModalData.time || '10:00 AM'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className={`font-bold capitalize ${
                    viewModalData.status === 'completed' ? 'text-teal-700' : 
                    viewModalData.status === 'approved' ? 'text-emerald-700' : 
                    viewModalData.status === 'pending_patient_confirmation' ? 'text-orange-700' : 
                    'text-slate-700'
                  }`}>
                    {viewModalData.status === 'pending_patient_confirmation' ? 'Awaiting Patient' : viewModalData.status}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-1">Reason for Visit:</h4>
                <p className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-slate-700">{viewModalData.reason || 'General Consultation'}</p>
              </div>

              {viewModalData.patientNote && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Patient Additional Note:</h4>
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-slate-700">{viewModalData.patientNote}</p>
                </div>
              )}

              {viewModalData.consultationNote && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Doctor Consultation Note:</h4>
                  <p className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 text-teal-900 leading-relaxed">{viewModalData.consultationNote}</p>
                </div>
              )}

              {viewModalData.followUpRequired && viewModalData.suggestedFollowUpDate && (
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-emerald-900 flex justify-between">
                  <span className="font-semibold">Suggested Follow-Up Date:</span>
                  <span className="font-bold">{new Date(viewModalData.suggestedFollowUpDate).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setViewModalData(null)} className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
                Close
              </button>

              {viewModalData.status === 'approved' && (
                <Link
                  to={`/doctor/assessments/new?patient=${viewModalData.patient?.userId || viewModalData.patient?.id}&appointment=${viewModalData._id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Activity className="w-4 h-4" />
                  <span>Start Patient Assessment</span>
                </Link>
              )}

              {viewModalData.status === 'completed' && viewModalData.assessmentId && (
                <Link
                  to={`/doctor/assessments/${viewModalData.assessmentId}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>View Assessment Report</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
