import React, { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import { exportToPdf } from '../../utils/pdfExport';
import {
  FileSpreadsheet,
  FileDown,
  Filter,
  RotateCcw,
  Loader2,
  TrendingUp,
  HeartPulse,
  Activity,
  Utensils
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PatientReports() {
  const [reportType, setReportType] = useState('Personal Health Report');
  
  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [obesityClass, setObesityClass] = useState('');
  const [mealPlanStatus, setMealPlanStatus] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

  const reportTypes = [
    { id: 'Personal Health Report', label: 'Personal Health Report', icon: HeartPulse, desc: 'Overall medical & clinical summary' },
    { id: 'Obesity Assessment Report', label: 'Obesity Assessment Report', icon: Activity, desc: 'AI predictions & evaluations' },
    { id: 'Meal Plan Report', label: 'Meal Plan Report', icon: Utensils, desc: 'Active nutrition targets & meal schedule' },
    { id: 'Progress Report', label: 'Progress Report', icon: TrendingUp, desc: 'Longitudinal weight & BMI tracking' }
  ];

  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setObesityClass('');
    setMealPlanStatus('');
    setReportData(null);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!reportType) {
      setError("Please select a Report Type.");
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
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
        ...(obesityClass && { obesityClass }),
        ...(mealPlanStatus && { mealPlanStatus })
      });

      const res = await apiClient.get(`/patient/reports/generate?${params.toString()}`);
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
      const filename = `${safeTitle}_${safeDate}.pdf`;
      
      await exportToPdf('report-pdf-content', { 
        filename,
        margin: 0.4,
        jsPDF: { format: 'a4', orientation: 'portrait' }
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const renderHealthReport = () => {
    const { healthInfo, assessments, appointments } = reportData;
    return (
      <div className="space-y-6 text-xs">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h4 className="font-bold text-slate-800 border-b pb-2 mb-3 uppercase tracking-wide">Health Baseline</h4>
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-slate-500 block text-[10px]">Latest Class:</span> <b className="text-teal-700">{healthInfo.latestObesityClass ? healthInfo.latestObesityClass.replace(/_/g, ' ') : 'Unassessed'}</b></div>
            <div><span className="text-slate-500 block text-[10px]">Medical Conditions:</span> <b className="text-slate-800">{healthInfo.medicalConditions?.length > 0 ? healthInfo.medicalConditions.join(', ') : 'None'}</b></div>
          </div>
        </div>
        
        <div>
          <h4 className="font-bold text-slate-800 border-b pb-2 mb-3 uppercase tracking-wide">Assessment History ({assessments.length})</h4>
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
                  <td className="px-3 py-2 font-semibold text-teal-700">{a.obesityClass ? a.obesityClass.replace(/_/g, ' ') : 'N/A'}</td>
                </tr>
              ))}
              {assessments.length === 0 && <tr><td colSpan="4" className="text-center py-4 text-slate-400">No assessments on record.</td></tr>}
            </tbody>
          </table>
        </div>

        <div>
          <h4 className="font-bold text-slate-800 border-b pb-2 mb-3 uppercase tracking-wide">Appointment History ({appointments.length})</h4>
          <table className="w-full text-xs text-left border border-slate-200 border-collapse">
            <thead className="bg-slate-100 border-b border-slate-300">
              <tr>
                <th className="px-3 py-2 font-bold uppercase text-slate-700">Date</th>
                <th className="px-3 py-2 font-bold uppercase text-slate-700">Status</th>
                <th className="px-3 py-2 font-bold uppercase text-slate-700">Attending Doctor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {appointments.map(a => (
                <tr key={a._id}>
                  <td className="px-3 py-2 text-slate-700">{new Date(a.date).toLocaleDateString()}</td>
                  <td className="px-3 py-2 capitalize font-semibold text-teal-700">{a.status}</td>
                  <td className="px-3 py-2 text-slate-800">Dr. {a.doctorId?.fullName || 'Specialist'}</td>
                </tr>
              ))}
              {appointments.length === 0 && <tr><td colSpan="3" className="text-center py-4 text-slate-400">No appointments recorded.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAssessmentReport = () => {
    return (
      <div className="space-y-6 text-xs">
        <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200 text-center font-semibold">
          Notice: This prediction provides decision-support information and does not replace professional medical diagnosis.
        </p>
        
        {reportData.assessments.map(a => (
          <div key={a.assessmentId} className="border border-slate-200 rounded-xl p-5 bg-white shadow-2xs space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <h4 className="font-bold text-sm text-slate-900">{new Date(a.date).toLocaleDateString()}</h4>
                <p className="text-slate-500">Dr. {a.doctorName}</p>
              </div>
              <div>
                <span className="font-bold text-teal-700 capitalize text-sm">{a.predictedObesityLevel ? a.predictedObesityLevel.replace(/_/g, ' ') : 'N/A'}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg text-center">
              <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Height</span><b>{a.height} cm</b></div>
              <div><span className="text-slate-400 block text-[10px] uppercase font-bold">Weight</span><b>{a.weight} kg</b></div>
              <div><span className="text-slate-400 block text-[10px] uppercase font-bold">BMI</span><b className="text-teal-700">{a.bmi}</b></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMealPlanReport = () => {
    return (
      <div className="space-y-6 text-xs">
        {reportData.plans.map(p => (
          <div key={p._id} className="border border-slate-200 rounded-xl p-5 bg-white shadow-2xs space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900">Approved Nutrition Plan</h4>
                <p className="text-slate-500">Dr. {p.doctorId?.fullName || 'Assigned Specialist'}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {p.status.toUpperCase()}
                </span>
                {p.approvedAt && <p className="text-[10px] text-slate-400 mt-0.5">Approved: {new Date(p.approvedAt).toLocaleDateString()}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Calories</span>
                <b className="text-lg text-teal-700">{p.dailyCalorieTarget} kcal</b>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Selected Meals</span>
                <b className="text-lg text-slate-800">{p.totalCalories} kcal</b>
              </div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg text-center font-medium text-slate-700">
              Protein: {p.totalProtein}g • Carbs: {p.totalCarbs}g • Fat: {p.totalFat}g • Fiber: {p.totalFiber}g
            </div>

            <div className="space-y-2">
              <h5 className="font-bold uppercase tracking-wide text-slate-800">Included Meals</h5>
              {p.meals.map((m, idx) => (
                <div key={idx} className="bg-slate-50 p-2.5 rounded-lg flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900">{m.mealType}:</span> {m.name}
                    <div className="text-[10px] text-slate-400">Portion: {m.portionSize}</div>
                  </div>
                  <div className="font-bold text-teal-700">{m.calories} kcal</div>
                </div>
              ))}
            </div>

            {p.doctorInstructions && (
              <div className="pt-2 border-t border-slate-100">
                <h5 className="font-bold text-slate-800 mb-1">Doctor Instructions</h5>
                <p className="bg-teal-50/70 p-2.5 rounded-lg text-teal-950 font-medium">{p.doctorInstructions}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderProgressReport = () => {
    const { history, startingWeight, latestWeight, weightChange, totalRecords } = reportData.progress;
    
    const chartData = history.map(h => ({
      date: new Date(h.date).toLocaleDateString(),
      weight: h.weight,
      bmi: h.bmi
    }));

    return (
      <div className="space-y-6 text-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="border border-slate-200 p-3 rounded-xl bg-slate-50">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Starting Weight</span>
            <span className="font-bold text-base text-slate-800">{startingWeight} kg</span>
          </div>
          <div className="border border-slate-200 p-3 rounded-xl bg-slate-50">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Latest Weight</span>
            <span className="font-bold text-base text-teal-700">{latestWeight} kg</span>
          </div>
          <div className="border border-slate-200 p-3 rounded-xl bg-slate-50">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Net Weight Change</span>
            <span className={`font-bold text-base ${weightChange > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {weightChange > 0 ? '+' : ''}{weightChange} kg
            </span>
          </div>
          <div className="border border-slate-200 p-3 rounded-xl bg-slate-50">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Total Logs</span>
            <span className="font-bold text-base text-slate-800">{totalRecords}</span>
          </div>
        </div>

        {chartData.length >= 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border border-slate-200 p-4 rounded-xl bg-white h-60">
              <h4 className="font-bold text-[11px] text-center mb-2 uppercase text-slate-700">Weight Journey (kg)</h4>
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
            
            <div className="border border-slate-200 p-4 rounded-xl bg-white h-60">
              <h4 className="font-bold text-[11px] text-center mb-2 uppercase text-slate-700">BMI Trend</h4>
              <ResponsiveContainer width="100%" height="85%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{fontSize: 10}} />
                  <YAxis tick={{fontSize: 10}} domain={['auto', 'auto']} />
                  <Tooltip />
                  <Line type="monotone" dataKey="bmi" stroke="#6366f1" strokeWidth={2} dot={{r: 3}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div>
          <h4 className="font-bold text-slate-800 border-b pb-2 mb-3 uppercase tracking-wide">Historical Log Records</h4>
          <table className="w-full text-xs text-left border border-slate-200">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2 font-bold uppercase text-slate-700">Date</th>
                <th className="px-3 py-2 font-bold uppercase text-slate-700">Weight</th>
                <th className="px-3 py-2 font-bold uppercase text-slate-700">BMI</th>
                <th className="px-3 py-2 font-bold uppercase text-slate-700">Adherence</th>
                <th className="px-3 py-2 font-bold uppercase text-slate-700">Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {history.map((h, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2 text-slate-700">{new Date(h.date).toLocaleDateString()}</td>
                  <td className="px-3 py-2 font-bold text-slate-900">{h.weight} kg</td>
                  <td className="px-3 py-2 text-slate-700">{h.bmi}</td>
                  <td className="px-3 py-2 text-slate-700">{h.mealAdherence}</td>
                  <td className="px-3 py-2 text-slate-700">{h.physicalActivity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout role="patient">
      <div className="space-y-6 pb-12">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Personal Health Reports</h1>
                <p className="text-xs text-slate-500 mt-0.5">Generate exportable clinical summaries and longitudinal tracking records.</p>
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
              Report Parameters (Optional)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
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
                    <p><span className="font-bold text-slate-500 w-24 inline-block">Patient:</span> <b>{reportData.patientDetails.fullName}</b></p>
                    <p><span className="font-bold text-slate-500 w-24 inline-block">Demographics:</span> {reportData.patientDetails.age} yrs • {reportData.patientDetails.gender}</p>
                  </div>
                  <div>
                    <p><span className="font-bold text-slate-500 w-28 inline-block">Assigned Doctor:</span> Dr. {reportData.patientDetails.assignedDoctor}</p>
                    <p><span className="font-bold text-slate-500 w-28 inline-block">Generated:</span> {new Date(reportData.generatedDate).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Dynamic Content */}
              {reportData.reportType === 'Personal Health Report' && renderHealthReport()}
              {reportData.reportType === 'Obesity Assessment Report' && renderAssessmentReport()}
              {reportData.reportType === 'Meal Plan Report' && renderMealPlanReport()}
              {reportData.reportType === 'Progress Report' && renderProgressReport()}

              {/* Footer */}
              <div className="mt-10 pt-4 border-t border-slate-300 text-center text-[10px] text-slate-400">
                <p>CONFIDENTIAL PERSONAL MEDICAL SUMMARY • SMARTOBESITY AI HEALTHCARE SYSTEM</p>
                <p className="mt-0.5">Generated electronically for {reportData.patientDetails.fullName} on {new Date(reportData.generatedDate).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
