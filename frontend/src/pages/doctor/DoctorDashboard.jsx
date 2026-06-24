import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUserDoctor, FaUser, FaFileMedical, FaBrain, FaUtensils,
  FaChartLine, FaNotesMedical, FaChartBar, FaGear, FaBell,
  FaMagnifyingGlass, FaArrowRightFromBracket, FaBars, FaXmark,
  FaPlus, FaEye, FaWandMagicSparkles, FaCalendarDays,
  FaCircleCheck, FaCircleDot, FaArrowTrendUp, FaArrowTrendDown,
  FaHeartPulse, FaWeightScale, FaFire, FaTriangleExclamation,
  FaChevronRight, FaEllipsis
} from 'react-icons/fa6';

// ─── Static Data ────────────────────────────────────────────────────────────
const PATIENTS = [
  { id: 1, name: 'Marcus Johnson', age: 42, bmi: 34.8, status: 'Obesity Type I', statusColor: 'rose', appointment: 'Today 14:30', initials: 'MJ' },
  { id: 2, name: 'Elena Rodriguez', age: 35, bmi: 27.3, status: 'Overweight', statusColor: 'amber', appointment: 'Today 15:15', initials: 'ER' },
  { id: 3, name: 'David Chen', age: 28, bmi: 22.1, status: 'Normal Weight', statusColor: 'emerald', appointment: 'Tomorrow', initials: 'DC' },
  { id: 4, name: 'Sarah Mitchell', age: 51, bmi: 38.5, status: 'Obesity Type II', statusColor: 'rose', appointment: 'Jun 26', initials: 'SM' },
  { id: 5, name: 'James Okafor', age: 39, bmi: 29.7, status: 'Overweight', statusColor: 'amber', appointment: 'Jun 27', initials: 'JO' },
];

const APPOINTMENTS = [
  { time: '09:00', name: 'Marcus Johnson', type: 'AI Prediction Review', status: 'done', color: 'emerald' },
  { time: '10:30', name: 'Elena Rodriguez', type: 'Meal Plan Assessment', status: 'done', color: 'emerald' },
  { time: '12:00', name: 'David Chen', type: 'Weight Progress Check', status: 'current', color: 'sky' },
  { time: '14:30', name: 'Sarah Mitchell', type: 'Initial Consultation', status: 'upcoming', color: 'slate' },
  { time: '15:15', name: 'James Okafor', type: 'Diet Follow-up', status: 'upcoming', color: 'slate' },
  { time: '16:00', name: 'Priya Nair', type: 'BMI Risk Review', status: 'upcoming', color: 'slate' },
];

const NOTES = [
  { patient: 'Marcus Johnson', date: 'Jun 24, 2026', note: 'Patient showed significant improvement. BMI dropped from 36.2 to 34.8. Continuing with Keto protocol.', initials: 'MJ', color: 'sky' },
  { patient: 'Sarah Mitchell', date: 'Jun 23, 2026', note: 'High HbA1c concern. Referred for endocrinology consultation. AI flags Obesity Type II risk.', initials: 'SM', color: 'rose' },
  { patient: 'Elena Rodriguez', date: 'Jun 22, 2026', note: 'Mediterranean meal plan adherence at 82%. Recommended increasing protein intake.', initials: 'ER', color: 'teal' },
];

const MEAL_PLANS = [
  { patient: 'Marcus Johnson', calories: 1800, type: 'Ketogenic', adherence: 78, color: 'sky' },
  { patient: 'Elena Rodriguez', calories: 2100, type: 'Mediterranean', adherence: 82, color: 'teal' },
  { patient: 'David Chen', calories: 2400, type: 'Balanced Diet', adherence: 91, color: 'emerald' },
  { patient: 'Sarah Mitchell', calories: 1600, type: 'Low-Glycemic', adherence: 65, color: 'amber' },
];

