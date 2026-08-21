import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { exportToPdf } from '../../utils/pdfExport';
import { FaPlus, FaDownload, FaChartLine, FaWeightScale, FaNotesMedical, FaFilter, FaPencil } from 'react-icons/fa6';

export default function PatientProgress() {
  const location = useLocation();
  const navigate = useNavigate();

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
    // Check if coming from BMI calculator
    if (location.state?.newWeight) {
      setWeight(location.state.newWeight);
      setShowAddModal(true);
      // Clear state so refresh doesn't trigger it again
      window.history.replaceState({}, document.title)
    }
  }, [location.state]);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/patient/progress');
      setRecords(res.data.data.records);
      setHasApprovedMealPlan(res.data.data.hasApprovedMealPlan);
      setPatientHeight(res.data.data.patientHeight);
      
      // Set default meal adherence based on plan
      if (res.data.data.hasApprovedMealPlan && mealAdherence === 'Not Applicable') {
        setMealAdherence('Fully Followed');
      }
    } catch (err) {
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
        // Update existing record
        await apiClient.put(`/patient/progress/${duplicateId}`, {
          weight, mealAdherence, physicalActivity, note
        });
      } else {
        // Create new record
        await apiClient.post('/patient/progress', {
          date, weight, mealAdherence, physicalActivity, note
        });
      }
      setShowAddModal(false);
      fetchProgress();
    } catch (err) {
      if (err.response?.status === 409) {
        // Duplicate found
        if (window.confirm(err.response.data.message)) {
          setDuplicateId(err.response.data.existingRecordId);
          // Now if they click submit again, it will PUT instead of POST
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
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172033]">Progress Tracker</h1>
          <p className="text-sm text-[#64748B] mt-1">Log your weight and adherence to track your journey.</p>
        </div>
        <button 
          onClick={() => handleOpenAddModal()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm"
        >
          <FaPlus /> Add Progress
        </button>
      </div>

      {!patientHeight && !loading && (
        <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-lg text-sm text-amber-800">
          <strong>Notice:</strong> Your height is missing from your profile. Please update your profile to accurately calculate your BMI and track progress.
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading progress data...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Starting Weight</p>
              <p className="text-xl font-bold text-slate-800">{startingRecord ? `${startingRecord.weight} kg` : '-'}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Current Weight</p>
              <p className="text-xl font-black text-indigo-700">{latestRecord ? `${latestRecord.weight} kg` : '-'}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Weight Change</p>
              <p className={`text-xl font-bold ${weightChange.startsWith('+') ? 'text-rose-600' : 'text-emerald-600'}`}>{latestRecord && sortedRecords.length > 1 ? weightChange : '-'}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Current BMI</p>
              <p className="text-xl font-bold text-slate-800">{latestRecord ? latestRecord.bmi : '-'}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Latest Adherence</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{latestRecord ? latestRecord.mealAdherence : '-'}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Total Records</p>
              <p className="text-xl font-bold text-slate-800">{records.length}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-8">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><FaChartLine className="text-indigo-500"/> Progress Trends</h3>
            {chartData.length < 2 ? (
              <div className="py-12 text-center text-slate-500">
                <FaChartLine className="text-4xl text-slate-300 mx-auto mb-3" />
                <p>Insufficient progress data to display a trend.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-64">
                  <p className="text-xs font-bold text-slate-500 text-center mb-2">Weight Trend (kg)</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{fontSize: 10}} />
                      <YAxis domain={['auto', 'auto']} tick={{fontSize: 10}} />
                      <Tooltip />
                      <Line type="monotone" dataKey="weight" stroke="#4f46e5" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-64">
                  <p className="text-xs font-bold text-slate-500 text-center mb-2">BMI Trend</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" tick={{fontSize: 10}} />
                      <YAxis domain={['auto', 'auto']} tick={{fontSize: 10}} />
                      <Tooltip />
                      <Line type="monotone" dataKey="bmi" stroke="#0ea5e9" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* History Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="font-bold text-slate-800">Progress History</h3>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <FaFilter className="text-slate-400" />
                  <input 
                    type="date" 
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="border border-slate-300 rounded-lg text-sm px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button 
                  onClick={handleDownloadPDF}
                  disabled={downloading || filteredRecords.length === 0}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold rounded flex items-center gap-2 transition disabled:opacity-50"
                >
                  <FaDownload /> PDF
                </button>
              </div>
            </div>

            <div className="overflow-x-auto" ref={reportRef}>
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-bold">Date</th>
                    <th className="px-6 py-4 font-bold">Weight (kg)</th>
                    <th className="px-6 py-4 font-bold">BMI</th>
                    <th className="px-6 py-4 font-bold">Meal Adherence</th>
                    <th className="px-6 py-4 font-bold">Physical Activity</th>
                    <th className="px-6 py-4 font-bold">Note</th>
                    <th className="px-6 py-4 font-bold text-center" data-html2canvas-ignore>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRecords.length > 0 ? filteredRecords.map((r, idx) => (
                    <tr key={r._id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {new Date(r.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-bold text-indigo-700">
                        {r.weight}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {r.bmi}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 text-xs font-bold rounded ${
                          r.mealAdherence === 'Fully Followed' ? 'bg-emerald-100 text-emerald-800' :
                          r.mealAdherence === 'Mostly Followed' ? 'bg-blue-100 text-blue-800' :
                          r.mealAdherence === 'Partially Followed' ? 'bg-amber-100 text-amber-800' :
                          r.mealAdherence === 'Not Followed' ? 'bg-rose-100 text-rose-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {r.mealAdherence}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {r.physicalActivity}
                      </td>
                      <td className="px-6 py-4 max-w-[200px] truncate" title={r.note}>
                        {r.note || '-'}
                      </td>
                      <td className="px-6 py-4 flex justify-center" data-html2canvas-ignore>
                        <button 
                          onClick={() => handleOpenAddModal(r)}
                          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition"
                          title="Edit Record"
                        >
                          <FaPencil />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                        <p className="font-medium">No progress records found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add / Edit Progress Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h2 className="font-bold text-lg text-slate-800">{duplicateId ? 'Edit Progress Record' : 'Add Progress Record'}</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              {formError && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm border border-red-200 rounded">{formError}</div>}
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                    <input 
                      type="date" 
                      value={date} 
                      onChange={e => setDate(e.target.value)}
                      required
                      max={new Date().toISOString().split('T')[0]}
                      disabled={duplicateId !== null} // Prevent changing date during edit
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 text-sm disabled:bg-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Weight (kg) *</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={weight} 
                      onChange={e => setWeight(e.target.value)}
                      required
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Meal Plan Adherence</label>
                  <select 
                    value={mealAdherence} 
                    onChange={e => setMealAdherence(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    {!hasApprovedMealPlan && <option value="Not Applicable">Not Applicable</option>}
                    <option value="Not Followed">Not Followed</option>
                    <option value="Partially Followed">Partially Followed</option>
                    <option value="Mostly Followed">Mostly Followed</option>
                    <option value="Fully Followed">Fully Followed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Physical Activity</label>
                  <select 
                    value={physicalActivity} 
                    onChange={e => setPhysicalActivity(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="None">None</option>
                    <option value="Light">Light</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Note (Optional)</label>
                  <textarea 
                    value={note} 
                    onChange={e => setNote(e.target.value)}
                    rows="2"
                    placeholder="e.g. Completed walking exercises."
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 text-sm"
                  ></textarea>
                </div>

                {weight && patientHeight && (
                  <div className="bg-indigo-50 p-3 rounded border border-indigo-100 flex justify-between items-center text-sm">
                    <span className="text-indigo-700 font-bold">Calculated BMI</span>
                    <span className="text-indigo-900 font-black">
                      {(parseFloat(weight) / ((patientHeight/100) * (patientHeight/100))).toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Progress'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
