import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import {
  FileSpreadsheet,
  FileDown,
  Filter,
  Loader2,
  TrendingUp,
  HeartPulse,
  Activity,
  Utensils,
  RotateCcw
} from 'lucide-react';
import { exportToPdf } from '../../utils/pdfExport';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DoctorReports() {
  const [reportType, setReportType] = useState('Patient Health Report');
  const [patients, setPatients] = useState([]);
  
  // Filters
  const [patientId, setPatientId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [obesityClass, setObesityClass] = useState('');
  const [mealPlanStatus, setMealPlanStatus] = useState('');
  const [appointmentStatus, setAppointmentStatus] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

  const reportTypes = [
    { id: 'Patient Health Report', label: 'Patient Health Report', icon: HeartPulse, desc: 'Overall medical & clinical summary' },
    { id: 'Obesity Assessment Report', label: 'Obesity Assessment Report', icon: Activity, desc: 'AI predictions & ML factors' },
    { id: 'Meal Plan Report', label: 'Meal Plan Report', icon: Utensils, desc: 'Prescribed diets & caloric targets' },
    { id: 'Patient Progress Report', label: 'Patient Progress Report', icon: TrendingUp, desc: 'Weight & BMI longitudinal tracking' }
  ];

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await apiClient.get('/doctor/reports/patients');
      setPatients(res.data.data);
      if (res.data.data.length > 0) {
        setPatientId(res.data.data[0].userId._id);
      }
    } catch {
      console.error('Failed to load patients for filter.');
    }
  };

  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setObesityClass('');
    setMealPlanStatus('');
    setAppointmentStatus('');
    setReportData(null);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!reportType) {
      setError("Please select a Report Type.");
      return;
    }
    if (!patientId) {
      setError("Patient selection is required for this report.");
      return;
    }
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      setError("From Date cannot be after To Date.");
      return;
    }

    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      const params = new URLSearchParams({
        reportType,
        patientId,
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
        ...(obesityClass && { obesityClass }),
        ...(mealPlanStatus && { mealPlanStatus }),
        ...(appointmentStatus && { appointmentStatus })
      });

      const res = await apiClient.get(`/doctor/reports/generate?${params.toString()}`);
      setReportData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const safeDate = new Date().toISOString().split('T')[0];
      const safeTitle = reportType.replace(/\s+/g, '_');
      const filename = `${safeTitle}_${reportData.patientDetails?.patientId?.substring(reportData.patientDetails.patientId.length - 6)}_${safeDate}.pdf`;
      
      await exportToPdf('report-pdf-content', { 
        filename,
        margin: 0.4,
        jsPDF: { format: 'a4', orientation: 'portrait' }
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const renderHealthReport = () => {
    const { healthInfo, assessments, appointments } = reportData;
    return (
      <div className="space-y-6">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h4 className="font-bold text-slate-800 border-b pb-2 mb-3 text-xs uppercase tracking-wide">Patient Clinical Baseline</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div><span className="text-slate-500 block text-[11px]">Latest Class:</span> <b className="text-rose-600">{healthInfo.latestObesityClass ? healthInfo.latestObesityClass.replace(/_/g, ' ') : 'N/A'}</b></div>
            <div><span className="text-slate-500 block text-[11px]">Dietary Style:</span> <b className="text-slate-800">{healthInfo.dietaryPreference || 'Standard'}</b></div>
            <div><span className="text-slate-500 block text-[11px]">Allergies:</span> <b className="text-slate-800">{healthInfo.allergies?.length > 0 ? healthInfo.allergies.join(', ') : 'None'}</b></div>
            <div><span className="text-slate-500 block text-[11px]">Medical Conditions:</span> <b className="text-slate-800">{healthInfo.medicalConditions?.length > 0 ? healthInfo.medicalConditions.join(', ') : 'None'}</b></div>
          </div>
        </div>
        
        <div>
          <h4 className="font-bold text-slate-800 border-b pb-2 mb-3 text-xs uppercase tracking-wide">Assessment History ({assessments.length})</h4>
          <table className="w-full text-xs text-left border border-slate-200 border-collapse">
            <thead className="bg-slate-100 border-b border-slate-300">
              <tr>
                <th className="px-3 py-2 font-bold uppercase text-slate-700">Date</th>
                <th className="px-3 py-2 font-bold uppercase text-slate-700">Weight</th>
                <th className="px-3 py-2 font-bold uppercase text-slate-700">BMI</th>
                <th className="px-3 py-2 font-bold uppercase text-slate-700">Class</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {assessments.map(a => (
                <tr key={a._id}>
                  <td className="px-3 py-2 text-slate-700">{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2 font-bold text-slate-900">{a.weight} kg</td>
                  <td className="px-3 py-2 text-slate-700">{a.bmi}</td>
                  <td className="px-3 py-2 font-semibold text-rose-600">{a.obesityClass ? a.obesityClass.replace(/_/g, ' ') : 'N/A'}</td>
                </tr>
              ))}
              {assessments.length === 0 && <tr><td colSpan="4" className="text-center py-4 text-slate-400">No assessments on record.</td></tr>}
            </tbody>
          </table>
        </div>

        <div>
          <h4 className="font-bold text-slate-800 border-b pb-2 mb-3 text-xs uppercase tracking-wide">Consultation History ({appointments.length})</h4>
          <table className="w-full text-xs text-left border border-slate-200 border-collapse">
            <thead className="bg-slate-100 border-b border-slate-300">
              <tr>
                <th className="px-3 py-2 font-bold uppercase text-slate-700">Date</th>
                <th className="px-3 py-2 font-bold uppercase text-slate-700">Status</th>
                <th className="px-3 py-2 font-bold uppercase text-slate-700">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {appointments.map(a => (
                <tr key={a._id}>
                  <td className="px-3 py-2 text-slate-700">{new Date(a.date).toLocaleDateString()}</td>
                  <td className="px-3 py-2 capitalize font-semibold text-teal-700">{a.status}</td>
                  <td className="px-3 py-2 text-slate-600">{a.reason || 'General Consultation'}</td>
                </tr>
              ))}
              {appointments.length === 0 && <tr><td colSpan="3" className="text-center py-4 text-slate-400">No appointments on record.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAssessmentReport = () => {
    return (
      <div className="space-y-6">
        <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
          This prediction provides decision-support information based on a Random Forest machine learning model and does not replace professional medical diagnosis.
        </p>
        
        {reportData.assessments.map(a => (
          <div key={a.assessmentId} className="border border-slate-200 rounded-xl p-5 bg-white shadow-2xs space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-bold text-slate-900 text-sm">{new Date(a.date).toLocaleDateString()} — {a.predictedObesityLevel ? a.predictedObesityLevel.replace(/_/g, ' ') : 'N/A'}</h4>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-100">BMI: {a.bmi}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-xs bg-slate-50 p-3 rounded-lg">
              <div><span className="text-slate-500 block text-[10px]">Height:</span><b>{a.height} m</b></div>
              <div><span className="text-slate-500 block text-[10px]">Weight:</span><b>{a.weight} kg</b></div>
              <div><span className="text-slate-500 block text-[10px]">BMI:</span><b>{a.bmi}</b></div>
            </div>

            <div>
              <h5 className="font-bold text-xs text-slate-800 mb-1.5 uppercase tracking-wide">Key Features Submitted</h5>
              <div className="grid grid-cols-2 text-xs gap-y-1 text-slate-600">
                <div><span>High-Calorie (FAVC):</span> <b className="text-slate-800">{a.inputs.FAVC || 'N/A'}</b></div>
                <div><span>Vegetables (FCVC):</span> <b className="text-slate-800">{a.inputs.FCVC || 'N/A'}</b></div>
                <div><span>Meals / Day (NCP):</span> <b className="text-slate-800">{a.inputs.NCP || 'N/A'}</b></div>
                <div><span>Water Intake (CH2O):</span> <b className="text-slate-800">{a.inputs.CH2O || 'N/A'}</b></div>
                <div><span>Physical Activity (FAF):</span> <b className="text-slate-800">{a.inputs.FAF || 'N/A'}</b></div>
                <div><span>Screen Time (TUE):</span> <b className="text-slate-800">{a.inputs.TUE || 'N/A'}</b></div>
              </div>
            </div>

            {a.doctorNote && (
              <div className="pt-2 border-t border-slate-100 text-xs">
                <span className="font-bold text-slate-700 block mb-1">Doctor Note:</span>
                <p className="bg-slate-50 p-2.5 rounded-lg text-slate-700">{a.doctorNote}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderMealPlanReport = () => {
    return (
      <div className="space-y-6">
        {reportData.plans.map(p => (
          <div key={p._id} className="border border-slate-200 rounded-xl p-5 bg-white shadow-2xs space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900">Meal Plan ({new Date(p.createdAt).toLocaleDateString()})</h4>
                <p className="text-xs text-slate-500">Target Class: {p.obesityClass ? p.obesityClass.replace(/_/g, ' ') : 'N/A'}</p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  p.status === 'Draft' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {p.status}
                </span>
                {p.approvedAt && <p className="text-[10px] text-slate-400 mt-0.5">Approved: {new Date(p.approvedAt).toLocaleDateString()}</p>}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg"><span className="text-slate-500 block text-[10px]">BMI</span><b>{p.bmi}</b></div>
              <div className="bg-slate-50 p-2.5 rounded-lg"><span className="text-slate-500 block text-[10px]">BMR</span><b>{p.bmr} kcal</b></div>
              <div className="bg-slate-50 p-2.5 rounded-lg"><span className="text-slate-500 block text-[10px]">TDEE</span><b>{p.tdee} kcal</b></div>
              <div className="bg-teal-50 p-2.5 rounded-lg text-teal-900 border border-teal-100"><span className="text-teal-600 block text-[10px]">Daily Target</span><b>{p.dailyCalorieTarget} kcal</b></div>
            </div>

            <div className="space-y-2">
              <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wide">Included Meals</h5>
              {p.meals.map((m, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-lg text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900">{m.mealType}:</span> {m.name}
                    <div className="text-[11px] text-slate-400">Portion: {m.portionSize}</div>
                  </div>
                  <div className="font-bold text-teal-700">{m.calories} kcal</div>
                </div>
              ))}
            </div>

            {p.doctorInstructions && (
              <div className="pt-2 border-t border-slate-100 text-xs">
                <h5 className="font-bold text-slate-800 mb-1">Doctor Instructions</h5>
                <p className="bg-teal-50/70 p-3 rounded-lg text-teal-950 font-medium">{p.doctorInstructions}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderProgressReport = () => {
    const { history, latestWeight, weightChange, latestBmi, bmiChange } = reportData.progress;
    
    const chartData = history.map(h => ({
      date: new Date(h.date).toLocaleDateString(),
      weight: h.weight !== null ? h.weight : undefined,
      bmi: h.bmi
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="border border-slate-200 p-3 rounded-xl bg-slate-50">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Latest Weight</span>
            <span className="font-bold text-lg text-slate-900">{latestWeight} {latestWeight !== 'Not Available' && 'kg'}</span>
          </div>
          <div className="border border-slate-200 p-3 rounded-xl bg-slate-50">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Weight Change</span>
            <span className={`font-bold text-lg ${weightChange > 0 ? 'text-rose-600' : weightChange < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
              {weightChange > 0 ? '+' : ''}{weightChange} {weightChange !== 'Not Available' && 'kg'}
            </span>
          </div>
          <div className="border border-slate-200 p-3 rounded-xl bg-slate-50">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Latest BMI</span>
            <span className="font-bold text-lg text-slate-900">{latestBmi}</span>
          </div>
          <div className="border border-slate-200 p-3 rounded-xl bg-slate-50">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">BMI Change</span>
            <span className={`font-bold text-lg ${bmiChange > 0 ? 'text-rose-600' : bmiChange < 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
              {bmiChange > 0 ? '+' : ''}{bmiChange}
            </span>
          </div>
        </div>

        {chartData.length >= 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border border-slate-200 p-4 rounded-xl bg-white h-60">
              <h4 className="font-bold text-xs text-center mb-2 uppercase text-slate-700">BMI Trend</h4>
              <ResponsiveContainer width="100%" height="85%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{fontSize: 10}} />
                  <YAxis tick={{fontSize: 10}} domain={['auto', 'auto']} />
                  <Tooltip />
                  <Line type="monotone" dataKey="bmi" stroke="#4f46e5" strokeWidth={2} dot={{r: 3}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="border border-slate-200 p-4 rounded-xl bg-white h-60">
              <h4 className="font-bold text-xs text-center mb-2 uppercase text-slate-700">Weight Trend (kg)</h4>
              <ResponsiveContainer width="100%" height="85%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{fontSize: 10}} />
                  <YAxis tick={{fontSize: 10}} domain={['auto', 'auto']} />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="#0d9488" strokeWidth={2} dot={{r: 3}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div>
          <h4 className="font-bold text-slate-800 border-b pb-2 mb-3 text-xs uppercase tracking-wide">Progress Log Table</h4>
          <table className="w-full text-xs text-left border border-slate-200">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2 font-bold uppercase text-slate-700">Date</th>
                <th className="px-3 py-2 font-bold uppercase text-slate-700">Source</th>
                <th className="px-3 py-2 font-bold uppercase text-slate-700">Weight</th>
                <th className="px-3 py-2 font-bold uppercase text-slate-700">BMI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {history.map((h, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2 text-slate-700">{new Date(h.date).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-slate-500 capitalize">{h.source}</td>
                  <td className="px-3 py-2 font-bold text-slate-900">{h.weight ? `${h.weight} kg` : 'N/A'}</td>
                  <td className="px-3 py-2 text-slate-700">{h.bmi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-6 pb-12">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Clinical Reports & Exports</h1>
                <p className="text-xs text-slate-500 mt-0.5">Generate longitudinal patient reports, ML assessments, and dietary audit files.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Report Type Selector Tabs / Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
          {reportTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = reportType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => { setReportType(type.id); setReportData(null); }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-900/20 ring-2 ring-teal-600/30'
                    : 'bg-white border-slate-100 text-slate-800 hover:border-slate-200 hover:bg-slate-50/50 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-teal-50 text-teal-600'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-teal-200 ring-4 ring-white/20"></span>
                  )}
                </div>
                <div>
                  <h3 className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>{type.label}</h3>
                  <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-teal-100' : 'text-slate-500'}`}>{type.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Filters Card */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 sm:p-6 no-print space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Filter className="w-4 h-4 text-teal-600" />
              Report Parameters & Filters
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Select Patient <span className="text-rose-500">*</span>
              </label>
              <select 
                value={patientId} 
                onChange={e => setPatientId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
              >
                <option value="">-- Choose Patient --</option>
                {patients.map(p => (
                  <option key={p.userId._id} value={p.userId._id}>{p.userId.fullName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">From Date</label>
              <input 
                type="date" 
                value={fromDate} 
                onChange={e => setFromDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">To Date</label>
              <input 
                type="date" 
                value={toDate} 
                onChange={e => setToDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            {reportType === 'Obesity Assessment Report' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Obesity Class</label>
                <select 
                  value={obesityClass} 
                  onChange={e => setObesityClass(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
                >
                  <option value="">All Classes</option>
                  <option value="Insufficient_Weight">Insufficient Weight</option>
                  <option value="Normal_Weight">Normal Weight</option>
                  <option value="Overweight_Level_I">Overweight Level I</option>
                  <option value="Overweight_Level_II">Overweight Level II</option>
                  <option value="Obesity_Type_I">Obesity Type I</option>
                  <option value="Obesity_Type_II">Obesity Type II</option>
                  <option value="Obesity_Type_III">Obesity Type III</option>
                </select>
              </div>
            )}

            {reportType === 'Meal Plan Report' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Plan Status</label>
                <select 
                  value={mealPlanStatus} 
                  onChange={e => setMealPlanStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Approved">Approved</option>
                </select>
              </div>
            )}

            {reportType === 'Patient Health Report' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Appt Status</label>
                <select 
                  value={appointmentStatus} 
                  onChange={e => setAppointmentStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button 
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
            <button 
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
              <span>Generate Report</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Report Output Preview */}
        {reportData && (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center no-print">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Report Document Preview</h3>
              <button 
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                <span>{downloading ? 'Preparing PDF...' : 'Download as PDF'}</span>
              </button>
            </div>

            <div id="report-pdf-content" className="p-8 max-w-4xl mx-auto bg-white text-slate-800">
              {/* Document Header */}
              <div className="border-b-2 border-slate-800 pb-4 mb-6 text-center sm:text-left">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">SmartObesity AI Healthcare System</h1>
                <h2 className="text-base font-bold text-teal-700 mt-0.5">{reportData.reportType}</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <p><span className="font-bold text-slate-500 w-24 inline-block">Patient ID:</span> #{reportData.patientDetails.patientId.substring(reportData.patientDetails.patientId.length - 6).toUpperCase()}</p>
                    <p><span className="font-bold text-slate-500 w-24 inline-block">Patient Name:</span> <b>{reportData.patientDetails.fullName}</b></p>
                    <p><span className="font-bold text-slate-500 w-24 inline-block">Demographics:</span> {reportData.patientDetails.age} yrs • {reportData.patientDetails.gender}</p>
                  </div>
                  <div>
                    <p><span className="font-bold text-slate-500 w-24 inline-block">Clinician:</span> Dr. {reportData.doctorName}</p>
                    <p><span className="font-bold text-slate-500 w-24 inline-block">Generated:</span> {new Date(reportData.generatedDate).toLocaleString()}</p>
                    <p><span className="font-bold text-slate-500 w-24 inline-block">Date Range:</span> {fromDate || 'Start'} to {toDate || 'Present'}</p>
                  </div>
                </div>
              </div>

              {/* Dynamic Content */}
              {reportData.reportType === 'Patient Health Report' && renderHealthReport()}
              {reportData.reportType === 'Obesity Assessment Report' && renderAssessmentReport()}
              {reportData.reportType === 'Meal Plan Report' && renderMealPlanReport()}
              {reportData.reportType === 'Patient Progress Report' && renderProgressReport()}

              {/* Footer */}
              <div className="mt-10 pt-4 border-t border-slate-300 text-center text-[10px] text-slate-400">
                <p>CONFIDENTIAL CLINICAL REPORT • SMARTOBESITY AI CLINICAL DECISION SUPPORT SYSTEM</p>
                <p className="mt-0.5">Electronically verified by Dr. {reportData.doctorName} on {new Date(reportData.generatedDate).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