const WEIGHT_DATA = [
  { month: 'Jan', weight: 98.4 },
  { month: 'Feb', weight: 96.1 },
  { month: 'Mar', weight: 94.7 },
  { month: 'Apr', weight: 92.3 },
  { month: 'May', weight: 89.8 },
  { month: 'Jun', weight: 87.2 },
];

const FEATURE_IMPORTANCE = [
  { label: 'Weight (kg)', value: 94, color: 'bg-sky-500' },
  { label: 'Family History', value: 78, color: 'bg-teal-500' },
  { label: 'Physical Activity', value: 65, color: 'bg-indigo-500' },
  { label: 'Food Habits', value: 58, color: 'bg-violet-500' },
  { label: 'Age & Gender', value: 42, color: 'bg-pink-500' },
];

const MENU = [
  { icon: FaChartBar, label: 'Dashboard', id: 'dashboard' },
  { icon: FaUser, label: 'Patients', id: 'patients' },
  { icon: FaFileMedical, label: 'Health Records', id: 'records' },
  { icon: FaBrain, label: 'AI Predictions', id: 'predictions' },
  { icon: FaUtensils, label: 'Meal Plans', id: 'meals' },
  { icon: FaChartLine, label: 'Progress Tracking', id: 'progress' },
  { icon: FaNotesMedical, label: 'Clinical Notes', id: 'notes' },
  { icon: FaChartBar, label: 'Reports', id: 'reports' },
  { icon: FaGear, label: 'Settings', id: 'settings' },
];

