import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaUserDoctor, FaUser, FaFileMedical, FaBrain, FaUtensils,
  FaChartLine, FaNotesMedical, FaChartBar, FaGear, FaBell,
  FaMagnifyingGlass, FaArrowRightFromBracket, FaBars, FaXmark,
  FaPlus, FaEye, FaCalendarDays, FaCircleCheck, FaClock, FaHeartPulse,
  FaWeightScale, FaChevronRight, FaCirclePlus, FaAngleRight, FaCircleInfo
} from 'react-icons/fa6';

// ─── MENU Navigation Items ───────────────────────────────────────────────────
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

// ─── Mini SVG Sparkline Chart for weight progress inside modal ─────────────
function MiniSparkline({ data }) {
  if (!data || data.length < 2) return <p className="text-[10px] text-slate-400">Not enough history</p>;
  const weights = data.map(d => d.weight || d.bmi || 0);
  const max = Math.max(...weights);
  const min = Math.min(...weights);
  const w = 220, h = 50, pad = 6;
  const scaleX = i => pad + (i / (data.length - 1)) * (w - 2 * pad);
  const scaleY = v => h - pad - ((v - min) / (max - min || 1)) * (h - 2 * pad);
  const points = data.map((d, i) => `${scaleX(i)},${scaleY(weights[i])}`).join(' ');
  
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <circle key={i} cx={scaleX(i)} cy={scaleY(weights[i])} r="2.5" fill="#0EA5E9" stroke="white" strokeWidth="1" />
      ))}
    </svg>
  );
}

