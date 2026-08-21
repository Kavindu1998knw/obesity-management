import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import SummaryCard from '../../components/dashboard/SummaryCard';
import ChartPanel from '../../components/dashboard/ChartPanel';
import EmptyState from '../../components/dashboard/EmptyState';
import LoadingDashboard from '../../components/dashboard/LoadingDashboard';
import DashboardError from '../../components/dashboard/DashboardError';
import apiClient from '../../services/apiClient';

import { FaUserDoctor, FaUsers, FaUserCheck, FaCalendarCheck, FaChartPie, FaChartLine, FaRegClock, FaCalendarDay } from 'react-icons/fa6';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/dashboard/admin');
      setData(response.data.data);
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
    return <DashboardLayout role="admin"><LoadingDashboard /></DashboardLayout>;
  }

  if (error) {
    return <DashboardLayout role="admin"><DashboardError message={error} onRetry={fetchDashboardData} /></DashboardLayout>;
  }

  if (!data) return null;

  const { summary, obesityDistribution, monthlyAppointmentTrend, patientRegistrationTrend, recentRegistrations, recentAppointments } = data;

  return (
    <DashboardLayout role="admin">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#172033]">Admin Overview</h1>
        <p className="text-sm text-[#64748B] mt-1">Monitor clinical engagement and system utilization.</p>
      </div>

      {/* Summary Area */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <SummaryCard 
          title="Total Doctors" 
          value={summary.totalDoctors} 
          icon={FaUserDoctor} 
          colorClass="bg-[#E0E7FF] text-[#4F46E5]" 
        />
        <SummaryCard 
          title="Total Patients" 
          value={summary.totalPatients} 
          icon={FaUsers} 
          colorClass="bg-[#CCFBF1] text-[#0F766E]" 
        />
        <SummaryCard 
          title="Active Patients" 
          value={summary.activePatients} 
          icon={FaUserCheck} 
          colorClass="bg-[#DCFCE7] text-[#15803D]" 
        />
        <SummaryCard 
          title="Pending Appts" 
          value={summary.pendingAppointments} 
          icon={FaRegClock} 
          colorClass="bg-[#FEF3C7] text-[#B45309]" 
        />
        <SummaryCard 
          title="Approved Appts" 
          value={summary.approvedAppointments} 
          icon={FaCalendarDay} 
          colorClass="bg-[#DBEAFE] text-[#1D4ED8]" 
        />
        <SummaryCard 
          title="Completed Appts" 
          value={summary.completedAppointments} 
          icon={FaCalendarCheck} 
          colorClass="bg-[#F3E8FF] text-[#7E22CE]" 
        />
      </div>

      {/* Analytics Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ChartPanel title="Obesity Category Distribution">
          {obesityDistribution && obesityDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={obesityDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {obesityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState 
              title="No Distribution Data" 
              description="Clinical assessment data is not yet available to populate the obesity distribution."
              icon={FaChartPie}
            />
          )}
        </ChartPanel>

        <ChartPanel title="Monthly Appointment Trend">
          {monthlyAppointmentTrend && monthlyAppointmentTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyAppointmentTrend} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <Tooltip cursor={{fill: '#F1F5F9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="appointments" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState 
              title="No Appointments Yet" 
              description="The appointment module does not have any recorded data for the trend chart."
              icon={FaChartLine}
            />
          )}
        </ChartPanel>

        <ChartPanel title="Patient Registration Trend">
          {patientRegistrationTrend && patientRegistrationTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={patientRegistrationTrend} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <Tooltip cursor={{stroke: '#CBD5E1', strokeWidth: 1}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Line type="monotone" dataKey="registrations" stroke="#0F766E" strokeWidth={3} dot={{r: 4, fill: '#0F766E', strokeWidth: 0}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState 
              title="No Registrations Yet" 
              description="Not enough data to map registration trends."
              icon={FaChartLine}
            />
          )}
        </ChartPanel>
      </div>

      {/* Tables Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">Recent Registrations</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Registration Date</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentRegistrations && recentRegistrations.length > 0 ? (
                  recentRegistrations.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{user.fullName}</td>
                      <td className="px-6 py-4 capitalize">{user.role}</td>
                      <td className="px-6 py-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {user.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                      No recent registrations found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">Recent Appointments</h3>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Patient</th>
                  <th className="px-6 py-4 font-medium">Doctor</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentAppointments && recentAppointments.length > 0 ? (
                  recentAppointments.map((appt) => (
                    <tr key={appt._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{appt.patientId?.fullName || 'Unknown'}</td>
                      <td className="px-6 py-4">{appt.doctorId?.fullName || 'Unknown'}</td>
                      <td className="px-6 py-4">
                        <span className="block">{new Date(appt.date).toLocaleDateString()}</span>
                        <span className="block text-xs text-slate-500">{appt.time}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                          appt.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          appt.status === 'pending' ? 'bg-amber-100 text-amber-800' : 
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {appt.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                      No recent appointments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </DashboardLayout>
  );
}
