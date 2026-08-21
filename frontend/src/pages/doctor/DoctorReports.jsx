import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import { FaFilePdf, FaFilter, FaSync, FaChartLine, FaSpinner } from 'react-icons/fa';
import { exportToPdf } from '../../utils/pdfExport';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DoctorReports() {
  const [reportType, setReportType] = useState('');
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

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await apiClient.get('/doctor/reports/patients');
      setPatients(res.data.data);
    } catch (err) {
      console.error('Failed to load patients for filter.');
    }
  };

  const handleClearFilters = () => {
    setPatientId('');
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
    const { healthInfo, assessments, appointments, doctorNotes } = reportData;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-slate-200 p-4 rounded-lg bg-white">
            <h4 className="font-bold text-slate-800 border-b pb-2 mb-3">Health Profile</h4>
            <ul className="text-sm space-y-2">
              <li><span className="text-slate-500">Latest Class:</span> {healthInfo.latestObesityClass.replace(/_/g, ' ')}</li>
              <li><span className="text-slate-500">Dietary Pref:</span> {healthInfo.dietaryPreference}</li>
              <li><span className="text-slate-500">Allergies:</span> {healthInfo.allergies?.length > 0 ? healthInfo.allergies.join(', ') : 'None'}</li>
              <li><span className="text-slate-500">Conditions:</span> {healthInfo.medicalConditions?.length > 0 ? healthInfo.medicalConditions.join(', ') : 'None'}</li>
            </ul>
          </div>
        </div>
        
        <h4 className="font-bold text-slate-800 border-b pb-2">Assessment History ({assessments.length})</h4>
        <table className="w-full text-sm text-left border border-slate-200 border-collapse">
          <thead className="bg-slate-100 border-b-2 border-slate-300">
            <tr>
              <th className="px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-slate-800 bg-slate-100 border-b border-slate-300">Date</th>
              <th className="px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-slate-800 bg-slate-100 border-b border-slate-300">Weight</th>
              <th className="px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-slate-800 bg-slate-100 border-b border-slate-300">BMI</th>
              <th className="px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-slate-800 bg-slate-100 border-b border-slate-300">Class</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {assessments.map(a => (
              <tr key={a._id} className="border-t border-slate-100">
                <td className="px-4 py-2 text-slate-700">{new Date(a.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2 font-medium text-slate-800">{a.weight} kg</td>
                <td className="px-4 py-2 text-slate-700">{a.bmi}</td>
                <td className="px-4 py-2 text-slate-700">{a.obesityClass.replace(/_/g, ' ')}</td>
              </tr>
            ))}
            {assessments.length === 0 && <tr><td colSpan="4" className="text-center py-4 text-slate-500">Not Available</td></tr>}
          </tbody>
        </table>

        <h4 className="font-bold text-slate-800 border-b pb-2">Appointments ({appointments.length})</h4>
        <table className="w-full text-sm text-left border border-slate-200 border-collapse">
          <thead className="bg-slate-100 border-b-2 border-slate-300">
            <tr>
              <th className="px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-slate-800 bg-slate-100 border-b border-slate-300">Date</th>
              <th className="px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-slate-800 bg-slate-100 border-b border-slate-300">Status</th>
              <th className="px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-slate-800 bg-slate-100 border-b border-slate-300">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {appointments.map(a => (
              <tr key={a._id} className="border-t border-slate-100">
                <td className="px-4 py-2 text-slate-700">{new Date(a.date).toLocaleDateString()}</td>
                <td className="px-4 py-2 capitalize"><span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-700">{a.status}</span></td>
                <td className="px-4 py-2 text-slate-700">{a.reason || 'Not Available'}</td>
              </tr>
            ))}
            {appointments.length === 0 && <tr><td colSpan="3" className="text-center py-4 text-slate-500">Not Available</td></tr>}
          </tbody>
        </table>
      </div>
    );
  };

  const renderAssessmentReport = () => {
    return (
      <div className="space-y-6">
        <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
          This prediction provides decision-support information and does not replace professional medical diagnosis.
        </p>
        
        {reportData.assessments.map(a => (
          <div key={a.assessmentId} className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm mb-4">
            <div className="flex justify-between items-center border-b pb-3 mb-3">
              <h4 className="font-bold text-indigo-900">{new Date(a.date).toLocaleDateString()} - {a.predictedObesityLevel.replace(/_/g, ' ')}</h4>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
              <div><span className="text-slate-500 block text-xs">Height</span><b>{a.height} m</b></div>
              <div><span className="text-slate-500 block text-xs">Weight</span><b>{a.weight} kg</b></div>
              <div><span className="text-slate-500 block text-xs">BMI</span><b>{a.bmi}</b></div>
            </div>

            <div className="mb-4">
              <h5 className="font-bold text-sm text-slate-700 mb-2">Model Inputs</h5>
              <div className="grid grid-cols-2 text-xs gap-y-2">
                <div><span className="text-slate-500">Frequent High-Calorie (FAVC):</span> {a.inputs.FAVC || 'N/A'}</div>
                <div><span className="text-slate-500">Vegetable Consumption (FCVC):</span> {a.inputs.FCVC || 'N/A'}</div>
                <div><span className="text-slate-500">Main Meals (NCP):</span> {a.inputs.NCP || 'N/A'}</div>
                <div><span className="text-slate-500">Water Consumption (CH2O):</span> {a.inputs.CH2O || 'N/A'}</div>
                <div><span className="text-slate-500">Physical Activity (FAF):</span> {a.inputs.FAF || 'N/A'}</div>
                <div><span className="text-slate-500">Technology Usage (TUE):</span> {a.inputs.TUE || 'N/A'}</div>
                <div><span className="text-slate-500">Food Between Meals (CAEC):</span> {a.inputs.CAEC || 'N/A'}</div>
                <div><span className="text-slate-500">Transportation (MTRANS):</span> {a.inputs.MTRANS || 'N/A'}</div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t text-sm">
              <span className="font-bold text-slate-700 block mb-1">Doctor Note:</span>
              <p className="bg-slate-50 p-2 rounded text-slate-600">{a.doctorNote}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMealPlanReport = () => {
    return (
      <div className="space-y-6">
        {reportData.plans.map(p => (
          <div key={p._id} className="border border-slate-200 rounded-lg p-6 bg-white shadow-sm mb-6">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <div>
                <h4 className="font-bold text-lg text-slate-900">Meal Plan ({new Date(p.createdAt).toLocaleDateString()})</h4>
                <p className="text-sm text-slate-500">Class: {p.obesityClass.replace(/_/g, ' ')}</p>
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded text-xs font-bold ${p.status === 'Draft' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {p.status.toUpperCase()}
                </span>
                {p.approvedAt && <p className="text-xs text-slate-500 mt-1">Approved: {new Date(p.approvedAt).toLocaleDateString()}</p>}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6 text-sm">
              <div className="bg-slate-50 p-3 rounded"><span className="text-slate-500 block text-xs">BMI</span><b>{p.bmi}</b></div>
              <div className="bg-slate-50 p-3 rounded"><span className="text-slate-500 block text-xs">BMR</span><b>{p.bmr} kcal</b></div>
              <div className="bg-slate-50 p-3 rounded"><span className="text-slate-500 block text-xs">TDEE</span><b>{p.tdee} kcal</b></div>
              <div className="bg-indigo-50 p-3 rounded"><span className="text-indigo-700 block text-xs">Daily Target</span><b>{p.dailyCalorieTarget} kcal</b></div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="border p-3 rounded">
                <h5 className="font-bold mb-2">Meals Total</h5>
                <p><b>{p.totalMealCalories} kcal</b> (Diff: {p.calorieDifference} kcal)</p>
              </div>
              <div className="border p-3 rounded">
                <h5 className="font-bold mb-2">Macros</h5>
                <p>P: {p.totalProtein}g | C: {p.totalCarbohydrates}g | F: {p.totalFat}g</p>
              </div>
            </div>

            <h5 className="font-bold text-slate-800 border-b pb-2 mb-3">Included Meals</h5>
            <div className="space-y-3 mb-6">
              {p.meals.map((m, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded text-sm flex justify-between">
                  <div>
                    <span className="font-bold">{m.mealType}:</span> {m.name}
                    <div className="text-xs text-slate-500 mt-1">Portion: {m.portionSize}</div>
                  </div>
                  <div className="font-bold text-indigo-700">{m.calories} kcal</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-bold text-slate-800 mb-1">Water Target</h5>
                <p className="bg-blue-50 p-2 rounded text-blue-800">{p.waterTarget || 'Not Available'}</p>
              </div>
              <div>
                <h5 className="font-bold text-slate-800 mb-1">Foods to Avoid</h5>
                <p className="bg-red-50 p-2 rounded text-red-800">{p.foodsToAvoid?.length > 0 ? p.foodsToAvoid.join(', ') : 'None'}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t text-sm">
              <h5 className="font-bold text-slate-800 mb-1">Exercise Recommendation</h5>
              <p className="bg-slate-50 p-2 rounded">{p.exerciseRecommendation || 'Not Available'}</p>
            </div>
            
            <div className="mt-4 pt-4 border-t text-sm">
              <h5 className="font-bold text-slate-800 mb-1">Doctor Instructions</h5>
              <p className="bg-indigo-50 p-3 rounded text-indigo-900 font-medium">{p.doctorInstructions || 'Not Available'}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderProgressReport = () => {
    const { history, latestWeight, weightChange, latestBmi, bmiChange } = reportData.progress;
    
    // Process charts data safely
    const chartData = history.map(h => ({
      date: new Date(h.date).toLocaleDateString(),
      weight: h.weight !== null ? h.weight : undefined,
      bmi: h.bmi
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="border border-slate-200 p-4 rounded-lg bg-slate-50 text-center">
            <span className="text-slate-500 block text-xs">Latest Weight</span>
            <span className="font-black text-xl text-slate-800">{latestWeight} {latestWeight !== 'Not Available' && 'kg'}</span>
          </div>
          <div className="border border-slate-200 p-4 rounded-lg bg-slate-50 text-center">
            <span className="text-slate-500 block text-xs">Weight Change</span>
            <span className={`font-black text-xl ${weightChange > 0 ? 'text-red-600' : weightChange < 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
              {weightChange > 0 ? '+' : ''}{weightChange} {weightChange !== 'Not Available' && 'kg'}
            </span>
          </div>
          <div className="border border-slate-200 p-4 rounded-lg bg-slate-50 text-center">
            <span className="text-slate-500 block text-xs">Latest BMI</span>
            <span className="font-black text-xl text-slate-800">{latestBmi}</span>
          </div>
          <div className="border border-slate-200 p-4 rounded-lg bg-slate-50 text-center">
            <span className="text-slate-500 block text-xs">BMI Change</span>
            <span className={`font-black text-xl ${bmiChange > 0 ? 'text-red-600' : bmiChange < 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
              {bmiChange > 0 ? '+' : ''}{bmiChange}
            </span>
          </div>
        </div>

        {chartData.length < 2 ? (
          <div className="bg-slate-50 border border-slate-200 p-8 text-center text-slate-500 rounded-lg">
            Insufficient progress data to display a trend.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border border-slate-200 p-4 rounded-lg bg-white h-64">
              <h4 className="font-bold text-sm text-center mb-4">BMI Trend</h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{fontSize: 10}} />
                  <YAxis tick={{fontSize: 10}} domain={['auto', 'auto']} />
                  <Tooltip />
                  <Line type="monotone" dataKey="bmi" stroke="#4f46e5" strokeWidth={2} dot={{r: 4}} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="border border-slate-200 p-4 rounded-lg bg-white h-64">
              <h4 className="font-bold text-sm text-center mb-4">Weight Trend (kg)</h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{fontSize: 10}} />
                  <YAxis tick={{fontSize: 10}} domain={['auto', 'auto']} />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="#059669" strokeWidth={2} dot={{r: 4}} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <h4 className="font-bold text-slate-800 border-b pb-2">Progress Records</h4>
        <table className="w-full text-sm text-left border border-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Source</th>
              <th className="px-4 py-2">Weight</th>
              <th className="px-4 py-2">BMI</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h, idx) => (
              <tr key={idx} className="border-t border-slate-200">
                <td className="px-4 py-2">{new Date(h.date).toLocaleDateString()}</td>
                <td className="px-4 py-2"><span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">{h.source}</span></td>
                <td className="px-4 py-2">{h.weight ? `${h.weight} kg` : 'Not Available'}</td>
                <td className="px-4 py-2">{h.bmi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <DashboardLayout role="doctor">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172033]">Reports</h1>
          <p className="text-sm text-[#64748B] mt-1">Generate comprehensive PDF reports for your assigned patients.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-3">
            <label htmlFor="reportTypeSelect" className="block font-bold text-slate-700 mb-3 border-b pb-2">
              1. Select Report Type
            </label>
            <select 
              id="reportTypeSelect"
              name="reportType"
              value={reportType} 
              onChange={e => setReportType(e.target.value)}
              className="w-full max-w-md p-2 border border-slate-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">-- Choose Report Type --</option>
              <option value="Patient Health Report">Patient Health Report</option>
              <option value="Obesity Assessment Report">Obesity Assessment Report</option>
              <option value="Meal Plan Report">Meal Plan Report</option>
              <option value="Patient Progress Report">Patient Progress Report</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <h3 className="font-bold text-slate-700 mb-3 border-b pb-2">2. Apply Filters</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="patientSelect" className="block text-xs text-slate-500 mb-1">
                  Patient <span className="text-red-500">*</span>
                </label>
                <select 
                  id="patientSelect"
                  name="patientId"
                  value={patientId} 
                  onChange={e => setPatientId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-indigo-500"
                >
                  <option value="">-- Select Patient --</option>
                  {patients.map(p => (
                    <option key={p.userId._id} value={p.userId._id}>{p.userId.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="fromDateInput" className="block text-xs text-slate-500 mb-1">From Date</label>
                <input 
                  id="fromDateInput"
                  name="fromDate"
                  type="date" 
                  value={fromDate} 
                  onChange={e => setFromDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="toDateInput" className="block text-xs text-slate-500 mb-1">To Date</label>
                <input 
                  id="toDateInput"
                  name="toDate"
                  type="date" 
                  value={toDate} 
                  onChange={e => setToDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-indigo-500"
                />
              </div>

              {reportType === 'Obesity Assessment Report' && (
                <div>
                  <label htmlFor="obesityClassSelect" className="block text-xs text-slate-500 mb-1">Obesity Class</label>
                  <select 
                    id="obesityClassSelect"
                    name="obesityClass"
                    value={obesityClass} 
                    onChange={e => setObesityClass(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-indigo-500"
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
                  <label htmlFor="mealPlanStatusSelect" className="block text-xs text-slate-500 mb-1">Plan Status</label>
                  <select 
                    id="mealPlanStatusSelect"
                    name="mealPlanStatus"
                    value={mealPlanStatus} 
                    onChange={e => setMealPlanStatus(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-indigo-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Approved">Approved</option>
                  </select>
                </div>
              )}

              {reportType === 'Patient Health Report' && (
                <div>
                  <label htmlFor="appointmentStatusSelect" className="block text-xs text-slate-500 mb-1">Appt Status</label>
                  <select 
                    id="appointmentStatusSelect"
                    name="appointmentStatus"
                    value={appointmentStatus} 
                    onChange={e => setAppointmentStatus(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-indigo-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3 border-t pt-4">
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition disabled:opacity-50"
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaChartLine />} Generate Report
          </button>
          <button 
            onClick={handleClearFilters}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2 rounded-lg font-medium transition"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg">
          {error}
        </div>
      )}

      {reportData && (
        <div className="bg-slate-50 border border-slate-300 p-8 rounded-xl shadow-inner relative overflow-hidden">
          <div className="absolute top-4 right-4 flex items-center gap-3">
            {downloading && <span className="text-indigo-600 text-sm font-bold animate-pulse">Generating PDF...</span>}
            <button 
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition shadow disabled:opacity-50"
            >
              <FaFilePdf /> Download as PDF
            </button>
          </div>

          <div id="report-pdf-content" className="bg-white p-10 max-w-4xl mx-auto shadow-sm border border-slate-200 text-slate-800">
            {/* Standard Header */}
            <div className="border-b-2 border-slate-800 pb-4 mb-6">
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-wider mb-2">Obesity Management System</h1>
              <h2 className="text-xl font-bold text-indigo-700">{reportData.reportType}</h2>
              
              <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
                <div>
                  <p><span className="font-bold w-24 inline-block">Patient ID:</span> {reportData.patientDetails.patientId.substring(reportData.patientDetails.patientId.length - 8).toUpperCase()}</p>
                  <p><span className="font-bold w-24 inline-block">Patient Name:</span> {reportData.patientDetails.fullName}</p>
                  <p><span className="font-bold w-24 inline-block">Age / Gender:</span> {reportData.patientDetails.age} / {reportData.patientDetails.gender}</p>
                </div>
                <div>
                  <p><span className="font-bold w-28 inline-block">Doctor:</span> Dr. {reportData.doctorName}</p>
                  <p><span className="font-bold w-28 inline-block">Generated:</span> {new Date(reportData.generatedDate).toLocaleString()}</p>
                  <p><span className="font-bold w-28 inline-block">Date Filter:</span> {fromDate || 'All'} to {toDate || 'All'}</p>
                </div>
              </div>
            </div>

            {/* Content Injection */}
            {reportData.reportType === 'Patient Health Report' && renderHealthReport()}
            {reportData.reportType === 'Obesity Assessment Report' && renderAssessmentReport()}
            {reportData.reportType === 'Meal Plan Report' && renderMealPlanReport()}
            {reportData.reportType === 'Patient Progress Report' && renderProgressReport()}

            {/* Standard Footer */}
            <div className="mt-12 pt-4 border-t border-slate-300 text-center text-xs text-slate-500">
              <p>CONFIDENTIAL MEDICAL REPORT • OBESITY MANAGEMENT SYSTEM</p>
              <p className="mt-1">Generated electronically by Dr. {reportData.doctorName} on {new Date(reportData.generatedDate).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
