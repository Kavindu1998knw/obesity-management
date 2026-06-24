import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaHouseChimney, FaBrain, FaUtensils, FaCalendarDays,
  FaChartLine, FaWeightScale, FaUser, FaGear,
  FaArrowRightFromBracket, FaBars, FaXmark, FaBell,
  FaChevronRight, FaCircleCheck, FaDroplet, FaAppleWhole,
  FaDumbbell, FaMoon, FaFire, FaArrowTrendDown, FaTriangleExclamation,
  FaCircleInfo, FaPlus, FaStethoscope, FaClock, FaCheck
} from 'react-icons/fa6';

// ─── Data ────────────────────────────────────────────────────────────────────

const WEIGHT_TREND = [
  { month: 'Jan', weight: 88.0, bmi: 30.2 },
  { month: 'Feb', weight: 86.5, bmi: 29.7 },
  { month: 'Mar', weight: 85.1, bmi: 29.2 },
  { month: 'Apr', weight: 83.4, bmi: 28.6 },
  { month: 'May', weight: 81.9, bmi: 28.1 },
  { month: 'Jun', weight: 79.8, bmi: 27.4 },
];

const MEALS = [
  {
    label: 'Breakfast',
    time: '7:00 – 8:00 AM',
    items: ['Oatmeal with banana', 'Low-fat milk', 'Boiled egg'],
    kcal: 380,
    color: 'amber',
  },
  {
    label: 'Lunch',
    time: '12:30 – 1:30 PM',
    items: ['Grilled chicken breast', 'Brown rice', 'Mixed salad'],
    kcal: 650,
    color: 'sky',
  },
  {
    label: 'Dinner',
    time: '7:00 – 8:00 PM',
    items: ['Baked fish', 'Steamed broccoli', 'Whole wheat bread'],
    kcal: 520,
    color: 'teal',
  },
  {
    label: 'Snack',
    time: '3:30 – 4:00 PM',
    items: ['Greek yogurt', 'Mixed nuts (30g)', 'Apple'],
    kcal: 220,
    color: 'emerald',
  },
];

const APPOINTMENTS = [
  { doctor: 'Dr. Sarah Connor', specialty: 'Endocrinologist', date: 'Jun 25, 2026', time: '10:00 AM', status: 'Confirmed' },
  { doctor: 'Dr. James Reed', specialty: 'Nutritionist', date: 'Jul 3, 2026', time: '2:30 PM', status: 'Pending' },
  { doctor: 'Dr. Sarah Connor', specialty: 'Endocrinologist', date: 'Jul 18, 2026', time: '11:00 AM', status: 'Pending' },
];

const HEALTH_TIPS = [
  { icon: FaDroplet, color: 'sky', title: 'Daily Hydration', tip: 'Drink at least 8 glasses (2L) of water today. Staying hydrated helps metabolism.' },
  { icon: FaDumbbell, color: 'emerald', title: 'Exercise Reminder', tip: '30 minutes of moderate walking today. Regular activity burns 150-200 kcal.' },
  { icon: FaAppleWhole, color: 'orange', title: 'Nutrition Advice', tip: 'Include 5 servings of fruits and vegetables. They are rich in fiber and vitamins.' },
  { icon: FaMoon, color: 'indigo', title: 'Sleep & Recovery', tip: 'Aim for 7-8 hours of quality sleep. Poor sleep increases hunger hormones.' },
];

const MENU = [
  { icon: FaHouseChimney, label: 'Dashboard', id: 'dashboard' },
  { icon: FaBrain, label: 'My Prediction', id: 'prediction' },
  { icon: FaUtensils, label: 'Meal Plan', id: 'meals' },
  { icon: FaCalendarDays, label: 'Appointments', id: 'appointments' },
  { icon: FaChartLine, label: 'Progress Tracker', id: 'progress' },
  { icon: FaWeightScale, label: 'BMI Calculator', id: 'bmi' },
  { icon: FaUser, label: 'Profile', id: 'profile' },
  { icon: FaGear, label: 'Settings', id: 'settings' },
];

// ─── SVG Line Chart ───────────────────────────────────────────────────────────