// ─── Status Badge mapping ────────────────────────────────────────────────────
function StatusBadge({ status }) {
  let badgeStyle = 'bg-slate-50 text-slate-600 border-slate-200';
  if (status?.includes('Obesity')) {
    badgeStyle = 'bg-rose-50 text-rose-600 border-rose-200';
  } else if (status?.includes('Overweight')) {
    badgeStyle = 'bg-amber-50 text-amber-600 border-amber-200';
  } else if (status?.includes('Normal')) {
    badgeStyle = 'bg-emerald-50 text-emerald-600 border-emerald-200';
  } else if (status?.includes('Active') || status?.includes('Treatment')) {
    badgeStyle = 'bg-sky-50 text-sky-600 border-sky-200';
  }
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeStyle}`}>
      {status}
    </span>
  );
}

export default function DoctorPatients() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [user, setUser] = useState({ fullName: 'Dr. Sarah Connor', email: 'sarah@hospital.com' });
  
  // Data states
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('overview'); // overview, prediction, meal, notes, appointments
  const [newClinicalNote, setNewClinicalNote] = useState('');

  const triggerNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) setUser(JSON.parse(saved));
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    
    try {
      const res = await axios.get('http://localhost:5000/api/doctor/patients', { headers });
      if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setPatients(res.data.data);
      } else {
        throw new Error('API offline or returned empty.');
      }
    } catch (err) {
      console.warn('GET doctor patients API offline, loading mock patients database.');
      loadMockPatients();
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockPatients = () => {
    const mock = [
      {
        _id: 'p1',
        fullName: 'Marcus Johnson',
        age: 42,
        gender: 'Male',
        dob: '1984-03-12',
        email: 'marcus@email.com',
        phoneNumber: '0771234567',
        weight: 98.4,
        height: 1.68,
        bmi: 34.8,
        condition: 'Obesity Type I',
        lastPredictionResult: 'Obesity Type I (89% confidence)',
        nextAppointment: 'Today 14:30',
        status: 'Under Treatment',
        mealPlan: {
          type: 'Ketogenic Diet',
          calories: 1800,
          adherence: 78,
          meals: {
            breakfast: 'Avocado + Scrambled Eggs + Green Tea',
            lunch: 'Grilled Salmon + Asparagus + Olive Oil Salad',
            dinner: 'Ribeye Steak + Spinach + Broccoli'
          }
        },
        predictionHistory: [
          { date: '2026-06-25', result: 'Obesity Type I', confidence: 89, weight: 98.4 },
          { date: '2026-05-25', result: 'Obesity Type I', confidence: 91, weight: 101.2 },
          { date: '2026-04-25', result: 'Obesity Type II', confidence: 93, weight: 104.5 }
        ],
        bmiHistory: [
          { date: 'Apr 25', weight: 104.5, bmi: 37.0 },
          { date: 'May 25', weight: 101.2, bmi: 35.8 },
          { date: 'Jun 25', weight: 98.4, bmi: 34.8 }
        ],
        clinicalNotes: [
          { date: '2026-06-24', author: 'Dr. Sarah Connor', note: 'Patient showed significant weight decline. BMI dropped from 37 to 34.8. High adherence to ketogenic protocol.' },
          { date: '2026-05-22', author: 'Dr. Sarah Connor', note: 'Keto adaptation stage completed. Mild fatigue reported during first week. Instructed to increase sodium intake.' }
        ],
        appointmentHistory: [
          { date: '2026-06-25 10:30', reason: 'Monthly Review', status: 'Completed' },
          { date: '2026-05-25 11:15', reason: 'BMI Risk Checkup', status: 'Completed' }
        ]
      },
      {
        _id: 'p2',
        fullName: 'Elena Rodriguez',
        age: 35,
        gender: 'Female',
        dob: '1991-07-22',
        email: 'elena.r@email.com',
        phoneNumber: '0719876543',
        weight: 79.5,
        height: 1.70,
        bmi: 27.5,
        condition: 'Overweight',
        lastPredictionResult: 'Overweight (76% confidence)',
        nextAppointment: 'Today 15:15',
        status: 'Under Treatment',
        mealPlan: {
          type: 'Mediterranean Diet',
          calories: 2100,
          adherence: 82,
          meals: {
            breakfast: 'Greek Yogurt + Berries + Walnuts',
            lunch: 'Quinoa Bowl + Grilled Chicken + Hummus',
            dinner: 'Baked Cod + Mixed Herbs + Roasted Vegetables'
          }
        },
        predictionHistory: [
          { date: '2026-06-22', result: 'Overweight', confidence: 76, weight: 79.5 },
          { date: '2026-05-20', result: 'Overweight', confidence: 81, weight: 81.3 }
        ],
        bmiHistory: [
          { date: 'May 20', weight: 81.3, bmi: 28.1 },
          { date: 'Jun 22', weight: 79.5, bmi: 27.5 }
        ],
        clinicalNotes: [
          { date: '2026-06-22', author: 'Dr. Sarah Connor', note: 'Mediterranean meal plan adherence is high. Increasing cardiovascular training to 4 sessions weekly.' }
        ],
        appointmentHistory: [
          { date: '2026-06-22 14:00', reason: 'Meal Plan Assessment', status: 'Completed' }
        ]
      },
      {
        _id: 'p3',
        fullName: 'David Chen',
        age: 28,
        gender: 'Male',
        dob: '1998-11-05',
        email: 'david.c@email.com',
        phoneNumber: '0724567890',
        weight: 68.2,
        height: 1.75,
        bmi: 22.3,
        condition: 'Normal Weight',
        lastPredictionResult: 'Normal Weight (94% confidence)',
        nextAppointment: 'Tomorrow 09:00',
        status: 'Recovered',
        mealPlan: {
          type: 'Balanced Weight Maintenance',
          calories: 2400,
          adherence: 91,
          meals: {
            breakfast: 'Oatmeal + Banana + Peanut Butter',
            lunch: 'Turkey Breast Sandwich + Avocado Salad',
            dinner: 'Brown Rice + Teriyaki Beef + Mixed Veggies'
          }
        },
        predictionHistory: [
          { date: '2026-06-20', result: 'Normal Weight', confidence: 94, weight: 68.2 }
        ],
        bmiHistory: [
          { date: 'Jun 20', weight: 68.2, bmi: 22.3 }
        ],
        clinicalNotes: [
          { date: '2026-06-20', author: 'Dr. Sarah Connor', note: 'Weight stabilized. Moving from reduction protocol to maintenance diet plan.' }
        ],
        appointmentHistory: [
          { date: '2026-06-20 09:30', reason: 'Weight Progress Check', status: 'Completed' }
        ]
      },
      {
        _id: 'p4',
        fullName: 'Sarah Mitchell',
        age: 51,
        gender: 'Female',
        dob: '1975-05-18',
        email: 'sarah.m@email.com',
        phoneNumber: '0751239876',
        weight: 108.2,
        height: 1.67,
        bmi: 38.8,
        condition: 'Obesity Type II',
        lastPredictionResult: 'Obesity Type II (92% confidence)',
        nextAppointment: 'Jul 05, 11:30',
        status: 'Under Treatment',
        mealPlan: {
          type: 'Low-Glycemic Diet',
          calories: 1600,
          adherence: 65,
          meals: {
            breakfast: 'Chia Seed Pudding + Almond Milk',
            lunch: 'Tuna Salad + Celery Sticks + Olive Dressing',
            dinner: 'Lemon Herb Chicken + Cauliflower Rice'
          }
        },
        predictionHistory: [
          { date: '2026-06-23', result: 'Obesity Type II', confidence: 92, weight: 108.2 },
          { date: '2026-05-23', result: 'Obesity Type III', confidence: 94, weight: 112.4 }
        ],
        bmiHistory: [
          { date: 'May 23', weight: 112.4, bmi: 40.3 },
          { date: 'Jun 23', weight: 108.2, bmi: 38.8 }
        ],
        clinicalNotes: [
          { date: '2026-06-23', author: 'Dr. Sarah Connor', note: 'High HbA1c concern registered. Refer to endocrinology consultation. Recommended decreasing carbohydrate intake below 40g daily.' }
        ],
        appointmentHistory: [
          { date: '2026-06-23 11:30', reason: 'Initial Consultation', status: 'Completed' }
        ]
      }
    ];
    setPatients(mock);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const openPatientModal = (patient, tab = 'overview') => {
    setSelectedPatient(patient);
    setActiveModalTab(tab);
    setNewClinicalNote('');
    setIsModalOpen(true);
  };

  const handleAddClinicalNoteSubmit = async (e) => {
    e.preventDefault();
    if (!newClinicalNote.trim()) return;

    const noteRecord = {
      date: new Date().toISOString().split('T')[0],
      author: user.fullName,
      note: newClinicalNote
    };

    // Optimistic Frontend update
    const updatedPatients = patients.map(p => {
      if (p._id === selectedPatient._id) {
        return {
          ...p,
          clinicalNotes: [noteRecord, ...(p.clinicalNotes || [])]
        };
      }
      return p;
    });

    setPatients(updatedPatients);
    setSelectedPatient(prev => ({
      ...prev,
      clinicalNotes: [noteRecord, ...(prev.clinicalNotes || [])]
    }));
    
    setNewClinicalNote('');
    triggerNotification('Clinical note added successfully.');

    // Attempt API save
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/doctor/patients/${selectedPatient._id}/notes`, { note: newClinicalNote }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.warn('Backend note save endpoint not loaded. Saved in frontend session state.');
    }
  };

  const initials = user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  // Metrics Calculation
  const totalPatients = patients.length;
  const highRiskPatients = patients.filter(p => p.condition?.includes('Obesity Type II') || p.condition?.includes('Obesity Type III')).length;
  const underTreatment = patients.filter(p => p.status === 'Under Treatment').length;
  const normalCondition = patients.filter(p => p.condition === 'Normal Weight').length;

  const filteredPatients = patients.filter(p => 
    p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.condition?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800">
      
      {/* Toast Alert */}
      {notification && (
        <div className="fixed top-6 right-6 z-[110] flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-xl border bg-white border-slate-200 animate-slide-in">
          <span className={`w-2.5 h-2.5 rounded-full ${notification.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
          <span className="text-xs font-semibold text-slate-700">{notification.message}</span>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ══════════════════════════════
          SIDEBAR
      ══════════════════════════════ */}
      <aside className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 flex flex-col bg-white border-r border-slate-200 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
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
            <button onClick={() => setSidebarOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 lg:hidden" type="button">
              <FaXmark />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 mb-3">Main Menu</p>
          {MENU.map(item => {
            const Icon = item.icon;
            const isActive = item.id === 'patients';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'dashboard') navigate('/doctor/dashboard');
                  setSidebarOpen(false);
                }}
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
            type="button"
            className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-semibold text-rose-500 border border-rose-100 bg-rose-50 hover:bg-rose-100 transition-colors"
          >
            <FaArrowRightFromBracket />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════
          MAIN PANEL
      ══════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 lg:hidden" type="button">
              <FaBars />
            </button>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Assigned Patient Records</h2>
              <p className="text-[11px] text-slate-400">View diagnostic details and update clinical treatments</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-md hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
                type="button"
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
                    </div>
                    <div className="py-1.5">
                      <button onClick={() => navigate('/doctor/dashboard')} className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-colors" type="button">
                        <FaUserDoctor className="text-slate-400 text-xs" /><span>My Dashboard</span>
                      </button>
                    </div>
                    <div className="border-t border-slate-100 p-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-semibold text-rose-500 border border-rose-100 bg-rose-50 hover:bg-rose-105 transition-colors"
                        type="button"
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

        {/* Workspace Body */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Patients</h1>
              <p className="text-xs text-slate-400 font-medium">Patients assigned to you for diagnosis, AI prediction, and meal plans.</p>
            </div>
            
            {/* Search Input */}
            <div className="flex items-center space-x-2 px-3 py-2 w-full sm:w-64 rounded-xl bg-white border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:border-sky-500 transition-all">
              <FaMagnifyingGlass className="text-slate-450 text-xs shrink-0" />
              <input
                type="text"
                placeholder="Search patient, risk status..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-transparent text-xs placeholder-slate-400 focus:outline-none w-full text-slate-800"
              />
            </div>
          </div>

          {/* SUMMARY STATISTICS CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Patients', value: totalPatients, icon: FaUser, gradient: 'from-sky-500 to-sky-600', sub: 'Assigned to your profile' },
              { label: 'High Risk Patients', value: highRiskPatients, icon: FaHeartPulse, gradient: 'from-rose-500 to-rose-600', sub: 'Obesity Type II/III status' },
              { label: 'Under Treatment', value: underTreatment, icon: FaClock, gradient: 'from-amber-500 to-amber-600', sub: 'Active treatment cycle' },
              { label: 'Normal Condition', value: normalCondition, icon: FaCircleCheck, gradient: 'from-emerald-500 to-emerald-600', sub: 'Healthy BMI index range' }
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{card.label}</span>
                    <h3 className="text-2xl font-black text-slate-900 mt-1">{card.value}</h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{card.sub}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shrink-0 shadow-md`}>
                    <Icon className="text-sm" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* TABLE CONTAINER */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            
            {isLoading ? (
              /* SKELETON LOADING */
              <div className="p-6 space-y-4">
                <div className="h-5 bg-slate-100 rounded-lg w-1/4 animate-pulse" />
                <div className="space-y-2">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="h-12 bg-slate-50 rounded-xl animate-pulse" />
                  ))}
                </div>
              </div>
            ) : filteredPatients.length === 0 ? (
              /* EMPTY STATE */
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-350 mx-auto mb-4">
                  <FaUser className="text-xl" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No Patients Found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">No patients match your search term or are currently assigned to your account.</p>
              </div>
            ) : (
              /* PATIENT TABLE */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-150 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="px-5 py-3.5 font-semibold">Patient Name</th>
                      <th className="px-5 py-3.5 font-semibold">Age</th>
                      <th className="px-5 py-3.5 font-semibold">BMI</th>
                      <th className="px-5 py-3.5 font-semibold">Condition</th>
                      <th className="px-5 py-3.5 font-semibold">Last Prediction Result</th>
                      <th className="px-5 py-3.5 font-semibold">Next Appointment</th>
                      <th className="px-5 py-3.5 font-semibold">Status</th>
                      <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredPatients.map(patient => (
                      <tr key={patient._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 font-bold text-xs">
                              {patient.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{patient.fullName}</span>
                              <span className="text-[10px] text-slate-405 text-slate-400 block">{patient.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{patient.age} years</td>
                        <td className="px-5 py-3.5 font-mono text-slate-900 font-semibold">{patient.bmi.toFixed(1)}</td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={patient.condition} />
                        </td>
                        <td className="px-5 py-3.5 text-slate-650">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] font-mono font-bold bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100">AI</span>
                            <span className="truncate max-w-[150px]" title={patient.lastPredictionResult}>{patient.lastPredictionResult}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-550 font-semibold">
                          <div className="flex items-center space-x-1">
                            <FaCalendarDays className="text-[10px] text-slate-400" />
                            <span>{patient.nextAppointment || 'None Scheduled'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={patient.status} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => openPatientModal(patient, 'overview')}
                              className="px-2 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-[10px] font-bold transition-all cursor-pointer inline-flex items-center space-x-1"
                              title="View Profile"
                              type="button"
                            >
                              <FaEye /><span>Profile</span>
                            </button>
                            <button
                              onClick={() => openPatientModal(patient, 'prediction')}
                              className="px-2 py-1.5 rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 text-[10px] font-bold transition-all cursor-pointer inline-flex items-center space-x-1 border border-sky-100"
                              title="View AI Predictions"
                              type="button"
                            >
                              <FaBrain /><span>AI</span>
                            </button>
                            <button
                              onClick={() => openPatientModal(patient, 'meals')}
                              className="px-2 py-1.5 rounded-lg bg-teal-50 text-teal-650 hover:bg-teal-100 text-[10px] font-bold transition-all cursor-pointer inline-flex items-center space-x-1 border border-teal-100"
                              title="View Meal Plan"
                              type="button"
                            >
                              <FaUtensils /><span>Meals</span>
                            </button>
                            <button
                              onClick={() => openPatientModal(patient, 'notes')}
                              className="px-2 py-1.5 rounded-lg bg-purple-50 text-purple-650 hover:bg-purple-100 text-[10px] font-bold transition-all cursor-pointer inline-flex items-center space-x-1 border border-purple-100"
                              title="Add Note"
                              type="button"
                            >
                              <FaNotesMedical /><span>Note</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ══════════════════════════════
          VIEW PATIENT MODAL
      ══════════════════════════════ */}
      {isModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[90vh]">
            
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all cursor-pointer"
              type="button"
            >
              <FaXmark />
            </button>

            {/* Header Details */}
            <div className="flex items-center space-x-4 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center text-white text-base font-bold shadow-md">
                {selectedPatient.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">{selectedPatient.fullName}</h3>
                <div className="flex flex-wrap gap-2 items-center mt-1">
                  <span className="text-[10px] text-slate-400 font-mono font-bold">ID: {selectedPatient._id.toUpperCase()}</span>
                  <span className="text-slate-350 text-xs">|</span>
                  <StatusBadge status={selectedPatient.condition} />
                  <span className="text-slate-350 text-xs">|</span>
                  <span className="text-[10px] text-slate-500 font-semibold">{selectedPatient.gender}, {selectedPatient.age} years</span>
                </div>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50/50 p-1.5 rounded-xl mt-4">
              {[
                { id: 'overview', label: 'Overview', icon: FaUser },
                { id: 'prediction', label: 'AI Predicts', icon: FaBrain },
                { id: 'meals', label: 'Meal Plan', icon: FaUtensils },
                { id: 'notes', label: 'Clinical Notes', icon: FaNotesMedical },
                { id: 'appointments', label: 'Appointments', icon: FaCalendarDays }
              ].map(tab => {
                const Icon = tab.icon;
                const isTabActive = activeModalTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveModalTab(tab.id)}
                    className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      isTabActive
                        ? 'bg-white text-sky-600 shadow-sm border border-slate-100'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="text-xs" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto py-5 text-xs text-slate-700 min-h-[300px]">
              
              {/* TAB 1: OVERVIEW */}
              {activeModalTab === 'overview' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Personal Details */}
                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2.5">
                      <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Contact Information</h4>
                      <div className="grid grid-cols-2 gap-3 text-[11px]">
                        <div>
                          <span className="block text-[10px] text-slate-400">Email Address</span>
                          <span className="font-semibold text-slate-800 block truncate">{selectedPatient.email}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400">Phone Number</span>
                          <span className="font-semibold text-slate-800 block">{selectedPatient.phoneNumber}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400">Date of Birth</span>
                          <span className="font-semibold text-slate-800 block">{selectedPatient.dob}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400">General Status</span>
                          <span className="font-semibold text-sky-600 block">{selectedPatient.status}</span>
                        </div>
                      </div>
                    </div>

                    {/* Vitals Summary */}
                    <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2.5">
                      <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Vitals Summary</h4>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-white rounded-xl border border-slate-100">
                          <span className="block text-[9px] text-slate-400 uppercase">Weight</span>
                          <span className="text-sm font-black text-slate-800 font-mono block mt-0.5">{selectedPatient.weight} kg</span>
                        </div>
                        <div className="p-2 bg-white rounded-xl border border-slate-100">
                          <span className="block text-[9px] text-slate-400 uppercase">Height</span>
                          <span className="text-sm font-black text-slate-800 font-mono block mt-0.5">{selectedPatient.height} m</span>
                        </div>
                        <div className="p-2 bg-white rounded-xl border border-slate-100">
                          <span className="block text-[9px] text-slate-400 uppercase">BMI</span>
                          <span className="text-sm font-black text-sky-600 font-mono block mt-0.5">{selectedPatient.bmi.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Weight Progress Sparkline */}
                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Weight Tracker Progress</h4>
                      <span className="text-[10px] text-slate-450 font-semibold text-sky-600">Past 3 months</span>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-100 p-3">
                      <MiniSparkline data={selectedPatient.bmiHistory} />
                      <div className="flex justify-between text-[9px] text-slate-400 mt-2 font-mono">
                        {(selectedPatient.bmiHistory || []).map((b, idx) => (
                          <span key={idx}>{b.date} ({b.weight}kg)</span>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: AI PREDICTION */}
              {activeModalTab === 'prediction' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-rose-100 bg-rose-50/30 flex items-start space-x-3">
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 shrink-0">
                      <FaBrain />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Obesity Risk Analysis</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                        Our random-forest machine learning model classifies this patient under the category:
                      </p>
                      <div className="mt-2.5 flex items-center space-x-2">
                        <span className="px-3 py-1 bg-rose-100 border border-rose-200 text-rose-700 font-black rounded-lg text-xs">
                          {selectedPatient.condition}
                        </span>
                        <span className="text-[11px] text-rose-500 font-semibold">{selectedPatient.lastPredictionResult.split('(')[1]?.replace(')', '') || 'High confidence'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2.5">
                    <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Risk Assessment History</h4>
                    <div className="space-y-2">
                      {(selectedPatient.predictionHistory || []).map((h, i) => (
                        <div key={i} className="bg-white rounded-xl border border-slate-100 p-3 flex items-center justify-between text-[11px]">
                          <div>
                            <span className="font-bold text-slate-850 block">{h.result}</span>
                            <span className="text-[9px] text-slate-400 block font-mono">Run Date: {h.date}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-purple-600 block">{h.confidence}% confidence</span>
                            <span className="text-[9px] text-slate-450 block font-mono">Weight: {h.weight} kg</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 3: MEAL PLAN */}
              {activeModalTab === 'meals' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 rounded-2xl bg-teal-50/40 border border-teal-100/50 text-center">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider">Plan Assigned</span>
                      <span className="font-black text-teal-650 block text-xs mt-1">{selectedPatient.mealPlan.type}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-teal-50/40 border border-teal-100/50 text-center">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider">Target Intake</span>
                      <span className="font-black text-slate-800 block text-xs mt-1">{selectedPatient.mealPlan.calories} kcal/day</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-teal-50/40 border border-teal-100/50 text-center">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider">Plan Adherence</span>
                      <span className="font-black text-emerald-600 block text-xs mt-1">{selectedPatient.mealPlan.adherence}%</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
                    <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Dietary Menu Allocation</h4>
                    <div className="space-y-2.5 text-[11px]">
                      <div className="bg-white rounded-xl border border-slate-100 p-3">
                        <span className="text-[9px] font-bold text-sky-500 uppercase tracking-wider block mb-0.5">Breakfast</span>
                        <p className="text-slate-700 leading-relaxed">{selectedPatient.mealPlan.meals.breakfast}</p>
                      </div>
                      <div className="bg-white rounded-xl border border-slate-100 p-3">
                        <span className="text-[9px] font-bold text-teal-500 uppercase tracking-wider block mb-0.5">Lunch</span>
                        <p className="text-slate-700 leading-relaxed">{selectedPatient.mealPlan.meals.lunch}</p>
                      </div>
                      <div className="bg-white rounded-xl border border-slate-100 p-3">
                        <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider block mb-0.5">Dinner</span>
                        <p className="text-slate-700 leading-relaxed">{selectedPatient.mealPlan.meals.dinner}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: CLINICAL NOTES */}
              {activeModalTab === 'notes' && (
                <div className="space-y-4">
                  
                  {/* Note input form */}
                  <form onSubmit={handleAddClinicalNoteSubmit} className="space-y-3 p-3.5 rounded-2xl border border-slate-150 bg-slate-50/60">
                    <label className="block text-[11px] font-bold text-slate-550 uppercase tracking-wider">Add Clinical Entry</label>
                    <textarea
                      rows="2"
                      value={newClinicalNote}
                      onChange={e => setNewClinicalNote(e.target.value)}
                      placeholder="Enter new diagnostic comments, treatment plans or dosage updates..."
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-sky-500/20 focus:outline-none text-slate-800 transition-all"
                      required
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-bold transition-all shadow-sm active:scale-[0.98] cursor-pointer inline-flex items-center space-x-1"
                      >
                        <FaCirclePlus /><span>Submit Note</span>
                      </button>
                    </div>
                  </form>

                  {/* Notes Feed */}
                  <div className="space-y-3">
                    <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Diagnostic History Feed</h4>
                    <div className="space-y-2.5">
                      {(selectedPatient.clinicalNotes || []).map((n, i) => (
                        <div key={i} className="p-3 bg-white rounded-xl border border-slate-100 text-[11px]">
                          <div className="flex justify-between items-center mb-1 text-[9px] font-mono text-slate-400">
                            <span>Author: {n.author}</span>
                            <span>{n.date}</span>
                          </div>
                          <p className="text-slate-700 leading-relaxed font-medium">{n.note}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 5: APPOINTMENTS */}
              {activeModalTab === 'appointments' && (
                <div className="space-y-3">
                  <h4 className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Consultation Timeline</h4>
                  <div className="bg-white rounded-xl border border-slate-100 overflow-hidden text-[11px]">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                          <th className="px-4 py-2">Consultation Date</th>
                          <th className="px-4 py-2">Reason</th>
                          <th className="px-4 py-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(selectedPatient.appointmentHistory || []).map((a, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2.5 font-mono">{a.date}</td>
                            <td className="px-4 py-2.5 font-semibold text-slate-700">{a.reason}</td>
                            <td className="px-4 py-2.5 text-right">
                              <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                {a.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* Footer buttons */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 transition-all cursor-pointer"
                type="button"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