// ─── Mini SVG Line Chart ─────────────────────────────────────────────────────
function MiniLineChart({ data }) {
  const max = Math.max(...data.map(d => d.weight));
  const min = Math.min(...data.map(d => d.weight));
  const w = 280, h = 80, pad = 10;
  const scaleX = i => pad + (i / (data.length - 1)) * (w - 2 * pad);
  const scaleY = v => h - pad - ((v - min) / (max - min || 1)) * (h - 2 * pad);
  const points = data.map((d, i) => `${scaleX(i)},${scaleY(d.weight)}`).join(' ');
  const areaPoints = `${scaleX(0)},${h} ` + points + ` ${scaleX(data.length - 1)},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-20" preserveAspectRatio="none">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#lineGrad)" />
      <polyline points={points} fill="none" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <circle key={i} cx={scaleX(i)} cy={scaleY(d.weight)} r="3" fill="#0EA5E9" stroke="white" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

// ─── Donut Ring ───────────────────────────────────────────────────────────────
function RingChart({ value, color, size = 80 }) {
  const r = 30, cx = 40, cy = 40;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ / 4}
        strokeLinecap="round" />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill={color}>
        {value}%
      </text>
    </svg>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, color }) {
  const styles = {
    rose: 'bg-rose-50 text-rose-600 border-rose-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    sky: 'bg-sky-50 text-sky-600 border-sky-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${styles[color]}`}>
      {status}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, title, value, sub, gradient, trend, trendVal }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 p-6 relative overflow-hidden group">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}>
            <Icon className="text-white text-lg" />
          </div>
          {trend && (
            <div className={`flex items-center space-x-1 text-xs font-semibold px-2 py-1 rounded-xl ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
              {trend === 'up' ? <FaArrowTrendUp className="text-[10px]" /> : <FaArrowTrendDown className="text-[10px]" />}
              <span>{trendVal}</span>
            </div>
          )}
        </div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
        <p className="text-xs text-slate-400 mt-1 font-medium">{sub}</p>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [user, setUser] = useState({ fullName: 'Dr. Sarah', email: 'sarah@hospital.com' });
  const [noteText, setNoteText] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const initials = user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">

      {/* ── Mobile Overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ════════════════════════════════════════
          SIDEBAR
      ════════════════════════════════════════ */}
      <aside className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 flex flex-col bg-white border-r border-slate-200 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center shadow-lg shadow-sky-500/30">
                <FaBrain className="text-white text-base" />
              </div>
              <div>
                <h1 className="text-[13px] font-black text-slate-900 leading-tight">AI Obesity</h1>
                <p className="text-[10px] text-slate-400 font-medium">Management System</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 lg:hidden">
              <FaXmark />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 mb-3">Main Menu</p>
          {MENU.map(item => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveMenu(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500 to-teal-500 text-white shadow-lg shadow-sky-500/25'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon className={`text-sm flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span>{item.label}</span>
                {isActive && <FaChevronRight className="ml-auto text-[10px] text-white/60" />}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 pb-5 border-t border-slate-100 pt-4 space-y-3">
          <div className="flex items-center space-x-3 px-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-teal-400 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{user.fullName}</p>
              <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-semibold text-rose-500 border border-rose-100 bg-rose-50 hover:bg-rose-100 transition-colors"
          >
            <FaArrowRightFromBracket />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ════════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── TOP HEADER ── */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 lg:hidden">
              <FaBars />
            </button>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Good Morning, {user.fullName} 👋</h2>
              <p className="text-[11px] text-slate-400">Manage patients and obesity predictions efficiently</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-2 w-56 rounded-xl bg-slate-50 border border-slate-200">
              <FaMagnifyingGlass className="text-slate-400 text-xs flex-shrink-0" />
              <input
                type="text"
                placeholder="Search patients..."
                className="bg-transparent text-xs placeholder-slate-400 focus:outline-none w-full"
              />
            </div>

            {/* Notification */}
            <button className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 relative">
              <FaBell className="text-sm" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full" />
            </button>

            {/* Avatar + Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-md hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
              >
                {initials}
              </button>

              {showProfileMenu && (
                <>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />

                  {/* Dropdown */}
                  <div className="absolute right-0 top-11 z-50 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 overflow-hidden">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{user.fullName}</p>
                          <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-600 text-[9px] font-bold border border-teal-100">Medical Doctor</span>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-2">
                      <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors font-medium">
                        <FaUser className="text-slate-400 text-xs" />
                        <span>My Profile</span>
                      </button>
                      <button className="w-full flex items-center space-x-3 px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors font-medium">
                        <FaGear className="text-slate-400 text-xs" />
                        <span>Account Settings</span>
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-slate-100 p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 transition-colors"
                      >
                        <FaArrowRightFromBracket className="text-sm" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── PAGE BODY ── */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6">

          {/* ────────────────────────────────────────
              STATS CARDS
          ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <StatCard
              icon={FaUser}
              title="Assigned Patients"
              value="128"
              sub="8 newly enrolled this week"
              gradient="from-sky-400 to-sky-600"
              trend="up"
              trendVal="+8"
            />
            <StatCard
              icon={FaCalendarDays}
              title="Today's Appointments"
              value="12"
              sub="Next: Sarah Mitchell at 14:30"
              gradient="from-teal-400 to-teal-600"
              trend="up"
              trendVal="+3"
            />
            <StatCard
              icon={FaBrain}
              title="Predictions Generated"
              value="84"
              sub="24 pending AI analysis"
              gradient="from-indigo-400 to-violet-600"
              trend="up"
              trendVal="+12"
            />
            <StatCard
              icon={FaUtensils}
              title="Meal Plans Created"
              value="57"
              sub="10 updated yesterday"
              gradient="from-orange-400 to-rose-500"
              trend="up"
              trendVal="+5"
            />
          </div>

          {/* ────────────────────────────────────────
              ROW 2: Patient Table + AI Prediction Panel
          ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">

            {/* Patient Table */}
            <div className="xl:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Recent Patients</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Patient management overview</p>
                </div>
                <button className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 text-white text-xs font-semibold shadow-md shadow-sky-500/20 hover:shadow-sky-500/40 transition-shadow">
                  <FaPlus className="text-[10px]" />
                  <span>Add Patient</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-3 font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                      <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Age</th>
                      <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">BMI</th>
                      <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Appt.</th>
                      <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {PATIENTS.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-teal-400 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 shadow-sm">
                              {p.initials}
                            </div>
                            <span className="font-semibold text-slate-800">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 font-medium">{p.age}</td>
                        <td className="px-4 py-3.5">
                          <span className={`font-bold font-mono ${p.bmi > 30 ? 'text-rose-600' : p.bmi > 25 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {p.bmi}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={p.status} color={p.statusColor} />
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 font-medium">{p.appointment}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center space-x-1.5">
                            <button className="px-2 py-1 rounded-lg text-sky-600 bg-sky-50 hover:bg-sky-100 font-semibold transition-colors flex items-center space-x-1">
                              <FaEye className="text-[10px]" />
                              <span>View</span>
                            </button>
                            <button className="px-2 py-1 rounded-lg text-violet-600 bg-violet-50 hover:bg-violet-100 font-semibold transition-colors flex items-center space-x-1">
                              <FaBrain className="text-[10px]" />
                              <span>Predict</span>
                            </button>
                            <button className="px-2 py-1 rounded-lg text-teal-600 bg-teal-50 hover:bg-teal-100 font-semibold transition-colors flex items-center space-x-1">
                              <FaUtensils className="text-[10px]" />
                              <span>Meal</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Prediction Panel */}
            <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
                    <FaBrain className="text-white text-sm" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">AI Prediction Center</h3>
                    <p className="text-[11px] text-slate-400">Marcus Johnson · Latest scan</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Prediction Result */}
                <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 rounded-2xl p-4 border border-rose-200/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider">Prediction Result</span>
                    <FaTriangleExclamation className="text-rose-400 text-sm" />
                  </div>
                  <h4 className="text-lg font-black text-rose-700">Obesity Type I</h4>
                  <p className="text-xs text-rose-400 mt-0.5">BMI: 34.8 · Category: High Risk</p>
                </div>

                {/* Confidence Score */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Confidence Score</p>
                    <p className="text-2xl font-black text-slate-900">96.4%</p>
                    <p className="text-[10px] text-emerald-500 font-semibold mt-0.5 flex items-center space-x-1">
                      <FaCircleCheck />
                      <span>High Confidence · XGBoost Model</span>
                    </p>
                  </div>
                  <RingChart value={96} color="#0EA5E9" size={80} />
                </div>

                {/* BMI Analysis */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'BMI', val: '34.8', color: 'text-rose-600 bg-rose-50 border-rose-100' },
                    { label: 'Ideal', val: '22.5', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                    { label: 'Diff', val: '+12.3', color: 'text-amber-600 bg-amber-50 border-amber-100' },
                  ].map(b => (
                    <div key={b.label} className={`rounded-xl p-3 text-center border ${b.color}`}>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase">{b.label}</p>
                      <p className={`text-sm font-black mt-0.5 ${b.color.split(' ')[0]}`}>{b.val}</p>
                    </div>
                  ))}
                </div>

                {/* Feature Importance */}
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">Feature Importance</p>
                  <div className="space-y-2.5">
                    {FEATURE_IMPORTANCE.map(f => (
                      <div key={f.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-600 font-medium">{f.label}</span>
                          <span className="text-slate-800 font-bold">{f.value}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${f.color} rounded-full transition-all duration-700`}
                            style={{ width: `${f.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-bold shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-shadow">
                  <FaWandMagicSparkles />
                  <span>Run New Prediction</span>
                </button>
              </div>
            </div>
          </div>

          {/* ────────────────────────────────────────
              ROW 3: Weight Trend + Appointments + Notes
          ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

            {/* Weight Trend Chart */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-slate-900">Weight Progress</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                  −11.2 kg
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-4">Marcus Johnson · Jan – Jun 2026</p>
              <MiniLineChart data={WEIGHT_DATA} />
              <div className="flex justify-between mt-3">
                {WEIGHT_DATA.map(d => (
                  <div key={d.month} className="text-center">
                    <p className="text-[9px] text-slate-400">{d.month}</p>
                    <p className="text-[10px] font-bold text-slate-700">{d.weight}</p>
                  </div>
                ))}
              </div>

              {/* Progress Indicators */}
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
                {[
                  { label: 'BMI Score', val: 72, color: '#0EA5E9' },
                  { label: 'Adherence', val: 78, color: '#14B8A6' },
                  { label: 'Activity', val: 60, color: '#8B5CF6' },
                ].map(item => (
                  <div key={item.label} className="flex flex-col items-center">
                    <RingChart value={item.val} color={item.color} size={58} />
                    <p className="text-[10px] text-slate-500 font-medium mt-1 text-center">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Appointments */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Today's Schedule</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">June 24, 2026 · 6 sessions</p>
              </div>
              <div className="p-4 space-y-2.5 overflow-y-auto max-h-72">
                {APPOINTMENTS.map((apt, i) => (
                  <div
                    key={i}
                    className={`flex items-center space-x-3 p-3 rounded-2xl border transition-all ${
                      apt.status === 'done' ? 'bg-slate-50 border-slate-100 opacity-60' :
                      apt.status === 'current' ? 'bg-sky-50 border-sky-200 shadow-sm shadow-sky-100' :
                      'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className={`text-center px-2.5 py-1.5 rounded-xl text-[10px] font-black flex-shrink-0 ${
                      apt.status === 'current' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {apt.time}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{apt.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{apt.type}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {apt.status === 'done' ? (
                        <FaCircleCheck className="text-emerald-500 text-sm" />
                      ) : apt.status === 'current' ? (
                        <FaCircleDot className="text-sky-500 text-sm animate-pulse" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Clinical Notes */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Clinical Notes</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Recent entries</p>
                </div>
                <button className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-700 transition-colors">
                  <FaPlus className="text-[10px]" />
                  <span>Add Note</span>
                </button>
              </div>

              <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-52">
                {NOTES.map((note, i) => (
                  <div key={i} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`w-6 h-6 rounded-lg bg-${note.color}-100 text-${note.color}-600 flex items-center justify-center text-[9px] font-bold flex-shrink-0`}>
                        {note.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{note.patient}</p>
                        <p className="text-[10px] text-slate-400">{note.date}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{note.note}</p>
                  </div>
                ))}
              </div>

              {/* Quick note input */}
              <div className="p-4 border-t border-slate-100">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="Quick note..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-sky-400 focus:bg-white transition-colors placeholder-slate-400"
                  />
                  <button className="px-3 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 text-white text-xs font-bold shadow-sm">
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ────────────────────────────────────────
              ROW 4: Meal Plans
          ──────────────────────────────────────── */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Active Meal Plans</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Patient dietary management</p>
              </div>
              <button className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-semibold shadow-md shadow-teal-500/20">
                <FaWandMagicSparkles className="text-[10px]" />
                <span>Generate New Plan</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              {MEAL_PLANS.map((plan, i) => (
                <div key={i} className="p-5 hover:bg-slate-50/60 transition-colors group">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`px-2.5 py-1 rounded-xl text-[10px] font-bold bg-${plan.color}-50 text-${plan.color}-600 border border-${plan.color}-100`}>
                      {plan.type}
                    </div>
                    <button className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all">
                      <FaEllipsis className="text-xs" />
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-slate-800 mb-0.5">{plan.patient}</h4>
                  <div className="flex items-center space-x-1 mb-3">
                    <FaFire className="text-orange-400 text-[10px]" />
                    <p className="text-[11px] text-slate-500 font-medium">{plan.calories.toLocaleString()} kcal / day</p>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-slate-400 font-medium">Adherence</span>
                      <span className={`font-bold ${plan.adherence >= 80 ? 'text-emerald-600' : plan.adherence >= 65 ? 'text-amber-600' : 'text-rose-500'}`}>
                        {plan.adherence}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          plan.adherence >= 80 ? 'bg-emerald-500' : plan.adherence >= 65 ? 'bg-amber-400' : 'bg-rose-400'
                        }`}
                        style={{ width: `${plan.adherence}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex space-x-2">
                    <button className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors text-center">
                      View Plan
                    </button>
                    <button className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-sky-600 bg-sky-50 border border-sky-100 hover:bg-sky-100 transition-colors text-center">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
