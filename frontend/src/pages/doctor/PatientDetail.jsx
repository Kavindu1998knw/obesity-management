import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import { 
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';
import { 
  User,
  Activity,
  Utensils,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  ArrowLeft,
  Calendar,
  Scale,
  Ruler,
  Save,
  Loader2,
  Plus,
  Stethoscope
} from 'lucide-react';

const VALID_TABS = ['overview', 'assessments', 'meals', 'progress', 'notes'];

function getObesityBadge(level) {
  if (!level || level === 'Not Assessed') return 'bg-slate-100 text-slate-600 border-slate-200';
  if (level.includes('Obesity_Type_II') || level.includes('Obesity_Type_III') || level.includes('Type II') || level.includes('Type III')) return 'bg-rose-50 text-rose-700 border-rose-200';
  if (level.includes('Obesity') || level.includes('Overweight')) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (level.includes('Normal')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (level.includes('Insufficient')) return 'bg-sky-50 text-sky-700 border-sky-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function getRiskCardStyle(level) {
  if (!level || level === 'Not Assessed') {
    return {
      iconBg: 'bg-slate-50 text-slate-600 border-slate-200',
      text: 'text-slate-700'
    };
  }
  if (level.includes('Obesity_Type_II') || level.includes('Obesity_Type_III') || level.includes('Type II') || level.includes('Type III')) {
    return {
      iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
      text: 'text-rose-600'
    };
  }
  if (level.includes('Obesity') || level.includes('Overweight')) {
    return {
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      text: 'text-amber-600'
    };
  }
  if (level.includes('Normal')) {
    return {
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      text: 'text-emerald-600'
    };
  }
  if (level.includes('Insufficient')) {
    return {
      iconBg: 'bg-sky-50 text-sky-600 border-sky-100',
      text: 'text-sky-600'
    };
  }
  return {
    iconBg: 'bg-slate-50 text-slate-600 border-slate-200',
    text: 'text-slate-700'
  };
}

function formatObesityLabel(val) {
  if (!val) return 'N/A';
  return val.replace(/_/g, ' ');
}

function CustomProgressTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const dataPoint = payload[0]?.payload;
    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-lg p-3 text-xs space-y-1.5 min-w-[150px]">
        <div className="border-b border-slate-100 pb-1 flex justify-between items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{dataPoint?.fullDate || label}</span>
          {dataPoint?.bmi && (
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border ${getObesityBadge(dataPoint.obesityClass || '')}`}>
              {dataPoint.bmi} kg/m²
            </span>
          )}
        </div>
        {payload.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-slate-600 font-medium">{item.name}:</span>
            </div>
            <span className="font-bold text-slate-900">
              {item.value} {item.dataKey === 'weight' ? 'kg' : 'kg/m²'}
            </span>
          </div>
        ))}
        {dataPoint?.weightChange !== undefined && dataPoint?.weightChange !== 0 && (
          <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px]">
            <span className="text-slate-400">Step change:</span>
            <span className={`font-bold ${dataPoint.weightChange < 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {dataPoint.weightChange > 0 ? `+${dataPoint.weightChange}` : dataPoint.weightChange} kg
            </span>
          </div>
        )}
      </div>
    );
  }
  return null;
}

