import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { exportToPdf } from '../../utils/pdfExport';
import {
  TrendingUp,
  Plus,
  FileDown,
  Filter,
  PenSquare,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

export default function PatientProgress() {
  const location = useLocation();

  const [records, setRecords] = useState([]);
  const [hasApprovedMealPlan, setHasApprovedMealPlan] = useState(false);
  const [patientHeight, setPatientHeight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [mealAdherence, setMealAdherence] = useState('Not Applicable');
  const [physicalActivity, setPhysicalActivity] = useState('None');
  const [note, setNote] = useState('');
  
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Duplicate handling
  const [duplicateId, setDuplicateId] = useState(null);

  // History state
  const [dateFilter, setDateFilter] = useState('');
  const [downloading, setDownloading] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    fetchProgress();
    if (location.state?.newWeight) {
      setWeight(location.state.newWeight);
      setShowAddModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/patient/progress');
      setRecords(res.data.data.records);
      setHasApprovedMealPlan(res.data.data.hasApprovedMealPlan);
      setPatientHeight(res.data.data.patientHeight);
      
      if (res.data.data.hasApprovedMealPlan && mealAdherence === 'Not Applicable') {
        setMealAdherence('Fully Followed');
      }
    } catch {
      setError('Failed to load progress records.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = (existingRecord = null) => {
    if (existingRecord) {
      setDuplicateId(existingRecord._id);
      setDate(new Date(existingRecord.date).toISOString().split('T')[0]);
      setWeight(existingRecord.weight);
      setMealAdherence(existingRecord.mealAdherence);
      setPhysicalActivity(existingRecord.physicalActivity);
      setNote(existingRecord.note || '');
    } else {
      setDuplicateId(null);
      setDate(new Date().toISOString().split('T')[0]);
      setWeight('');
      setMealAdherence(hasApprovedMealPlan ? 'Fully Followed' : 'Not Applicable');
      setPhysicalActivity('None');
      setNote('');
    }
    setFormError('');
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!weight || weight <= 0) {
      setFormError('Weight is required and must be a positive number.');
      return;
    }
    if (weight < 20 || weight > 400) {
      setFormError('Unrealistic weight value. Please check your entry.');
      return;
    }
    if (!patientHeight) {
      setFormError('Cannot calculate BMI. Please complete your health profile with your height first.');
      return;
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23,59,59,999);
    if (selectedDate > today) {
      setFormError('Future dates are not allowed.');
      return;
    }

    try {
      setSubmitting(true);
      if (duplicateId) {
        await apiClient.put(`/patient/progress/${duplicateId}`, {
          weight, mealAdherence, physicalActivity, note
        });
      } else {
        await apiClient.post('/patient/progress', {
          date, weight, mealAdherence, physicalActivity, note
        });
      }
      setShowAddModal(false);
      fetchProgress();
    } catch (err) {
      if (err.response?.status === 409) {
        if (window.confirm(err.response.data.message)) {
          setDuplicateId(err.response.data.existingRecordId);
        }
      } else {
        setFormError(err.response?.data?.message || 'Failed to save progress.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      setDownloading(true);
      await exportToPdf(reportRef.current, {
        filename: 'Progress_History_Report.pdf',
        margin: 0.4,
        jsPDF: { format: 'a4', orientation: 'landscape' }
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF.');
    } finally {
      setDownloading(false);
    }
  };

  // Summaries
  const sortedRecords = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latestRecord = sortedRecords.length > 0 ? sortedRecords[sortedRecords.length - 1] : null;
  const startingRecord = sortedRecords.length > 0 ? sortedRecords[0] : null;

  let weightChange = '0.0 kg';
  if (latestRecord && startingRecord && sortedRecords.length > 1) {
    const diff = latestRecord.weight - startingRecord.weight;
    weightChange = diff > 0 ? `+${diff.toFixed(1)} kg` : `${diff.toFixed(1)} kg`;
  }

  // Chart Data
  const chartData = sortedRecords.map(r => ({
    date: new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    weight: r.weight,
    bmi: r.bmi
  }));

  const filteredRecords = records.filter(r => {
    return dateFilter ? new Date(r.date).toISOString().split('T')[0] === dateFilter : true;
  });

  return (
    <DashboardLayout role="patient">
      <div className="space-y-6 pb-12">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-xs">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Progress & Milestone Tracker</h1>
                <p className="text-xs text-slate-500 mt-0.5">Log daily weight, record dietary adherence, and observe clinical health trends.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button 
              onClick={() => handleOpenAddModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Today's Weight</span>
            </button>
          </div>
        </div>

        {!patientHeight && !loading && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Height measurement missing:</strong> Update your clinical profile with your height to calculate exact BMI values.
            </span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col justify-center items-center h-80 text-slate-400 space-y-2">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-medium">Loading historical progress...</span>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-center text-xs font-medium">
            {error}
          </div>
        ) : (
          <>
            {/* 6 Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Starting Weight</span>
                <p className="text-xl font-bold text-slate-800">{startingRecord ? `${startingRecord.weight} kg` : '-'}</p>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider block">Current Weight</span>
                <p className="text-xl font-black text-teal-700">{latestRecord ? `${latestRecord.weight} kg` : '-'}</p>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Change</span>
                <p className={`text-xl font-bold ${weightChange.startsWith('+') ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {latestRecord && sortedRecords.length > 1 ? weightChange : '-'}
                </p>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current BMI</span>
                <p className="text-xl font-bold text-slate-800">{latestRecord ? latestRecord.bmi : '-'}</p>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Meal Adherence</span>
                <p className="text-xs font-bold text-slate-900 mt-1 truncate">{latestRecord ? latestRecord.mealAdherence : '-'}</p>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Logs</span>
                <p className="text-xl font-bold text-slate-800">{records.length}</p>
              </div>
            </div>

            {/* Progress Charts */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">Longitudinal Health Trends</h3>
              </div>

              {chartData.length < 2 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>Log at least two measurements to render interactive progress curves.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                  <div className="h-64">
                    <p className="text-[11px] font-bold text-slate-500 text-center mb-2 uppercase">Weight Journey (kg)</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="date" tick={{fontSize: 10}} />
                        <YAxis domain={['auto', 'auto']} tick={{fontSize: 10}} />
                        <Tooltip />
                        <Line type="monotone" dataKey="weight" stroke="#0d9488" strokeWidth={2.5} dot={{r: 3}} activeDot={{r: 5}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="h-64">
                    <p className="text-[11px] font-bold text-slate-500 text-center mb-2 uppercase">BMI Progression</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="date" tick={{fontSize: 10}} />
                        <YAxis domain={['auto', 'auto']} tick={{fontSize: 10}} />
                        <Tooltip />
                        <Line type="monotone" dataKey="bmi" stroke="#6366f1" strokeWidth={2.5} dot={{r: 3}} activeDot={{r: 5}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* History Table */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
              
              {/* Toolbar */}
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                  <input 
                    type="date" 
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-xs bg-white text-slate-700 font-medium cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  <button 
                    onClick={handleDownloadPDF}
                    disabled={downloading || filteredRecords.length === 0}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5 text-teal-600" />}
                    <span>Export PDF</span>
                  </button>
                  <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full">
                    Total: {filteredRecords.length}
                  </span>
                </div>
              </div>

              {/* Table Body */}
              <div className="flex-1 overflow-x-auto" ref={reportRef}>
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3.5">Log Date</th>
                      <th className="px-5 py-3.5">Weight (kg)</th>
                      <th className="px-5 py-3.5">BMI Score</th>
                      <th className="px-5 py-3.5">Dietary Adherence</th>
                      <th className="px-5 py-3.5">Physical Activity</th>
                      <th className="px-5 py-3.5">Patient Notes</th>
                      <th className="px-5 py-3.5 text-right" data-html2canvas-ignore>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.length > 0 ? filteredRecords.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-slate-900 whitespace-nowrap">
                          {new Date(r.date).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-teal-700">
                          {r.weight} <span className="text-[10px] text-slate-400 font-normal">kg</span>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-800">
                          {r.bmi}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            r.mealAdherence === 'Fully Followed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            r.mealAdherence === 'Mostly Followed' ? 'bg-sky-50 text-sky-700 border-sky-200' :
                            r.mealAdherence === 'Partially Followed' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            r.mealAdherence === 'Not Followed' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {r.mealAdherence}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-700">
                          {r.physicalActivity}
                        </td>
                        <td className="px-5 py-3.5 max-w-[200px] truncate text-slate-500" title={r.note}>
                          {r.note || '-'}
                        </td>
                        <td className="px-5 py-3.5 text-right" data-html2canvas-ignore>
                          <button 
                            onClick={() => handleOpenAddModal(r)}
                            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Record"
                          >
                            <PenSquare className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="7" className="px-5 py-12 text-center text-slate-400">
                          No progress records recorded for this filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>

      {/* Add / Edit Progress Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900">{duplicateId ? 'Edit Measurement Log' : 'Record New Weight Measurement'}</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                  {formError}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Log Date <span className="text-rose-500">*</span></label>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    disabled={duplicateId !== null}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Weight in kg <span className="text-rose-500">*</span></label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={weight} 
                    onChange={e => setWeight(e.target.value)}
                    required
                    placeholder="e.g. 74.5"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dietary Plan Adherence</label>
                <select 
                  value={mealAdherence} 
                  onChange={e => setMealAdherence(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
                >
                  {!hasApprovedMealPlan && <option value="Not Applicable">Not Applicable</option>}
                  <option value="Not Followed">Not Followed (Deviated from plan)</option>
                  <option value="Partially Followed">Partially Followed (Some meals)</option>
                  <option value="Mostly Followed">Mostly Followed (Minor deviations)</option>
                  <option value="Fully Followed">Fully Followed (100% adhered)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Physical Activity</label>
                <select 
                  value={physicalActivity} 
                  onChange={e => setPhysicalActivity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
                >
                  <option value="None">None (Rest day)</option>
                  <option value="Light">Light (Walking, stretching)</option>
                  <option value="Moderate">Moderate (Jogging, cycling)</option>
                  <option value="High">High (Intense gym, sports)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes & Symptoms (Optional)</label>
                <textarea 
                  value={note} 
                  onChange={e => setNote(e.target.value)}
                  rows="2"
                  placeholder="e.g. Completed 30 min brisk walk, felt energetic"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {weight && patientHeight && (
                <div className="bg-teal-50/70 p-3 rounded-xl border border-teal-100 flex justify-between items-center text-xs">
                  <span className="text-teal-800 font-semibold">Calculated BMI Score:</span>
                  <span className="text-teal-950 font-black text-sm">
                    {(parseFloat(weight) / ((patientHeight/100) * (patientHeight/100))).toFixed(1)} kg/m²
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{submitting ? 'Recording...' : 'Save Measurement'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
