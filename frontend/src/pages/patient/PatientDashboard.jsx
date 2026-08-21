import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  FaWeightScale, FaNotesMedical, FaCalendarCheck, FaUtensils, 
  FaChartLine, FaArrowRight, FaBell, FaPlus
} from 'react-icons/fa6';

export default function PatientDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // BMI Calculator State
  const [bmiHeight, setBmiHeight] = useState('');
  const [bmiWeight, setBmiWeight] = useState('');
  const [bmiResult, setBmiResult] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/dashboard/patient');
      setData(res.data.data);
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const calculateBMI = () => {
    if (!bmiHeight || !bmiWeight) return;
    const heightInMeters = parseFloat(bmiHeight) / 100;
    const weightInKg = parseFloat(bmiWeight);
    const bmiValue = (weightInKg / (heightInMeters * heightInMeters)).toFixed(1);
    
    let category = '';
    const numBmi = parseFloat(bmiValue);
    if (numBmi < 18.5) category = 'Underweight';
    else if (numBmi <= 24.9) category = 'Normal';
    else if (numBmi <= 29.9) category = 'Overweight';
    else if (numBmi <= 34.9) category = 'Obesity Class I';
    else if (numBmi <= 39.9) category = 'Obesity Class II';
    else category = 'Obesity Class III';

    setBmiResult({ value: bmiValue, category });
  };

  const clearBMI = () => {
    setBmiHeight('');
    setBmiWeight('');
    setBmiResult(null);
  };

  if (loading) return (
    <DashboardLayout role="patient">
      <div className="flex justify-center items-center h-64 text-slate-500">Loading Dashboard...</div>
    </DashboardLayout>
  );

  if (error || !data) return (
    <DashboardLayout role="patient">
      <div className="text-red-500 p-6">{error}</div>
    </DashboardLayout>
  );

  const { summary, nextAppointment, latestAssessment, latestMealPlan, progressOverview, recentNotifications } = data;

  // Format progress for charts
  const chartData = progressOverview.map(p => ({
    date: new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    weight: p.weight !== null ? p.weight : undefined,
    bmi: p.bmi
  }));

  return (
    <DashboardLayout role="patient">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome to your health portal. Here is your latest overview.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600"><FaWeightScale className="text-xl" /></div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Current BMI</p>
            <p className="text-2xl font-black text-slate-800">{summary.currentBmi}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="bg-teal-50 p-3 rounded-lg text-teal-600"><FaNotesMedical className="text-xl" /></div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Obesity Class</p>
            <p className="text-lg font-black text-slate-800 capitalize leading-tight">
              {summary.latestClassification.replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="bg-amber-50 p-3 rounded-lg text-amber-600"><FaCalendarCheck className="text-xl" /></div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Next Appt</p>
            {nextAppointment ? (
              <div>
                <p className="text-lg font-black text-slate-800">{new Date(nextAppointment.date).toLocaleDateString()}</p>
                <p className="text-xs text-slate-500">{nextAppointment.time}</p>
              </div>
            ) : (
              <p className="text-lg font-bold text-slate-400">No Appt</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="bg-rose-50 p-3 rounded-lg text-rose-600"><FaChartLine className="text-xl" /></div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Weight Change</p>
            <p className="text-xl font-black text-slate-800">
              {summary.weightChange} 
              <span className="text-xs text-slate-500 block font-normal mt-1">Current: {summary.currentWeight} {summary.currentWeight !== 'Not Available' && 'kg'}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        
        {/* Left Column (Main Data) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Latest Assessment */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><FaNotesMedical className="text-indigo-500" /> Latest Assessment</h3>
              {latestAssessment && (
                <span className="text-xs text-slate-500">{new Date(latestAssessment.date).toLocaleDateString()}</span>
              )}
            </div>
            <div className="p-5">
              {latestAssessment ? (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex gap-8">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold">BMI</p>
                      <p className="text-xl font-bold text-slate-900">{latestAssessment.bmi}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold">Classification</p>
                      <p className="text-xl font-bold text-indigo-700 capitalize">{latestAssessment.obesityClass.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <Link to="/patient/assessment" className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-100 transition whitespace-nowrap">
                    View Result
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">Not Assessed Yet</p>
              )}
            </div>
          </div>

          {/* Today's Meal Plan */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><FaUtensils className="text-emerald-500" /> Today's Meal Plan</h3>
              {latestMealPlan && (
                <span className="text-xs text-slate-500">Target: {latestMealPlan.dailyCalorieTarget} kcal</span>
              )}
            </div>
            <div className="p-5">
              {latestMealPlan ? (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    {latestMealPlan.meals.map((m, idx) => (
                      <div key={idx} className="border border-slate-100 bg-slate-50 rounded p-3">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">{m.mealType}</p>
                        <p className="text-sm font-bold text-slate-800 leading-tight">{m.name}</p>
                        <p className="text-xs text-indigo-600 mt-1">{m.calories} kcal</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <Link to="/patient/meals" className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold hover:bg-emerald-100 transition flex items-center gap-2">
                      View Full Meal Plan <FaArrowRight />
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No Approved Meal Plan</p>
              )}
            </div>
          </div>

          {/* Progress Overview Charts */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><FaChartLine className="text-blue-500" /> Progress Overview</h3>
              <Link to="/patient/progress" className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1">
                Add Progress <FaPlus />
              </Link>
            </div>
            <div className="p-5">
              {chartData.length < 2 ? (
                <p className="text-sm text-slate-500 text-center py-8">Not enough data to display trends.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-48">
                    <p className="text-xs font-bold text-slate-500 text-center mb-2">Weight Trend (kg)</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{fontSize: 10}} />
                        <YAxis tick={{fontSize: 10}} domain={['auto', 'auto']} />
                        <Tooltip />
                        <Line type="monotone" dataKey="weight" stroke="#0ea5e9" strokeWidth={2} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-48">
                    <p className="text-xs font-bold text-slate-500 text-center mb-2">BMI Trend</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{fontSize: 10}} />
                        <YAxis tick={{fontSize: 10}} domain={['auto', 'auto']} />
                        <Tooltip />
                        <Line type="monotone" dataKey="bmi" stroke="#8b5cf6" strokeWidth={2} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column (Side Widgets) */}
        <div className="space-y-6">
          
          {/* Upcoming Appointment */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><FaCalendarCheck className="text-amber-500" /> Upcoming Appointment</h3>
            </div>
            <div className="p-5">
              {nextAppointment ? (
                <div>
                  <p className="text-lg font-bold text-slate-900 mb-1">Dr. {nextAppointment.doctorName}</p>
                  <p className="text-sm text-slate-600 mb-1">{new Date(nextAppointment.date).toLocaleDateString()} at {nextAppointment.time}</p>
                  <p className="text-sm text-slate-500 mb-3 line-clamp-1">{nextAppointment.reason || 'General Follow-up'}</p>
                  <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded mb-4 capitalize">
                    {nextAppointment.status}
                  </span>
                  <Link to="/patient/appointments" className="block w-full text-center px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50 transition">
                    View Appointments
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No Upcoming Appointment</p>
              )}
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><FaBell className="text-rose-500" /> Recent Notifications</h3>
            </div>
            <div className="p-0">
              {recentNotifications.length > 0 ? (
                <ul className="divide-y divide-slate-100">
                  {recentNotifications.map(n => (
                    <li key={n.id} className="p-4 hover:bg-slate-50 transition">
                      <p className="text-sm text-slate-800 font-medium">{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{new Date(n.date).toLocaleString()}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 text-center py-6">No recent activity</p>
              )}
            </div>
          </div>

          {/* BMI Calculator */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl shadow-sm p-5">
            <h3 className="font-bold text-indigo-900 mb-1">Quick BMI Calculator</h3>
            <p className="text-xs text-indigo-600/80 mb-4">Calculate your BMI instantly.</p>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Height (cm)</label>
                <input 
                  type="number" 
                  value={bmiHeight} 
                  onChange={e => setBmiHeight(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 175"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Weight (kg)</label>
                <input 
                  type="number" 
                  value={bmiWeight} 
                  onChange={e => setBmiWeight(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 70"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button 
                  onClick={calculateBMI}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded text-sm font-bold hover:bg-indigo-700 transition"
                >
                  Calculate
                </button>
                <button 
                  onClick={clearBMI}
                  className="px-3 bg-white border border-slate-300 text-slate-600 rounded text-sm font-bold hover:bg-slate-50 transition"
                >
                  Clear
                </button>
              </div>
            </div>

            {bmiResult && (
              <div className="mt-4 p-3 bg-white border border-indigo-100 rounded-lg text-center">
                <p className="text-xs text-slate-500 uppercase font-bold">Your BMI</p>
                <p className="text-3xl font-black text-indigo-600">{bmiResult.value}</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{bmiResult.category}</p>
                
                <button 
                  onClick={() => navigate('/patient/progress', { state: { newWeight: bmiWeight }})}
                  className="mt-3 w-full py-1.5 border border-indigo-200 text-indigo-700 bg-indigo-50 rounded text-xs font-bold hover:bg-indigo-100 transition"
                >
                  Add this weight to Progress
                </button>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-indigo-100/50">
              <p className="text-[10px] text-indigo-800 leading-tight">
                <strong>Important:</strong> This BMI result is a general calculation and is not the same as the machine-learning obesity assessment completed by your doctor.
              </p>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