function LineChart({ data, dataKey, color, label, unit }) {
  const values = data.map(d => d[dataKey]);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const W = 340, H = 120, PAD = { top: 10, right: 10, bottom: 30, left: 36 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;

  const sx = i => PAD.left + (i / (data.length - 1)) * iW;
  const sy = v => PAD.top + iH - ((v - min) / (max - min || 1)) * iH;

  const pathD = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${sx(i)} ${sy(d[dataKey])}`).join(' ');
  const areaD = `${pathD} L ${sx(data.length - 1)} ${H - PAD.bottom} L ${PAD.left} ${H - PAD.bottom} Z`;

  const yTicks = [min, (min + max) / 2, max].map(v => Math.round(v * 10) / 10);

  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 mb-2">{label}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }}>
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line
              x1={PAD.left} y1={sy(v)}
              x2={W - PAD.right} y2={sy(v)}
              stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 3"
            />
            <text x={PAD.left - 4} y={sy(v) + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{v}</text>
          </g>
        ))}

        {/* Area */}
        <path d={areaD} fill={`url(#grad-${dataKey})`} />

        {/* Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points */}
        {data.map((d, i) => (
          <circle key={i} cx={sx(i)} cy={sy(d[dataKey])} r="3.5"
            fill="white" stroke={color} strokeWidth="2" />
        ))}

        {/* X Labels */}
        {data.map((d, i) => (
          <text key={i} x={sx(i)} y={H - 8} textAnchor="middle" fontSize="9" fill="#94a3b8">
            {d.month}
          </text>
        ))}
      </svg>

      {/* Change indicator */}
      <div className="flex items-center space-x-1.5 mt-1">
        <FaArrowTrendDown className="text-emerald-500 text-xs" />
        <span className="text-xs text-emerald-600 font-semibold">
          {(values[0] - values[values.length - 1]).toFixed(1)} {unit} decrease in 6 months
        </span>
      </div>
    </div>
  );
}

// ─── BMI Calculator ────────────────────────────────────────────────────────────

function getBMICategory(bmi) {
  if (bmi < 18.5) return { label: 'Underweight', color: 'sky' };
  if (bmi < 25) return { label: 'Normal Weight', color: 'emerald' };
  if (bmi < 30) return { label: 'Overweight', color: 'amber' };
  if (bmi < 35) return { label: 'Obesity Type I', color: 'orange' };
  return { label: 'Obesity Type II', color: 'rose' };
}

function BMICalculator() {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [result, setResult] = useState(null);

  const calculate = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    if (!w || !h || h <= 0) return;
    const bmi = w / (h * h);
    setResult(Math.round(bmi * 10) / 10);
  };

  const category = result ? getBMICategory(result) : null;

  const colorMap = {
    sky: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', bar: 'bg-sky-400' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', bar: 'bg-emerald-500' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', bar: 'bg-amber-400' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', bar: 'bg-orange-500' },
    rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', bar: 'bg-rose-500' },
  };

  const bmiBarPosition = result ? Math.min(Math.max(((result - 10) / 30) * 100, 0), 100) : 0;

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Weight (kg)</label>
          <input
            type="number"
            value={weight}
            onChange={e => { setWeight(e.target.value); setResult(null); }}
            placeholder="e.g. 75"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:outline-none text-sm transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Height (cm)</label>
          <input
            type="number"
            value={height}
            onChange={e => { setHeight(e.target.value); setResult(null); }}
            placeholder="e.g. 170"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-sky-400 focus:ring-2 focus:ring-sky-100 focus:outline-none text-sm transition-all"
          />
        </div>
      </div>

      <button
        onClick={calculate}
        className="w-full py-2.5 rounded-xl bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 active:scale-[0.98] transition-all shadow-sm"
      >
        Calculate BMI
      </button>

      {result && category && (
        <div className={`mt-4 p-4 rounded-xl border ${colorMap[category.color].bg} ${colorMap[category.color].border}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-slate-500 font-medium">Your BMI</p>
              <p className={`text-3xl font-black ${colorMap[category.color].text}`}>{result}</p>
            </div>
            <div className={`px-3 py-1.5 rounded-xl text-xs font-bold ${colorMap[category.color].text} ${colorMap[category.color].bg} border ${colorMap[category.color].border}`}>
              {category.label}
            </div>
          </div>

          {/* BMI scale bar */}
          <div className="relative h-2 bg-gradient-to-r from-sky-300 via-emerald-400 via-amber-400 to-rose-500 rounded-full overflow-hidden">
            <div
              className="absolute top-0 w-3 h-3 -mt-0.5 rounded-full bg-white border-2 border-slate-600 shadow"
              style={{ left: `calc(${bmiBarPosition}% - 6px)` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-medium">
            <span>10</span><span>18.5</span><span>25</span><span>30</span><span>35</span><span>40</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [user, setUser] = useState({ fullName: 'John Perera', email: 'john@email.com' });

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
  const firstName = user.fullName.split(' ')[0];

  const mealColorMap = {
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    sky: 'bg-sky-50 border-sky-200 text-sky-700',
    teal: 'bg-teal-50 border-teal-200 text-teal-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  };

  const tipColorMap = {
    sky: 'bg-sky-50 text-sky-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800">

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/25 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ══════════════════════════════
          SIDEBAR
      ══════════════════════════════ */}
      <aside className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Logo */}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center shadow-sm">
                <FaHeartPulse className="text-white text-base" />
              </div>
              <div>
                <h1 className="text-[13px] font-bold text-slate-900">My Health Portal</h1>
                <p className="text-[10px] text-slate-400">Patient Dashboard</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600 p-1">
              <FaXmark />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-3 mb-2">Menu</p>
          {MENU.map(item => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveMenu(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon className={`text-sm flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {isActive && <FaChevronRight className="ml-auto text-[10px] text-white/70" />}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 pb-4 border-t border-slate-100 pt-4 space-y-3">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{user.fullName}</p>
              <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-semibold text-rose-500 border border-rose-100 hover:bg-rose-50 transition-colors"
          >
            <FaArrowRightFromBracket className="text-xs" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════
          MAIN
      ══════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* HEADER */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-5 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 lg:hidden">
              <FaBars />
            </button>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Welcome Back, {firstName} 👋</h2>
              <p className="text-[11px] text-slate-400">Track your obesity management journey.</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 relative">
              <FaBell className="text-sm" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center text-white font-bold text-sm hover:bg-sky-600 transition-colors shadow-sm"
              >
                {initials}
              </button>

              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                  <div className="absolute right-0 top-11 z-50 w-52 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                      <p className="text-xs font-bold text-slate-800">{user.fullName}</p>
                      <p className="text-[10px] text-slate-400">{user.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 text-[9px] font-semibold border border-sky-100">Patient</span>
                    </div>
                    <div className="py-1.5">
                      <button className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors">
                        <FaUser className="text-slate-400 text-xs" /><span>My Profile</span>
                      </button>
                      <button className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors">
                        <FaGear className="text-slate-400 text-xs" /><span>Settings</span>
                      </button>
                    </div>
                    <div className="border-t border-slate-100 p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 transition-colors"
                      >
                        <FaArrowRightFromBracket /><span>Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* PAGE */}
        <main className="flex-1 p-5 overflow-y-auto space-y-6">

          {/* ── SECTION 1: HEALTH OVERVIEW ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              {
                icon: FaWeightScale,
                label: 'Current BMI',
                value: '27.4',
                sub: 'Overweight range',
                iconBg: 'bg-sky-50',
                iconColor: 'text-sky-500',
                valuColor: 'text-sky-600',
              },
              {
                icon: FaBrain,
                label: 'Prediction Result',
                value: 'Overweight',
                sub: 'Level II · Moderate risk',
                iconBg: 'bg-amber-50',
                iconColor: 'text-amber-500',
                valuColor: 'text-amber-600',
              },
              {
                icon: FaFire,
                label: 'Daily Calories',
                value: '2,100',
                sub: 'kcal target today',
                iconBg: 'bg-emerald-50',
                iconColor: 'text-emerald-500',
                valuColor: 'text-emerald-600',
              },
              {
                icon: FaCalendarDays,
                label: 'Next Appointment',
                value: 'Jun 25',
                sub: 'Dr. Sarah Connor · 10:00 AM',
                iconBg: 'bg-indigo-50',
                iconColor: 'text-indigo-500',
                valuColor: 'text-indigo-600',
              },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`text-lg ${card.iconColor}`} />
                    </div>
                    <FaChevronRight className="text-slate-300 text-xs" />
                  </div>
                  <p className="text-xs text-slate-400 font-medium mb-1">{card.label}</p>
                  <p className={`text-2xl font-black ${card.valuColor} leading-tight`}>{card.value}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{card.sub}</p>
                </div>
              );
            })}
          </div>

          {/* ── SECTION 2 + 3: PREDICTION + MEAL PLAN ── */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">

            {/* AI Prediction */}
            <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                  <FaBrain className="text-sky-500 text-sm" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">My Latest AI Prediction</h3>
                  <p className="text-[10px] text-slate-400">Analyzed on Jun 20, 2026</p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Prediction</p>
                    <FaTriangleExclamation className="text-amber-400 text-xs" />
                  </div>
                  <p className="text-xl font-black text-amber-700">Overweight Level II</p>
                  <p className="text-xs text-amber-500 mt-0.5">BMI: 27.4 · Above healthy range</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <p className="text-[10px] text-slate-400 font-medium">Confidence</p>
                    <p className="text-xl font-black text-sky-600 mt-0.5">96.4%</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <p className="text-[10px] text-slate-400 font-medium">Risk Level</p>
                    <p className="text-xl font-black text-amber-600 mt-0.5">Moderate</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Top Risk Factors</p>
                  {[
                    { label: 'Weight', val: 92 },
                    { label: 'Activity Level', val: 68 },
                    { label: 'Food Habits', val: 55 },
                  ].map(f => (
                    <div key={f.label}>
                      <div className="flex justify-between text-[11px] mb-0.5">
                        <span className="text-slate-600">{f.label}</span>
                        <span className="font-bold text-slate-700">{f.val}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-400 rounded-full" style={{ width: `${f.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <button className="w-full py-2.5 rounded-xl border border-sky-200 text-sky-600 text-xs font-semibold hover:bg-sky-50 transition-colors">
                  View Full Analysis
                </button>
              </div>
            </div>

            {/* Meal Plan */}
            <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <FaUtensils className="text-emerald-500 text-sm" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Today's Meal Plan</h3>
                    <p className="text-[10px] text-slate-400">Personalized · 1,770 kcal total</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 font-semibold">
                  Target: 2,100 kcal
                </span>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {MEALS.map((meal, i) => (
                    <div key={i} className={`p-3.5 rounded-xl border ${mealColorMap[meal.color]}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider">{meal.label}</span>
                        <span className="text-[10px] font-semibold">{meal.kcal} kcal</span>
                      </div>
                      <p className="text-[10px] opacity-70 mb-2">{meal.time}</p>
                      <ul className="space-y-0.5">
                        {meal.items.map((item, j) => (
                          <li key={j} className="flex items-center space-x-1.5 text-[11px]">
                            <FaCheck className="text-[8px] flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 flex items-center space-x-3">
                    <FaDroplet className="text-sky-400 text-lg flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-sky-600 font-medium">Hydration Goal</p>
                      <p className="text-sm font-bold text-sky-700">8 glasses / day</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center space-x-3">
                    <FaTriangleExclamation className="text-rose-400 text-lg flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-rose-600 font-medium">Foods to Avoid</p>
                      <p className="text-xs font-semibold text-rose-700">Sugar, fried, processed</p>
                    </div>
                  </div>
                </div>

                <button className="w-full py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors shadow-sm">
                  View Full Meal Plan
                </button>
              </div>
            </div>
          </div>

          {/* ── SECTION 4: PROGRESS TRACKER ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <FaChartLine className="text-indigo-500 text-sm" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Progress Tracker</h3>
                <p className="text-[10px] text-slate-400">Last 6 months overview</p>
              </div>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-8">
              <LineChart data={WEIGHT_TREND} dataKey="weight" color="#0EA5E9" label="Weight Progress (kg)" unit="kg" />
              <LineChart data={WEIGHT_TREND} dataKey="bmi" color="#10B981" label="BMI Progress" unit="" />
            </div>
          </div>

          {/* ── SECTION 5 + 6: BMI CALCULATOR + APPOINTMENTS ── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

            {/* BMI Calculator */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                  <FaWeightScale className="text-teal-500 text-sm" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">BMI Calculator</h3>
                  <p className="text-[10px] text-slate-400">Quick BMI check</p>
                </div>
              </div>
              <div className="p-5">
                <BMICalculator />
                <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">BMI Reference</p>
                  <div className="space-y-1">
                    {[
                      { range: 'Below 18.5', label: 'Underweight', color: 'text-sky-600' },
                      { range: '18.5 – 24.9', label: 'Normal Weight', color: 'text-emerald-600' },
                      { range: '25.0 – 29.9', label: 'Overweight', color: 'text-amber-600' },
                      { range: '30.0 – 34.9', label: 'Obesity Type I', color: 'text-orange-600' },
                      { range: '35.0 and above', label: 'Obesity Type II', color: 'text-rose-600' },
                    ].map((r, i) => (
                      <div key={i} className="flex justify-between text-[11px]">
                        <span className="text-slate-500">{r.range}</span>
                        <span className={`font-semibold ${r.color}`}>{r.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Appointments */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                    <FaCalendarDays className="text-violet-500 text-sm" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Upcoming Appointments</h3>
                    <p className="text-[10px] text-slate-400">{APPOINTMENTS.length} scheduled</p>
                  </div>
                </div>
                <button className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-sky-500 text-white text-xs font-semibold hover:bg-sky-600 transition-colors shadow-sm">
                  <FaPlus className="text-[9px]" />
                  <span>Request</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-5 py-3 font-semibold text-slate-500 uppercase tracking-wider">Doctor</th>
                      <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                      <th className="px-4 py-3 font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {APPOINTMENTS.map((apt, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center flex-shrink-0">
                              <FaStethoscope className="text-sky-400 text-[10px]" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 text-xs">{apt.doctor}</p>
                              <p className="text-[10px] text-slate-400">{apt.specialty}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 font-medium">{apt.date}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center space-x-1 text-slate-600">
                            <FaClock className="text-slate-400 text-[10px]" />
                            <span>{apt.time}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            apt.status === 'Confirmed'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : 'bg-amber-50 text-amber-600 border border-amber-200'
                          }`}>
                            {apt.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── SECTION 7: HEALTH TIPS ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                <FaCircleInfo className="text-rose-400 text-sm" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Health Tips & Reminders</h3>
                <p className="text-[10px] text-slate-400">Your daily wellness guidance</p>
              </div>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {HEALTH_TIPS.map((tip, i) => {
                const Icon = tip.icon;
                return (
                  <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
                    <div className={`w-9 h-9 rounded-xl ${tipColorMap[tip.color]} flex items-center justify-center mb-3`}>
                      <Icon className="text-base" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 mb-1.5">{tip.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{tip.tip}</p>
                  </div>
                );
              })}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

// Fix missing import
function FaHeartPulse(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" width="1em" height="1em">
      <path d="M228.3 469.1L47.6 300.4c-4.2-3.9-8.2-8-12-12.1l87.5 22.3c10.7 2.7 21.9-1.4 28.3-10.3l23-32.1 31.8 72.1c3.4 7.7 11.6 12.3 20.1 11.5s15.8-6.9 17.8-15.4l39.4-162.1 27.1 87.8c2.3 7.5 8.6 13.1 16.3 14.6s15.5-1.6 20.5-8.1L502.3 246c.7 3.3 1 6.7 1 10.2c0 16.3-5.7 31.3-15.2 43.1l-22.6 76.6c-4.8 5.2-9.7 10.3-14.8 15.1l-34.7 14.1c-.6 .3-1.2 .6-1.8 .9c-1.5 .7-3.1 1.3-4.7 1.9L306 468.1c-15 8.1-32.9 8.6-48.4 1.3L228.3 469.1zm99.2-308.1L300.3 76.4c-11.5-35.2-52.9-52.1-83.8-35L43.3 131.5C17.1 145.9 3.2 175.3 8.6 204.6L98 226.7c5.8 1.5 11 4.9 14.7 9.7l22.2 29.8 27.9-56.1c4.6-9.2 13.6-15.2 23.9-15.8s19.8 4.4 25.4 13.2L240 256l.4-.1 48-192c2.3-9.2 9.4-16.3 18.6-18.5l20.5-4.9z"/>
    </svg>
  );
}
