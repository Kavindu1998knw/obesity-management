import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import SummaryCard from '../../components/dashboard/SummaryCard';
import ChartPanel from '../../components/dashboard/ChartPanel';
import EmptyState from '../../components/dashboard/EmptyState';
import LoadingDashboard from '../../components/dashboard/LoadingDashboard';
import DashboardError from '../../components/dashboard/DashboardError';
import apiClient from '../../services/apiClient';

import {
  Stethoscope,
  Users,
  UserCheck,
  Clock,
  CalendarCheck,
  CheckCircle2,
  PieChart as PieChartIcon,
  TrendingUp,
  Activity,
  CalendarDays,
  FileSpreadsheet,
  ArrowUpRight
} from 'lucide-react';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  LineChart,
  Line
} from 'recharts';

// Modern healthcare category color palette
const CATEGORY_COLORS = {
  'Insufficient Weight': '#38BDF8', // Sky Blue
  'Normal Weight': '#10B981',       // Emerald Green
  'Overweight Level I': '#F59E0B',  // Amber
  'Overweight Level II': '#F97316', // Orange
  'Obesity Type I': '#F43F5E',      // Rose Red
  'Obesity Type II': '#E11D48',     // Deep Red
  'Obesity Type III': '#881337'     // Maroon / Deep Wine
};

