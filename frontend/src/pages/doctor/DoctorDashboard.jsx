import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import SummaryCard from '../../components/dashboard/SummaryCard';
import EmptyState from '../../components/dashboard/EmptyState';
import LoadingDashboard from '../../components/dashboard/LoadingDashboard';
import DashboardError from '../../components/dashboard/DashboardError';
import apiClient from '../../services/apiClient';

import {
  Users,
  CalendarCheck,
  Clock,
  Stethoscope,
  AlertTriangle,
  Utensils,
  TrendingUp,
  Activity,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Calendar
} from 'lucide-react';

export default function DoctorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [doctorName, setDoctorName] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/dashboard/doctor');
      setData(response.data.data);
      
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setDoctorName(JSON.parse(savedUser).fullName);
      }
    } catch (err) {
      if (err.response?.status !== 401) {
        setError(err.response?.data?.message || 'Failed to load dashboard data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <DashboardLayout role="doctor"><LoadingDashboard /></DashboardLayout>;
  }

  if (error) {
    return <DashboardLayout role="doctor"><DashboardError message={error} onRetry={fetchDashboardData} /></DashboardLayout>;
  }

  if (!data) return null;

  const { summary, todayAppointments, patientsAwaitingAssessment, recentPredictions, followUpRequired } = data;

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-6 pb-10">
        
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-xs">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Welcome, Dr. {doctorName.replace(/^Dr\.\s*/i, '')}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review daily clinical schedule, assess patient risk classifications, and manage dietary plans.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Link
              to="/doctor/assessments/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Activity className="w-4 h-4" />
              <span>New Assessment</span>
            </Link>
          </div>
        </div>

        {/* 6 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <SummaryCard 
            title="Assigned Patients" 
            value={summary.assignedPatients} 
            icon={Users} 
            colorClass="bg-indigo-50 text-indigo-600 border border-indigo-100" 
          />
          <SummaryCard 
            title="Today's Appts" 
            value={summary.todayAppointmentsCount} 
            icon={CalendarCheck} 
            colorClass="bg-teal-50 text-teal-600 border border-teal-100" 
          />
          <SummaryCard 
            title="Pending Assessments" 
            value={summary.pendingAssessments} 
            icon={Clock} 
            colorClass="bg-amber-50 text-amber-600 border border-amber-100" 
          />
          <SummaryCard 
            title="Completed Assessments" 
            value={summary.completedAssessments} 
            icon={CheckCircle2} 
            colorClass="bg-emerald-50 text-emerald-600 border border-emerald-100" 
          />
          <SummaryCard 
            title="High-Risk Patients" 
            value={summary.highRiskPatients} 
            icon={AlertTriangle} 
            colorClass="bg-rose-50 text-rose-600 border border-rose-100" 
          />
          <SummaryCard 
            title="Approved Meal Plans" 
            value={summary.approvedMealPlans} 
            icon={Utensils} 
            colorClass="bg-teal-50 text-teal-600 border border-teal-100" 
          />
        </div>

        {/* First Row of Actionable Widgets: Today's Appts & Awaiting Assessment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Today's Appointments Section */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[380px]">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Today's Consultations</h3>
              </div>
              <span className="text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-100 px-2.5 py-0.5 rounded-full">
                {todayAppointments?.length || 0} Today
              </span>
            </div>
            
            {todayAppointments && todayAppointments.length > 0 ? (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Patient Name</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Reason</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {todayAppointments.map((appt, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                          {appt.patientName}
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-mono whitespace-nowrap">
                          {appt.time}
                        </td>
                        <td className="px-4 py-3 text-slate-600 truncate max-w-[140px]" title={appt.reason}>
                          {appt.reason || 'Consultation'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${
                            appt.status === 'completed' || appt.status === 'approved' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : appt.status === 'cancelled'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {appt.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <Link 
                            to="/doctor/appointments" 
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 hover:text-teal-800 hover:underline"
                          >
                            <span>View</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
                <CalendarCheck className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-medium text-slate-500">No appointments scheduled for today.</p>
              </div>
            )}
          </div>

          {/* Patients Awaiting Assessment Section */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[380px]">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Patients Awaiting Assessment</h3>
              </div>
              <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-0.5 rounded-full">
                {patientsAwaitingAssessment?.length || 0} Pending
              </span>
            </div>
            
            {patientsAwaitingAssessment && patientsAwaitingAssessment.length > 0 ? (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Patient Name</th>
                      <th className="px-4 py-3">Assigned Date</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patientsAwaitingAssessment.map((patient, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                          {patient.name}
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {new Date(patient.assignedDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <Link 
                            to={`/doctor/assessments/new?patient=${patient.id || patient._id || ''}`} 
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                          >
                            <Activity className="w-3.5 h-3.5" />
                            <span>Start Assessment</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-2">
                <EmptyState 
                  title="All Caught Up" 
                  description="No patients are currently waiting for an initial obesity assessment."
                  icon={UserCheck}
                />
              </div>
            )}
          </div>
        </div>

        {/* Second Row of Actionable Widgets: Recent Predictions & Follow-up Required */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Recent Predictions Section */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[380px]">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Recent Predictions</h3>
              </div>
            </div>
            
            {recentPredictions && recentPredictions.length > 0 ? (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Patient Name</th>
                      <th className="px-4 py-3">Prediction</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentPredictions.map((pred, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                          {pred.patientName}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-rose-600 block truncate max-w-[160px]">
                            {pred.obesityLevel ? pred.obesityLevel.replace(/_/g, ' ') : 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {new Date(pred.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <Link 
                            to="/doctor/assessments" 
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                          >
                            <span>View Result</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-2">
                <EmptyState 
                  title="No Recent Predictions" 
                  description="You have not completed any assessments recently."
                  icon={Stethoscope}
                />
              </div>
            )}
          </div>

          {/* Follow-up Required Section */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[380px]">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Follow-up Required</h3>
              </div>
            </div>
            
            {followUpRequired && followUpRequired.length > 0 ? (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Patient Name</th>
                      <th className="px-4 py-3">Latest BMI</th>
                      <th className="px-4 py-3">Last Update</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {followUpRequired.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                          {item.patientName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {item.latestBmi} kg/m²
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {new Date(item.lastUpdate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <Link 
                            to="/doctor/patients" 
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                            <span>View Progress</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-2">
                <EmptyState 
                  title="No Follow-ups Required" 
                  description="All patient progress tracking is up to date."
                  icon={TrendingUp}
                />
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
