import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Scale, 
  Activity, 
  CalendarCheck, 
  Utensils, 
  TrendingUp, 
  ArrowRight, 
  Bell, 
  Plus, 
  Calendar, 
  Clock, 
  Calculator, 
  Sparkles
} from 'lucide-react';

function getObesityBadge(cls) {
  if (!cls || cls === 'Not Assessed') return 'bg-slate-100 text-slate-600 border-slate-200';
  if (cls.includes('Obesity_Type_II') || cls.includes('Obesity_Type_III')) return 'bg-rose-50 text-rose-700 border-rose-200';
  if (cls.includes('Obesity') || cls.includes('Overweight')) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (cls === 'Normal_Weight' || cls === 'Normal') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (cls === 'Insufficient_Weight' || cls === 'Underweight') return 'bg-sky-50 text-sky-700 border-sky-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

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
      console.error(err);
      setError('Failed to load patient dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const calculateBMI = () => {
    if (!bmiHeight || !bmiWeight) return;
    const heightInMeters = parseFloat(bmiHeight) / 100;
    const weightInKg = parseFloat(bmiWeight);
    if (heightInMeters <= 0 || weightInKg <= 0) return;
    
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

  if (loading) {
    return (
      <DashboardLayout role="patient">
        <div className="flex flex-col justify-center items-center h-80 text-slate-400 space-y-2">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-medium">Loading your health dashboard...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout role="patient">
        <div className="p-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-center text-xs font-medium">
          {error || 'Unable to retrieve dashboard information.'}
        </div>
      </DashboardLayout>
    );
  }

  const { summary, nextAppointment, latestAssessment, latestMealPlan, progressOverview, recentNotifications } = data;

  const chartData = (progressOverview || []).map(p => ({
    date: new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    weight: p.weight !== null ? p.weight : undefined,
    bmi: p.bmi
  }));

  return (
    <DashboardLayout role="patient">
      <div className="space-y-6 pb-12">
        
        {/* Welcoming Top Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-full bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Patient Health Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Welcome back to SmartObesity
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                Track your personalized nutrition, monitor clinical BMI milestones, and collaborate directly with your healthcare provider.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link 
                to="/patient/appointments"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Book Appointment</span>
              </Link>
              <Link 
                to="/patient/progress"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-semibold backdrop-blur-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Log Today's Weight</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: BMI */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Current BMI</span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{summary.currentBmi}</span>
              <span className="text-xs text-slate-400">kg/m²</span>
            </div>
            <div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getObesityBadge(summary.latestClassification)}`}>
                {summary.latestClassification ? summary.latestClassification.replace(/_/g, ' ') : 'Unassessed'}
              </span>
            </div>
          </div>

          {/* Card 2: Current Weight */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Current Weight</span>
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{summary.currentWeight}</span>
              {summary.currentWeight !== 'Not Available' && <span className="text-xs text-slate-400">kg</span>}
            </div>
            <div className="text-xs text-slate-500">
              Net Change: <span className="font-semibold text-slate-700">{summary.weightChange}</span>
            </div>
          </div>

          {/* Card 3: Daily Calorie Goal */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Daily Calorie Target</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Utensils className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{latestMealPlan ? latestMealPlan.dailyCalorieTarget : '---'}</span>
              <span className="text-xs text-slate-400">kcal/day</span>
            </div>
            <div className="text-xs text-slate-500">
              {latestMealPlan ? 'Approved by Doctor' : 'Awaiting clinical plan'}
            </div>
          </div>

          {/* Card 4: Next Consultation */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-2 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Next Appointment</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <CalendarCheck className="w-4 h-4" />
              </div>
            </div>
            {nextAppointment ? (
              <>
                <div className="font-bold text-sm text-slate-900 truncate">
                  {new Date(nextAppointment.date).toLocaleDateString()}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{nextAppointment.time} • Dr. {nextAppointment.doctorName}</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-sm font-semibold text-slate-400">No appointments scheduled</div>
                <Link to="/patient/appointments" className="text-xs text-teal-600 font-semibold hover:underline block">Book now</Link>
              </>
            )}
          </div>

        </div>

        {/* 2-Column Main Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Left Column (Assessments, Meals, Charts) */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Latest Assessment Status Banner */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-600" />
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">Latest AI Obesity Assessment</h3>
                </div>
                {latestAssessment && (
                  <span className="text-[11px] text-slate-400 font-medium">
                    Evaluated on {new Date(latestAssessment.date).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="p-6">
                {latestAssessment ? (
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">Machine Learning Risk Classification</p>
                      <h4 className="text-xl font-bold text-slate-900 capitalize">
                        {latestAssessment.obesityClass ? latestAssessment.obesityClass.replace(/_/g, ' ') : 'Unknown'}
                      </h4>
                      <div className="flex items-center gap-3 pt-1 text-xs text-slate-600">
                        <span>Calculated BMI: <strong className="text-teal-700">{latestAssessment.bmi}</strong></span>
                        <span>•</span>
                        <span>Weight: <strong className="text-slate-800">{latestAssessment.weight || summary.currentWeight} kg</strong></span>
                      </div>
                    </div>
                    
                    <Link 
                      to="/patient/assessment" 
                      className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 rounded-xl text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                    >
                      <span>View Full Assessment</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No clinical assessment recorded yet. Your doctor will conduct an assessment during your next appointment.
                  </div>
                )}
              </div>
            </div>

            {/* Active Meal Plan Summary */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">Active Meal Plan Overview</h3>
                </div>
                {latestMealPlan && (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                    Target: {latestMealPlan.dailyCalorieTarget} kcal
                  </span>
                )}
              </div>

              <div className="p-6">
                {latestMealPlan ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {latestMealPlan.meals.map((meal, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1">
                          <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">{meal.mealType}</span>
                          <h5 className="font-bold text-xs text-slate-900 leading-snug line-clamp-1">{meal.name}</h5>
                          <p className="text-[11px] text-slate-400">{meal.calories} kcal</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end pt-2">
                      <Link 
                        to="/patient/meals" 
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        <span>View Complete Meal Plan & Alternatives</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No approved meal plan available. Your doctor will publish your custom nutrition plan after your assessment.
                  </div>
                )}
              </div>
            </div>

            {/* Progress Overview Chart */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wide">Progress Journey</h3>
                </div>
                <Link 
                  to="/patient/progress" 
                  className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
                >
                  <span>Log Measurement</span>
                  <Plus className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="p-6">
                {chartData.length < 2 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Not enough data points yet. Log your weight regularly to visualize your BMI & weight reduction trends.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-52">
                      <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide text-center mb-2">Weight History (kg)</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="date" tick={{fontSize: 10}} />
                          <YAxis tick={{fontSize: 10}} domain={['auto', 'auto']} />
                          <Tooltip />
                          <Line type="monotone" dataKey="weight" stroke="#0d9488" strokeWidth={2.5} dot={{r: 3}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="h-52">
                      <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide text-center mb-2">BMI Trend</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="date" tick={{fontSize: 10}} />
                          <YAxis tick={{fontSize: 10}} domain={['auto', 'auto']} />
                          <Tooltip />
                          <Line type="monotone" dataKey="bmi" stroke="#6366f1" strokeWidth={2.5} dot={{r: 3}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column (Upcoming Appt, Quick Calculator, Notifications) */}
          <div className="space-y-6">
            
            {/* Upcoming Appointment Card */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-3">
                <Calendar className="w-4 h-4 text-amber-500" />
                Upcoming Consultation
              </h3>

              {nextAppointment ? (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Dr. {nextAppointment.doctorName}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{new Date(nextAppointment.date).toLocaleDateString()} at {nextAppointment.time}</p>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2 line-clamp-2">
                      {nextAppointment.reason || 'Routine Obesity Management Consultation'}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                      {nextAppointment.status}
                    </span>
                    <Link 
                      to="/patient/appointments" 
                      className="text-xs font-semibold text-teal-600 hover:text-teal-700"
                    >
                      Manage & View
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 space-y-2">
                  <p className="text-xs text-slate-400">No consultations scheduled at this time.</p>
                  <Link 
                    to="/patient/appointments" 
                    className="inline-block text-xs font-semibold text-teal-600 hover:underline"
                  >
                    Schedule an appointment
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Interactive BMI Calculator */}
            <div className="bg-gradient-to-br from-teal-50/60 to-slate-50 border border-teal-100 rounded-2xl shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-teal-100 pb-3">
                <Calculator className="w-4 h-4 text-teal-600" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Quick BMI Calculator</h3>
                  <p className="text-[11px] text-slate-500">Calculate instant BMI estimate</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Height in cm</label>
                  <input 
                    type="number" 
                    value={bmiHeight} 
                    onChange={e => setBmiHeight(e.target.value)}
                    placeholder="e.g. 175"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Weight in kg</label>
                  <input 
                    type="number" 
                    value={bmiWeight} 
                    onChange={e => setBmiWeight(e.target.value)}
                    placeholder="e.g. 74.5"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button 
                    onClick={calculateBMI}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    Calculate
                  </button>
                  <button 
                    onClick={clearBMI}
                    className="px-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {bmiResult && (
                <div className="p-3.5 bg-white border border-teal-100 rounded-xl text-center space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Estimated BMI</p>
                  <p className="text-2xl font-black text-teal-700">{bmiResult.value}</p>
                  <p className="text-xs font-bold text-slate-800">{bmiResult.category}</p>
                  
                  <button 
                    onClick={() => navigate('/patient/progress', { state: { newWeight: bmiWeight }})}
                    className="mt-2 w-full py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    Log this weight to progress tracker
                  </button>
                </div>
              )}
            </div>

            {/* Recent Notifications / Updates */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Activity & Updates</h3>
              </div>

              <div className="p-4">
                {recentNotifications && recentNotifications.length > 0 ? (
                  <ul className="divide-y divide-slate-100 text-xs">
                    {recentNotifications.map(n => (
                      <li key={n.id} className="py-2.5 first:pt-0 last:pb-0">
                        <p className="font-medium text-slate-800">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(n.date).toLocaleString()}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-xs text-slate-400 py-3">No recent notifications</p>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