// Custom Chart Tooltip
const CustomChartTooltip = ({ active, payload, label, unit = '' }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-800 text-xs">
        <p className="font-semibold text-slate-200">{label || item.name}</p>
        <p className="text-teal-400 font-bold mt-1 text-sm">
          {item.value} {unit}
        </p>
      </div>
    );
  }
  return null;
};

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
    return (
      <DashboardLayout role="admin">
        <LoadingDashboard />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="admin">
        <DashboardError message={error} onRetry={fetchDashboardData} />
      </DashboardLayout>
    );
  }

  if (!data) return null;

  const {
    summary = {},
    obesityDistribution = [],
    monthlyAppointmentTrend = [],
    patientRegistrationTrend = [],
    recentRegistrations = [],
    recentAppointments = []
  } = data;

  const totalAssessments = obesityDistribution.reduce((acc, curr) => acc + (curr.value || 0), 0);

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8 pb-10">
        
        {/* Top Header / Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Summary</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Real-time administrative overview of clinical staff, patients, obesity assessments, and appointments.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs">
              <CalendarDays className="w-3.5 h-3.5 text-teal-600" />
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Metric Summary Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-5">
          <SummaryCard
            title="Total Doctors"
            value={summary.totalDoctors ?? 0}
            icon={Stethoscope}
            trend="+1.8%"
            subtext="Certified specialists"
            colorClass="bg-indigo-50 text-indigo-600"
          />
          <SummaryCard
            title="Total Patients"
            value={summary.totalPatients ?? 0}
            icon={Users}
            trend="Total base"
            subtext="Registered individuals"
            colorClass="bg-teal-50 text-teal-600"
          />
          <SummaryCard
            title="Active Patients"
            value={summary.activePatients ?? 0}
            icon={UserCheck}
            trend="Engaged"
            subtext="Active in program"
            colorClass="bg-emerald-50 text-emerald-600"
          />
          <SummaryCard
            title="Pending Appts"
            value={summary.pendingAppointments ?? 0}
            icon={Clock}
            trend="Action"
            subtext="Awaiting approval"
            colorClass="bg-amber-50 text-amber-600"
          />
          <SummaryCard
            title="Approved Appts"
            value={summary.approvedAppointments ?? 0}
            icon={CalendarCheck}
            trend="Scheduled"
            subtext="Upcoming sessions"
            colorClass="bg-sky-50 text-sky-600"
          />
          <SummaryCard
            title="Completed Appts"
            value={summary.completedAppointments ?? 0}
            icon={CheckCircle2}
            trend="Resolved"
            subtext="Finished visits"
            colorClass="bg-purple-50 text-purple-600"
          />
        </div>

        {/* Top Charts & Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart 1: Obesity Category Distribution */}
          <ChartPanel
            title="Obesity Category Distribution"
            subtitle="Patient classification across 7 clinical model categories"
            className="lg:col-span-1"
          >
            {obesityDistribution && obesityDistribution.length > 0 && totalAssessments > 0 ? (
              <div className="flex flex-col h-full justify-between gap-4">
                <div className="h-56 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={obesityDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {obesityDistribution.map((entry, index) => {
                          const sliceColor = CATEGORY_COLORS[entry.name] || entry.color || '#0d9488';
                          return <Cell key={`cell-${index}`} fill={sliceColor} stroke="#ffffff" strokeWidth={2} />;
                        })}
                      </Pie>
                      <RechartsTooltip content={<CustomChartTooltip unit="Patients" />} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center Stat inside Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-slate-800 tracking-tight">{totalAssessments}</span>
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Total</span>
                  </div>
                </div>

                {/* Styled Category Legend List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 pt-2 border-t border-slate-100 max-h-36 overflow-y-auto">
                  {obesityDistribution.map((cat) => {
                    const catColor = CATEGORY_COLORS[cat.name] || cat.color || '#0d9488';
                    const percentage = totalAssessments > 0 ? ((cat.value / totalAssessments) * 100).toFixed(0) : 0;
                    return (
                      <div key={cat.name} className="flex items-center justify-between text-xs py-0.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: catColor }}
                          />
                          <span className="text-slate-600 truncate font-medium">{cat.name}</span>
                        </div>
                        <span className="font-semibold text-slate-800 shrink-0 ml-2">
                          {cat.value} <span className="text-[10px] text-slate-400 font-normal">({percentage}%)</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <EmptyState
                title="No Assessment Data"
                description="Clinical assessment data is not yet available to populate the obesity distribution."
                icon={PieChartIcon}
              />
            )}
          </ChartPanel>

          {/* Chart 2: Monthly Appointment Count */}
          <ChartPanel
            title="Monthly Appointment Count"
            subtitle="Appointment volume recorded over past months"
            className="lg:col-span-1"
          >
            {monthlyAppointmentTrend && monthlyAppointmentTrend.length > 0 ? (
              <div className="h-full flex flex-col justify-between">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyAppointmentTrend}
                      margin={{ top: 15, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                        allowDecimals={false}
                      />
                      <RechartsTooltip content={<CustomChartTooltip unit="Appointments" />} />
                      <Bar
                        dataKey="appointments"
                        fill="#0D9488"
                        radius={[6, 6, 0, 0]}
                        barSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2.5 h-2.5 rounded-sm bg-teal-600"></span>
                    Scheduled Visits
                  </span>
                  <span className="font-semibold text-slate-700">
                    Total: {monthlyAppointmentTrend.reduce((a, b) => a + (b.appointments || 0), 0)}
                  </span>
                </div>
              </div>
            ) : (
              <EmptyState
                title="No Appointments Recorded"
                description="The appointment module does not have any recorded data for the monthly trend."
                icon={Activity}
              />
            )}
          </ChartPanel>

          {/* Table 1: Recent Patient Registrations */}
          <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900 tracking-tight">Recent Registrations</h3>
                <p className="text-xs text-slate-500 mt-0.5">Latest patients enrolled in system</p>
              </div>
              <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                Latest 5
              </span>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <table className="w-full table-fixed text-xs text-left">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-3.5 py-3 w-[52%]">Patient</th>
                    <th className="px-3 py-3 w-[26%]">Date</th>
                    <th className="px-3 py-3 w-[22%] text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentRegistrations && recentRegistrations.length > 0 ? (
                    recentRegistrations.map((user) => {
                      const initials = user.fullName
                        ? user.fullName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()
                        : 'PT';
                      const formattedDate = user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })
                        : 'Recent';

                      return (
                        <tr key={user._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-3.5 py-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-teal-100/70 text-teal-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                                {initials}
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="font-semibold text-slate-800 block truncate" title={user.fullName}>
                                  {user.fullName}
                                </span>
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px] font-semibold mt-0.5">
                                  #{user._id ? user._id.slice(-4).toUpperCase() : '1001'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-slate-500 font-medium whitespace-nowrap">
                            {formattedDate}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                user.status === 'active' || !user.status
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {user.status || 'Active'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-4 py-8 text-center text-slate-400 text-xs">
                        No recent registrations recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Bottom Trend & Appointment Requests Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 3: Patient Registration Trend */}
          <ChartPanel
            title="Patient Registration Trend"
            subtitle="Monthly growth in patient intake"
          >
            {patientRegistrationTrend && patientRegistrationTrend.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={patientRegistrationTrend}
                    margin={{ top: 15, right: 15, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0D9488" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                      allowDecimals={false}
                    />
                    <RechartsTooltip content={<CustomChartTooltip unit="Patients" />} />
                    <Area
                      type="monotone"
                      dataKey="registrations"
                      stroke="#0D9488"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#regGrad)"
                      dot={{ r: 4, fill: '#0D9488', stroke: '#FFFFFF', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#0F766E' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState
                title="No Registration Trends"
                description="Insufficient data to map monthly registration trends."
                icon={TrendingUp}
              />
            )}
          </ChartPanel>

          {/* Table 2: Recent Appointment Requests */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900 tracking-tight">Recent Appointment Requests</h3>
                <p className="text-xs text-slate-500 mt-0.5">Latest consultations booked across clinics</p>
              </div>
              <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                Latest 5
              </span>
            </div>

            <div className="flex-1 overflow-hidden">
              <table className="w-full table-fixed text-xs text-left">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-3.5 py-3 w-[33%]">Patient</th>
                    <th className="px-3 py-3 w-[27%]">Doctor</th>
                    <th className="px-3 py-3 w-[22%]">Schedule</th>
                    <th className="px-3.5 py-3 w-[18%] text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentAppointments && recentAppointments.length > 0 ? (
                    recentAppointments.map((appt) => {
                      const patientName = appt.patientId?.fullName || 'Patient';
                      const doctorName = appt.doctorId?.fullName || 'Assigned Clinician';
                      const formattedDate = appt.date
                        ? new Date(appt.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })
                        : 'Pending';

                      let statusBadge = 'bg-slate-100 text-slate-700 border-slate-200';
                      if (appt.status === 'approved') {
                        statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      } else if (appt.status === 'pending') {
                        statusBadge = 'bg-amber-50 text-amber-700 border-amber-200';
                      } else if (appt.status === 'completed') {
                        statusBadge = 'bg-sky-50 text-sky-700 border-sky-200';
                      } else if (appt.status === 'cancelled') {
                        statusBadge = 'bg-rose-50 text-rose-700 border-rose-200';
                      }

                      return (
                        <tr key={appt._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-3.5 py-3">
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-800 block truncate" title={patientName}>
                                {patientName}
                              </span>
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px] font-semibold mt-0.5">
                                #{appt._id ? appt._id.slice(-4).toUpperCase() : '401'}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="min-w-0">
                              <span className="text-slate-600 font-medium block truncate" title={`Dr. ${doctorName.replace(/^Dr\.\s*/i, '')}`}>
                                Dr. {doctorName.replace(/^Dr\.\s*/i, '')}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-slate-500 whitespace-nowrap">
                            <span className="font-semibold text-slate-700 block text-[11px]">{formattedDate}</span>
                            <span className="text-[10px] text-slate-400 block">{appt.time || '10:00 AM'}</span>
                          </td>
                          <td className="px-3.5 py-3 text-right whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize border ${statusBadge}`}>
                              {appt.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-slate-400 text-xs">
                        No recent appointments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