export default function PatientDetail() {
  const { id } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab');
  const initialTab = VALID_TABS.includes(tabParam) ? tabParam : 'overview';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [progressView, setProgressView] = useState('both');
  
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for Doctor Notes Form
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteMessage, setNoteMessage] = useState({ type: '', text: '' });
  const [editingNoteId, setEditingNoteId] = useState(null);

  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Update active tab when URL query changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (VALID_TABS.includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  useEffect(() => {
    fetchPatientDetails();
  }, [id]);

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/doctor/patients/${id}`);
      setPatientData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load patient details.');
    } finally {
      setLoading(false);
    }
  };

  const submitNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      setSavingNote(true);
      setNoteMessage({ type: '', text: '' });
      
      if (editingNoteId) {
        await apiClient.put(`/doctor/patients/${id}/notes/${editingNoteId}`, { note: newNote });
        setNoteMessage({ type: 'success', text: 'Note updated successfully.' });
      } else {
        await apiClient.post(`/doctor/patients/${id}/notes`, { note: newNote });
        setNoteMessage({ type: 'success', text: 'Clinical note added successfully.' });
      }

      setNewNote('');
      setEditingNoteId(null);
      fetchPatientDetails();
    } catch (err) {
      setNoteMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save note.' });
    } finally {
      setSavingNote(false);
    }
  };

  const handleEditNote = (note) => {
    setEditingNoteId(note._id);
    setNewNote(note.note);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm("Are you sure you want to delete this clinical note?")) return;
    try {
      await apiClient.delete(`/doctor/patients/${id}/notes/${noteId}`);
      fetchPatientDetails();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete note.");
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="doctor">
        <div className="flex flex-col justify-center items-center h-80 text-slate-400 space-y-2">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-medium">Loading clinical profile...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !patientData) {
    return (
      <DashboardLayout role="doctor">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-2xl text-center text-xs font-medium">
          {error || 'Patient not found'}
        </div>
      </DashboardLayout>
    );
  }

  const profile = patientData.profile || patientData.patient || {};
  const overview = patientData.overview || {};
  const patient = {
    _id: profile._id || profile.id || id,
    name: profile.name || profile.fullName || 'Unknown Patient',
    age: profile.age || 'N/A',
    gender: profile.gender || 'N/A',
    email: profile.email || '',
    phoneNumber: profile.phoneNumber || ''
  };
  const assessments = patientData.assessments || [];
  const mealPlan = patientData.mealPlan || (patientData.mealPlans && patientData.mealPlans.length > 0 ? patientData.mealPlans[0] : null);
  const progress = patientData.progress || patientData.progressRecords || [];
  const notes = patientData.notes || [];

  const sortedProgress = [...progress].sort((a, b) => new Date(a.date) - new Date(b.date));
  const progressChartData = sortedProgress.map((p, idx) => {
    const prev = idx > 0 ? sortedProgress[idx - 1] : null;
    const weightVal = Number(p.weight);
    const bmiVal = Number(p.bmi);
    const prevWeight = prev ? Number(prev.weight) : null;
    const prevBmi = prev ? Number(prev.bmi) : null;
    const weightChange = prevWeight !== null ? +(weightVal - prevWeight).toFixed(1) : 0;
    const bmiChange = prevBmi !== null ? +(bmiVal - prevBmi).toFixed(2) : 0;
    
    return {
      ...p,
      displayDate: new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      fullDate: new Date(p.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
      weight: weightVal,
      bmi: bmiVal,
      weightChange,
      bmiChange
    };
  });

  const firstProgress = progressChartData[0];
  const latestProgress = progressChartData[progressChartData.length - 1];
  const totalWeightChange = firstProgress && latestProgress ? +(latestProgress.weight - firstProgress.weight).toFixed(1) : 0;
  const totalBmiChange = firstProgress && latestProgress ? +(latestProgress.bmi - firstProgress.bmi).toFixed(2) : 0;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'assessments', label: 'AI Assessments', icon: Activity },
    { id: 'meals', label: 'Meal Plan', icon: Utensils },
    { id: 'progress', label: 'Progress Tracking', icon: TrendingUp },
    { id: 'notes', label: 'Clinical Notes', icon: FileText }
  ];

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-6 pb-10">
        
        {/* Top Navigation & Patient Summary Banner */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link 
              to="/doctor/patients" 
              className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-teal-700 hover:bg-teal-50 hover:border-teal-200 transition-colors"
              title="Back to Patients Directory"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {patient.name}
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-semibold uppercase">
                  #{patient._id ? String(patient._id).slice(-6).toUpperCase() : 'PATIENT'}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getObesityBadge(overview?.latestObesityClass || profile?.latestObesityClassification)}`}>
                  {formatObesityLabel(overview?.latestObesityClass || profile?.latestObesityClassification)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {patient.age} years • {patient.gender} • BMI: <span className="font-bold text-slate-800">{overview?.currentBmi || profile?.currentBmi || 'N/A'} kg/m²</span>
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 self-end md:self-auto">
            <Link
              to={`/doctor/assessments/new?patient=${patient._id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Activity className="w-4 h-4" />
              <span>New Assessment</span>
            </Link>
            {assessments.length > 0 && (
              <Link
                to={`/doctor/meals/new?assessment=${assessments[0]._id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <Utensils className="w-4 h-4" />
                <span>Create Meal Plan</span>
              </Link>
            )}
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex border-b border-slate-200/80 gap-2 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shrink-0">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Assigned Doctor</p>
                  <p className="font-bold text-xs sm:text-sm text-slate-900 truncate mt-0.5">
                    Dr. {overview.assignedDoctor?.fullName || profile.assignedDoctorName || 'Assigned'}
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                  <Scale className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Current BMI</p>
                  <p className="font-bold text-xs sm:text-sm text-slate-900 mt-0.5">
                    {overview.currentBmi ? `${overview.currentBmi} kg/m²` : profile.currentBmi ? `${profile.currentBmi} kg/m²` : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
                  <Ruler className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Height & Weight</p>
                  <p className="font-bold text-xs sm:text-sm text-slate-900 mt-0.5">
                    {overview.height || profile.height ? `${overview.height || profile.height} cm` : '--'} / {overview.weight || profile.weight ? `${overview.weight || profile.weight} kg` : '--'}
                  </p>
                </div>
              </div>

              {(() => {
                const currentRiskClass = overview?.latestObesityClass || profile?.latestObesityClassification;
                const riskStyle = getRiskCardStyle(currentRiskClass);
                return (
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${riskStyle.iconBg}`}>
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Risk Classification</p>
                      <p className={`font-bold text-xs truncate mt-0.5 ${riskStyle.text}`}>
                        {formatObesityLabel(currentRiskClass)}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Next Consultation Info */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl border border-teal-100">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Next Scheduled Consultation</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {overview.nextAppointment 
                      ? `${new Date(overview.nextAppointment.date).toLocaleDateString()} at ${overview.nextAppointment.time || '10:00 AM'}`
                      : profile.nextAppointmentDate
                      ? `${new Date(profile.nextAppointmentDate).toLocaleDateString()} at ${profile.nextAppointmentTime || '10:00 AM'}`
                      : 'No upcoming consultation booked.'}
                  </p>
                </div>
              </div>
              {(overview.nextAppointment || profile.nextAppointmentDate) && (
                <Link to="/doctor/appointments" className="text-xs font-semibold text-teal-600 hover:text-teal-800">
                  View in Schedule →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ASSESSMENTS HISTORY */}
        {activeTab === 'assessments' && (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Historical AI Predictions</h3>
              <Link
                to={`/doctor/assessments/new?patient=${patient._id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Assessment</span>
              </Link>
            </div>

            {assessments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3.5">Assessment ID</th>
                      <th className="px-5 py-3.5">Date</th>
                      <th className="px-5 py-3.5">Calculated BMI</th>
                      <th className="px-5 py-3.5">Predicted Class</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assessments.map(a => (
                      <tr key={a._id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-semibold uppercase">
                            #{a._id.slice(-6).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{new Date(a.createdAt).toLocaleDateString()}</td>
                        <td className="px-5 py-3.5 font-bold text-slate-900">{a.bmi} kg/m²</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getObesityBadge(a.obesityClass)}`}>
                            {formatObesityLabel(a.obesityClass)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            to={`/doctor/assessments/${a._id}`}
                            className="text-xs font-semibold text-teal-600 hover:text-teal-800 hover:underline"
                          >
                            View Result →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                No past ML assessments recorded for this patient.
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MEAL PLAN */}
        {activeTab === 'meals' && (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Approved Nutritional Plan</h3>
            </div>

            {mealPlan ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 text-[11px]">Daily Calorie Target:</span>
                    <p className="text-sm font-bold text-teal-700 mt-0.5">{mealPlan.dailyCalorieTarget} kcal</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Total Protein:</span>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{mealPlan.totalProtein}g</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Status:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${
                      mealPlan.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {mealPlan.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Approved On:</span>
                    <p className="text-xs font-semibold text-slate-800 mt-0.5">
                      {mealPlan.approvedAt ? new Date(mealPlan.approvedAt).toLocaleDateString() : 'Draft'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Link
                    to={`/doctor/meals/${mealPlan._id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                  >
                    <Utensils className="w-4 h-4" />
                    <span>Open Full Meal Plan Builder</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                No meal plan generated yet.
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PROGRESS */}
        {activeTab === 'progress' && (
          <div className="space-y-6">
            {progressChartData.length > 0 ? (
              <>
                {/* Metric Highlights Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shrink-0">
                      <Scale className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Latest Weight</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-bold text-sm text-slate-900">{latestProgress.weight} kg</span>
                        {progressChartData.length > 1 && (
                          <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            totalWeightChange < 0 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : totalWeightChange > 0 
                              ? 'bg-amber-50 text-amber-700' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {totalWeightChange > 0 ? `+${totalWeightChange}` : totalWeightChange} kg
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Latest BMI</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-bold text-sm text-slate-900">{latestProgress.bmi}</span>
                        {progressChartData.length > 1 && (
                          <span className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            totalBmiChange < 0 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : totalBmiChange > 0 
                              ? 'bg-amber-50 text-amber-700' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {totalBmiChange > 0 ? `+${totalBmiChange}` : totalBmiChange}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                      {totalWeightChange < 0 ? (
                        <TrendingDown className="w-5 h-5" />
                      ) : totalWeightChange > 0 ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <Minus className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Overall Trend</p>
                      <p className="font-bold text-xs text-slate-900 mt-0.5">
                        {totalWeightChange < 0 
                          ? `${Math.abs(totalWeightChange)} kg Lost` 
                          : totalWeightChange > 0 
                          ? `${totalWeightChange} kg Gained` 
                          : 'Stable Weight'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-200 shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Tracking History</p>
                      <p className="font-bold text-xs text-slate-900 mt-0.5">
                        {progressChartData.length} logs recorded
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Chart Container */}
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Longitudinal Progress Curves</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Chronological progression timeline from {firstProgress?.displayDate} to {latestProgress?.displayDate}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => setProgressView('both')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          progressView === 'both' 
                            ? 'bg-white text-teal-700 shadow-xs' 
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Split View
                      </button>
                      <button
                        type="button"
                        onClick={() => setProgressView('weight')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          progressView === 'weight' 
                            ? 'bg-white text-teal-700 shadow-xs' 
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Weight Only
                      </button>
                      <button
                        type="button"
                        onClick={() => setProgressView('bmi')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          progressView === 'bmi' 
                            ? 'bg-white text-indigo-700 shadow-xs' 
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        BMI Only
                      </button>
                    </div>
                  </div>

                  {/* Render Charts according to view */}
                  {progressView === 'both' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                      {/* Weight Curve */}
                      <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Weight Journey (kg)</span>
                          </div>
                          <span className="text-xs font-bold text-teal-700">{latestProgress.weight} kg</span>
                        </div>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={progressChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                              <XAxis dataKey="displayDate" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                              <RechartsTooltip content={<CustomProgressTooltip />} />
                              <Area 
                                type="monotone" 
                                dataKey="weight" 
                                name="Weight" 
                                stroke="#0d9488" 
                                strokeWidth={2.5} 
                                fillOpacity={1} 
                                fill="url(#weightGradient)" 
                                dot={{ r: 4, fill: '#0d9488', strokeWidth: 2, stroke: '#ffffff' }}
                                activeDot={{ r: 6, fill: '#0d9488', stroke: '#ffffff', strokeWidth: 2 }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* BMI Curve */}
                      <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">BMI Progression</span>
                          </div>
                          <span className="text-xs font-bold text-indigo-700">{latestProgress.bmi} kg/m²</span>
                        </div>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={progressChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="bmiGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                              <XAxis dataKey="displayDate" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                              <RechartsTooltip content={<CustomProgressTooltip />} />
                              <Area 
                                type="monotone" 
                                dataKey="bmi" 
                                name="BMI" 
                                stroke="#6366f1" 
                                strokeWidth={2.5} 
                                fillOpacity={1} 
                                fill="url(#bmiGradient)" 
                                dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#ffffff' }}
                                activeDot={{ r: 6, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}

                  {progressView === 'weight' && (
                    <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Full Weight Trajectory (kg)</span>
                        </div>
                        <span className="text-xs font-bold text-teal-700">{latestProgress.weight} kg</span>
                      </div>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={progressChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                            <defs>
                              <linearGradient id="weightGradientFull" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <RechartsTooltip content={<CustomProgressTooltip />} />
                            <Area 
                              type="monotone" 
                              dataKey="weight" 
                              name="Weight" 
                              stroke="#0d9488" 
                              strokeWidth={2.5} 
                              fillOpacity={1} 
                              fill="url(#weightGradientFull)" 
                              dot={{ r: 4, fill: '#0d9488', strokeWidth: 2, stroke: '#ffffff' }}
                              activeDot={{ r: 6, fill: '#0d9488', stroke: '#ffffff', strokeWidth: 2 }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {progressView === 'bmi' && (
                    <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Full BMI Trajectory</span>
                        </div>
                        <span className="text-xs font-bold text-indigo-700">{latestProgress.bmi} kg/m²</span>
                      </div>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={progressChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                            <defs>
                              <linearGradient id="bmiGradientFull" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <RechartsTooltip content={<CustomProgressTooltip />} />
                            <Area 
                              type="monotone" 
                              dataKey="bmi" 
                              name="BMI" 
                              stroke="#6366f1" 
                              strokeWidth={2.5} 
                              fillOpacity={1} 
                              fill="url(#bmiGradientFull)" 
                              dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#ffffff' }}
                              activeDot={{ r: 6, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>

                {/* Historical Logs Table */}
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Historical Check-in Logs</h4>
                    <span className="text-[11px] text-slate-500 font-medium">{progressChartData.length} records</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                        <tr>
                          <th className="px-5 py-3.5">Date</th>
                          <th className="px-5 py-3.5">Weight (kg)</th>
                          <th className="px-5 py-3.5">Step Change</th>
                          <th className="px-5 py-3.5">BMI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[...progressChartData].reverse().map((p, index) => (
                          <tr key={p._id || index} className="hover:bg-slate-50/70">
                            <td className="px-5 py-3.5 font-medium text-slate-800">{p.fullDate}</td>
                            <td className="px-5 py-3.5 font-bold text-teal-700">{p.weight} kg</td>
                            <td className="px-5 py-3.5">
                              {p.weightChange !== 0 ? (
                                <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  p.weightChange < 0 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                  {p.weightChange > 0 ? `+${p.weightChange}` : p.weightChange} kg
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">--</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 font-semibold text-slate-700">{p.bmi} kg/m²</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 text-xs">
                <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-700 mb-1">No Progress Records Yet</p>
                <p>No historical weight or BMI tracking records available for this patient.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: CLINICAL NOTES */}
        {activeTab === 'notes' && (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Clinical Notes Timeline</h3>
            </div>

            {noteMessage.text && (
              <div className={`p-3.5 rounded-xl text-xs font-semibold border ${
                noteMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {noteMessage.text}
              </div>
            )}

            {/* Notes List */}
            <div className="space-y-3">
              {notes.length > 0 ? (
                notes.map(n => (
                  <div key={n._id} className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-900">Dr. {n.doctorId?.fullName || 'Clinician'}</span>
                      <span className="text-slate-400 text-[11px]">{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{n.note}</p>
                    
                    {n.doctorId?._id === loggedInUser._id && (
                      <div className="flex justify-end gap-2 pt-1 border-t border-slate-200/50">
                        <button
                          onClick={() => handleEditNote(n)}
                          className="text-[11px] font-semibold text-teal-600 hover:text-teal-800 cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteNote(n._id)}
                          className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">No clinical notes recorded yet.</div>
              )}
            </div>

            {/* Add / Edit Note Form */}
            <form onSubmit={submitNote} className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                {editingNoteId ? 'Edit Clinical Note' : 'Add New Clinical Note'}
              </h4>
              <textarea
                rows={3}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Write medical notes, clinical feedback, or observation logs..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                required
              />
              <div className="flex justify-end gap-2">
                {editingNoteId && (
                  <button
                    type="button"
                    onClick={() => { setEditingNoteId(null); setNewNote(''); }}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={savingNote}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {savingNote && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingNoteId ? 'Update Note' : 'Add Note'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
