import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import SummaryCard from '../../components/dashboard/SummaryCard';
import EmptyState from '../../components/dashboard/EmptyState';
import LoadingDashboard from '../../components/dashboard/LoadingDashboard';
import DashboardError from '../../components/dashboard/DashboardError';
import apiClient from '../../services/apiClient';

import { FaUsers, FaCalendarDay, FaUserClock, FaStethoscope, FaTriangleExclamation, FaUtensils, FaChartLine } from 'react-icons/fa6';

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
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#172033]">Welcome, Dr. {doctorName}</h1>
        <p className="text-sm text-[#64748B] mt-1">Review your schedule and monitor patient assessments.</p>
      </div>

      {/* Summary Area */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <SummaryCard 
          title="Assigned Patients" 
          value={summary.assignedPatients} 
          icon={FaUsers} 
          colorClass="bg-[#E0E7FF] text-[#4F46E5]" 
        />
        <SummaryCard 
          title="Today's Appts" 
          value={summary.todayAppointmentsCount} 
          icon={FaCalendarDay} 
          colorClass="bg-[#CCFBF1] text-[#0F766E]" 
        />
        <SummaryCard 
          title="Pending Assessments" 
          value={summary.pendingAssessments} 
          icon={FaUserClock} 
          colorClass="bg-[#FEF3C7] text-[#B45309]" 
        />
        <SummaryCard 
          title="Completed Assessments" 
          value={summary.completedAssessments} 
          icon={FaStethoscope} 
          colorClass="bg-[#E0F2FE] text-[#0284C7]" 
        />
        <SummaryCard 
          title="High-Risk Patients" 
          value={summary.highRiskPatients} 
          icon={FaTriangleExclamation} 
          colorClass="bg-[#FEE2E2] text-[#B91C1C]" 
        />
        <SummaryCard 
          title="Approved Meal Plans" 
          value={summary.approvedMealPlans} 
          icon={FaUtensils} 
          colorClass="bg-[#DCFCE7] text-[#047857]" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Today's Appointments Section */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[350px]">
          <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center shrink-0">
            <h3 className="text-sm font-semibold text-slate-900">Today's Appointments</h3>
            <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded">
              {todayAppointments?.length || 0} Appointments
            </span>
          </div>
          
          {todayAppointments && todayAppointments.length > 0 ? (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="px-4 py-3 font-medium">Patient Name</th>
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">Reason</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {todayAppointments.map((appt, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{appt.patientName}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{appt.time}</td>
                      <td className="px-4 py-3 text-slate-600 truncate max-w-[150px]">{appt.reason}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          {appt.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <Link to={`/doctor/appointments`} className="text-blue-600 hover:text-blue-800 text-xs font-medium">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-sm text-slate-500">
              No appointments scheduled for today.
            </div>
          )}
        </div>

        {/* Patients Awaiting Assessment Section */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[350px]">
          <div className="px-6 py-5 border-b border-slate-200 shrink-0">
            <h3 className="text-sm font-semibold text-slate-900">Patients Awaiting Assessment</h3>
          </div>
          
          {patientsAwaitingAssessment && patientsAwaitingAssessment.length > 0 ? (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="px-4 py-3 font-medium">Patient Name</th>
                    <th className="px-4 py-3 font-medium">Assigned Date</th>
                    <th className="px-4 py-3 font-medium text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {patientsAwaitingAssessment.map((patient, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{patient.name}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{new Date(patient.assignedDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <Link to={`/doctor/assessments`} className="bg-indigo-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-indigo-700 transition-colors">Start Assessment</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <EmptyState 
                title="All Caught Up" 
                description="No patients are currently waiting for an initial obesity assessment."
                icon={FaUsers}
                />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Predictions Section */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[350px]">
          <div className="px-6 py-5 border-b border-slate-200 shrink-0">
            <h3 className="text-sm font-semibold text-slate-900">Recent Predictions</h3>
          </div>
          
          {recentPredictions && recentPredictions.length > 0 ? (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="px-4 py-3 font-medium">Patient Name</th>
                    <th className="px-4 py-3 font-medium">Prediction</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {recentPredictions.map((pred, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{pred.patientName}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{pred.obesityLevel}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{new Date(pred.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <Link to={`/doctor/assessments`} className="text-blue-600 hover:text-blue-800 text-xs font-medium">View Result</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <EmptyState 
                title="No Recent Predictions" 
                description="You have not completed any assessments recently."
                icon={FaStethoscope}
                />
            </div>
          )}
        </div>

        {/* Follow-up Required Section */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[350px]">
          <div className="px-6 py-5 border-b border-slate-200 shrink-0">
            <h3 className="text-sm font-semibold text-slate-900">Follow-up Required</h3>
          </div>
          
          {followUpRequired && followUpRequired.length > 0 ? (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="px-4 py-3 font-medium">Patient Name</th>
                    <th className="px-4 py-3 font-medium">Latest BMI</th>
                    <th className="px-4 py-3 font-medium">Last Update</th>
                    <th className="px-4 py-3 font-medium text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {followUpRequired.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{item.patientName}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{item.latestBmi}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{new Date(item.lastUpdate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <Link to={`/doctor/patients`} className="bg-indigo-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-indigo-700 transition-colors">View Progress</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <EmptyState 
                title="No Follow-ups Required" 
                description="All patient progress tracking is up to date."
                icon={FaChartLine}
                />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
