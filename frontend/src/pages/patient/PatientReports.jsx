import React, { useState } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import { exportToPdf } from '../../utils/pdfExport';
import { FaFilePdf, FaFilter, FaSync, FaChartLine, FaSpinner, FaEye, FaDownload } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PatientReports() {
  const [reportType, setReportType] = useState('');
  
  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [obesityClass, setObesityClass] = useState('');
  const [mealPlanStatus, setMealPlanStatus] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

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
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-slate-200 p-4 rounded-lg bg-white col-span-2">
            <h4 className="font-bold text-slate-800 border-b pb-2 mb-3">Health Profile</h4>
            <ul className="text-sm space-y-2 grid grid-cols-2">
              <li><span className="text-slate-500">Latest Class:</span> {healthInfo.latestObesityClass.replace(/_/g, ' ')}</li>
              <li><span className="text-slate-500">Medical Conditions:</span> {healthInfo.medicalConditions?.length > 0 ? healthInfo.medicalConditions.join(', ') : 'None'}</li>
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

        <h4 className="font-bold text-slate-800 border-b pb-2">Appointment History ({appointments.length})</h4>
        <table className="w-full text-sm text-left border border-slate-200 border-collapse">
          <thead className="bg-slate-100 border-b-2 border-slate-300">
            <tr>
              <th className="px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-slate-800 bg-slate-100 border-b border-slate-300">Date</th>
              <th className="px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-slate-800 bg-slate-100 border-b border-slate-300">Status</th>
              <th className="px-4 py-2.5 font-bold text-xs uppercase tracking-wider text-slate-800 bg-slate-100 border-b border-slate-300">Doctor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {appointments.map(a => (
              <tr key={a._id} className="border-t border-slate-100">
                <td className="px-4 py-2 text-slate-700">{new Date(a.date).toLocaleDateString()}</td>
                <td className="px-4 py-2 capitalize"><span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-700">{a.status}</span></td>
                <td className="px-4 py-2 text-slate-700">Dr. {a.doctorId?.fullName || 'Unknown'}</td>
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
        <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 font-bold text-center">
          Disclaimer: This prediction provides decision-support information and does not replace professional medical diagnosis.
        </p>
        
        {reportData.assessments.map(a => (
          <div key={a.assessmentId} className="border border-slate-200 rounded-lg p-6 bg-white shadow-sm mb-4">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <div>
                <h4 className="font-bold text-lg text-slate-900">{new Date(a.date).toLocaleDateString()}</h4>
                <p className="text-sm text-slate-600">Assessed by: Dr. {a.doctorName}</p>
              </div>
              <div className="text-right">
                <span className="block text-lg font-black text-indigo-700 capitalize">{a.predictedObesityLevel.replace(/_/g, ' ')}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4 bg-slate-50 p-4 rounded text-center">
              <div><span className="text-slate-500 block text-xs font-bold uppercase mb-1">Height</span><b className="text-xl">{a.height} cm</b></div>
              <div><span className="text-slate-500 block text-xs font-bold uppercase mb-1">Weight</span><b className="text-xl">{a.weight} kg</b></div>
              <div><span className="text-slate-500 block text-xs font-bold uppercase mb-1">BMI</span><b className="text-xl text-indigo-600">{a.bmi}</b></div>
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
                <h4 className="font-bold text-lg text-slate-900">Approved Meal Plan</h4>
                <p className="text-sm text-slate-500">Dr. {p.doctorId?.fullName || 'Unknown'}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                  {p.status.toUpperCase()}
                </span>
                {p.approvedAt && <p className="text-xs text-slate-500 mt-1">Approved: {new Date(p.approvedAt).toLocaleDateString()}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="bg-slate-50 p-4 rounded text-center border border-slate-100">
                <span className="text-slate-500 block text-xs font-bold uppercase mb-1">Target Calories</span>
                <b className="text-2xl text-emerald-600">{p.dailyCalorieTarget} kcal</b>
              </div>
              <div className="bg-slate-50 p-4 rounded text-center border border-slate-100">
                <span className="text-slate-500 block text-xs font-bold uppercase mb-1">Selected Meals</span>
                <b className="text-2xl text-slate-800">{p.totalCalories} kcal</b>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded mb-6 text-center">
              <h5 className="font-bold text-xs uppercase text-slate-500 mb-2">Macronutrients</h5>
              <p className="font-bold">Protein: {p.totalProtein}g | Carbs: {p.totalCarbs}g | Fat: {p.totalFat}g | Fiber: {p.totalFiber}g</p>
            </div>

            <h5 className="font-bold text-slate-800 border-b pb-2 mb-3">Daily Meals</h5>
            <div className="space-y-3 mb-6">
              {p.meals.map((m, idx) => (
                <div key={idx} className="bg-white border border-slate-200 p-3 rounded text-sm flex justify-between">
                  <div>
                    <span className="font-bold inline-block w-20 text-indigo-700">{m.mealType}</span> 
                    <span className="font-bold">{m.name}</span>
                    <div className="text-xs text-slate-500 mt-1 ml-20">Portion: {m.portionSize}</div>
                  </div>
                  <div className="font-bold">{m.calories} kcal</div>
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
                <p className="bg-rose-50 p-2 rounded text-rose-800">{p.foodsToAvoid?.length > 0 ? p.foodsToAvoid.join(', ') : 'None'}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t text-sm">
              <h5 className="font-bold text-slate-800 mb-1">Exercise Recommendation</h5>
              <p className="bg-teal-50 p-2 rounded text-teal-900">{p.exerciseRecommendation || 'Not Available'}</p>
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
    const { history, startingWeight, latestWeight, weightChange, totalRecords } = reportData.progress;
    
    const chartData = history.map(h => ({
      date: new Date(h.date).toLocaleDateString(),
      weight: h.weight,
      bmi: h.bmi
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="border border-slate-200 p-4 rounded-lg bg-slate-50 text-center">
            <span className="text-slate-500 block text-xs">Starting Weight</span>
            <span className="font-black text-xl text-slate-800">{startingWeight} kg</span>
          </div>
          <div className="border border-slate-200 p-4 rounded-lg bg-slate-50 text-center">
            <span className="text-slate-500 block text-xs">Latest Weight</span>
            <span className="font-black text-xl text-indigo-700">{latestWeight} kg</span>
          </div>
          <div className="border border-slate-200 p-4 rounded-lg bg-slate-50 text-center">
            <span className="text-slate-500 block text-xs">Weight Change</span>
            <span className={`font-black text-xl ${weightChange > 0 ? 'text-rose-600' : weightChange < 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
              {weightChange > 0 ? '+' : ''}{weightChange} kg
            </span>
          </div>
          <div className="border border-slate-200 p-4 rounded-lg bg-slate-50 text-center">
            <span className="text-slate-500 block text-xs">Total Records</span>
            <span className="font-black text-xl text-slate-800">{totalRecords}</span>
          </div>
        </div>

        {chartData.length >= 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="border border-slate-200 p-4 rounded-lg bg-white h-64">
              <h4 className="font-bold text-sm text-center mb-4">Weight Trend (kg)</h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{fontSize: 10}} />
                  <YAxis tick={{fontSize: 10}} domain={['auto', 'auto']} />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="#4f46e5" strokeWidth={2} dot={{r: 4}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="border border-slate-200 p-4 rounded-lg bg-white h-64">
              <h4 className="font-bold text-sm text-center mb-4">BMI Trend</h4>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{fontSize: 10}} />
                  <YAxis tick={{fontSize: 10}} domain={['auto', 'auto']} />
                  <Tooltip />
                  <Line type="monotone" dataKey="bmi" stroke="#0ea5e9" strokeWidth={2} dot={{r: 4}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <h4 className="font-bold text-slate-800 border-b pb-2">Progress History</h4>
        <table className="w-full text-sm text-left border border-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Weight</th>
              <th className="px-4 py-2">BMI</th>
              <th className="px-4 py-2">Meal Adherence</th>
              <th className="px-4 py-2">Activity</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h, idx) => (
              <tr key={idx} className="border-t border-slate-200">
                <td className="px-4 py-2">{new Date(h.date).toLocaleDateString()}</td>
                <td className="px-4 py-2 font-bold">{h.weight} kg</td>
                <td className="px-4 py-2">{h.bmi}</td>
                <td className="px-4 py-2">{h.mealAdherence}</td>
                <td className="px-4 py-2">{h.physicalActivity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <DashboardLayout role="patient">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#172033]">My Reports</h1>
        <p className="text-sm text-[#64748B] mt-1">Generate and download reports of your health records, assessments, and progress.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-3">
            <label htmlFor="patientReportTypeSelect" className="block font-bold text-slate-700 mb-3 border-b pb-2">
              1. Select Report Type
            </label>
            <select 
              id="patientReportTypeSelect"
              name="reportType"
              value={reportType} 
              onChange={e => setReportType(e.target.value)}
              className="w-full max-w-md p-2 border border-slate-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">-- Choose Report Type --</option>
              <option value="Personal Health Report">Personal Health Report</option>
              <option value="Obesity Assessment Report">Obesity Assessment Report</option>
              <option value="Meal Plan Report">Meal Plan Report</option>
              <option value="Progress Report">Progress Report</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <h3 className="font-bold text-slate-700 mb-3 border-b pb-2">2. Apply Filters (Optional)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="patientFromDateInput" className="block text-xs text-slate-500 mb-1">From Date</label>
                <input 
                  id="patientFromDateInput"
                  name="fromDate"
                  type="date" 
                  value={fromDate} 
                  onChange={e => setFromDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="patientToDateInput" className="block text-xs text-slate-500 mb-1">To Date</label>
                <input 
                  id="patientToDateInput"
                  name="toDate"
                  type="date" 
                  value={toDate} 
                  onChange={e => setToDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-indigo-500"
                />
              </div>

              {reportType === 'Obesity Assessment Report' && (
                <div>
                  <label htmlFor="patientObesityClassSelect" className="block text-xs text-slate-500 mb-1">Obesity Class</label>
                  <select 
                    id="patientObesityClassSelect"
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
                  <label htmlFor="patientMealPlanStatusSelect" className="block text-xs text-slate-500 mb-1">Plan Status</label>
                  <select 
                    id="patientMealPlanStatusSelect"
                    name="mealPlanStatus"
                    value={mealPlanStatus} 
                    onChange={e => setMealPlanStatus(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-indigo-500"
                  >
                    {/* Patient can only see approved plans basically, but maybe they want to see old ones */}
                    <option value="">All Approved</option>
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
                  <p><span className="font-bold w-24 inline-block">Patient Name:</span> {reportData.patientDetails.fullName}</p>
                  <p><span className="font-bold w-24 inline-block">Age / Gender:</span> {reportData.patientDetails.age} / {reportData.patientDetails.gender}</p>
                </div>
                <div>
                  <p><span className="font-bold w-28 inline-block">Assigned Doctor:</span> Dr. {reportData.patientDetails.assignedDoctor}</p>
                  <p><span className="font-bold w-28 inline-block">Generated:</span> {new Date(reportData.generatedDate).toLocaleString()}</p>
                  {fromDate || toDate ? <p><span className="font-bold w-28 inline-block">Date Filter:</span> {fromDate || 'Any'} to {toDate || 'Any'}</p> : null}
                </div>
              </div>
            </div>

            {/* Content Injection */}
            {reportData.reportType === 'Personal Health Report' && renderHealthReport()}
            {reportData.reportType === 'Obesity Assessment Report' && renderAssessmentReport()}
            {reportData.reportType === 'Meal Plan Report' && renderMealPlanReport()}
            {reportData.reportType === 'Progress Report' && renderProgressReport()}

            {/* Standard Footer */}
            <div className="mt-12 pt-4 border-t border-slate-300 text-center text-xs text-slate-500">
              <p>CONFIDENTIAL MEDICAL REPORT • OBESITY MANAGEMENT SYSTEM</p>
              <p className="mt-1">Generated electronically by {reportData.patientDetails.fullName} on {new Date(reportData.generatedDate).toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
