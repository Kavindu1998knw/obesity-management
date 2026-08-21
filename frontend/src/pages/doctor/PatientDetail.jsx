import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';
import { 
  FaUser, FaNotesMedical, FaStethoscope, FaUtensils, FaChartLine, FaFileAlt, 
  FaArrowLeft, FaExclamationTriangle
} from 'react-icons/fa';

const VALID_TABS = ['overview', 'health', 'assessments', 'meals', 'progress', 'notes'];

function getObesityColor(level) {
  if (!level || level === 'Not Assessed') return 'bg-slate-50 border-slate-100 text-slate-700';
  if (level.includes('Obesity')) return 'bg-red-50 border-red-100 text-red-700';
  if (level.includes('Overweight')) return 'bg-orange-50 border-orange-100 text-orange-700';
  if (level === 'Normal_Weight') return 'bg-green-50 border-green-100 text-green-700';
  if (level === 'Insufficient_Weight') return 'bg-blue-50 border-blue-100 text-blue-700';
  return 'bg-slate-50 border-slate-100 text-slate-700';
}

function formatObesityLabel(val) {
  if (!val) return 'N/A';
  return val.replace(/_/g, ' ');
}

export default function PatientDetail() {
  const { id } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab');
  const initialTab = VALID_TABS.includes(tabParam) ? tabParam : 'overview';

  const [activeTab, setActiveTab] = useState(initialTab);
  
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // States for Health Details Form
  const [healthDetails, setHealthDetails] = useState({});
  const [savingHealth, setSavingHealth] = useState(false);
  const [healthMessage, setHealthMessage] = useState({ type: '', text: '' });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/doctor/patients/${id}`);
      setPatientData(response.data.data);
      setHealthDetails(response.data.data.healthDetails || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load patient details.');
    } finally {
      setLoading(false);
    }
  };

  const handleHealthDetailChange = (e) => {
    const { name, value } = e.target;
    setHealthDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayDetailChange = (e) => {
    const { name, value } = e.target;
    const arrayValues = value.split(',').map(item => item.trim()).filter(Boolean);
    setHealthDetails(prev => ({ ...prev, [name]: arrayValues }));
  };

  const saveHealthDetails = async (e) => {
    e.preventDefault();
    try {
      setSavingHealth(true);
      setHealthMessage({ type: '', text: '' });
      await apiClient.put(`/doctor/patients/${id}/health-details`, healthDetails);
      setHealthMessage({ type: 'success', text: 'Health details updated successfully.' });
    } catch (err) {
      setHealthMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update health details.' });
    } finally {
      setSavingHealth(false);
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
        setNoteMessage({ type: 'success', text: 'Note added successfully.' });
      }
      
      setNewNote('');
      setEditingNoteId(null);
      fetchPatientDetails(); // Refresh to get new notes
    } catch (err) {
      setNoteMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save note.' });
    } finally {
      setSavingNote(false);
    }
  };

  const startEditNote = (note) => {
    setEditingNoteId(note._id);
    setNewNote(note.note);
  };

  const cancelEditNote = () => {
    setEditingNoteId(null);
    setNewNote('');
  };

  if (loading) {
    return (
      <DashboardLayout role="doctor">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !patientData) {
    return (
      <DashboardLayout role="doctor">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-3">
          <FaExclamationTriangle />
          {error || 'Patient not found.'}
        </div>
        <Link to="/doctor/patients" className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800">
          <FaArrowLeft /> Back to Patients List
        </Link>
      </DashboardLayout>
    );
  }

  const { profile, assessments, mealPlans, progressRecords, notes } = patientData;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FaUser },
    { id: 'health', label: 'Health Details', icon: FaNotesMedical },
    { id: 'assessments', label: 'Assessments', icon: FaStethoscope },
    { id: 'meals', label: 'Meal Plan', icon: FaUtensils },
    { id: 'progress', label: 'Progress', icon: FaChartLine },
    { id: 'notes', label: 'Doctor Notes', icon: FaFileAlt },
  ];

  const progressChartData = (progressRecords || []).map(r => ({
    date: new Date(r.date).toLocaleDateString(),
    weight: r.weight,
    bmi: r.bmi
  })).reverse(); // Oldest first for chart

  return (
    <DashboardLayout role="doctor">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link to="/doctor/patients" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <FaArrowLeft />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#172033]">{profile.fullName}</h1>
            <p className="text-sm text-[#64748B] mt-1">Patient ID: {String(profile.id).substring(String(profile.id).length - 8).toUpperCase()}</p>
          </div>
        </div>
        <div className="flex gap-2">
           <Link to={`/doctor/assessments/new?patient=${profile.id}`} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <FaStethoscope /> Start Assessment
           </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-slate-200 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors relative ${
                activeTab === tab.id ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <tab.icon className={activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'} />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-6 border-b pb-2">Patient Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</label>
                <div className="mt-1 text-sm font-medium text-slate-900">{profile.fullName}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</label>
                <div className="mt-1 text-sm font-medium text-slate-900">{profile.email}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone Number</label>
                <div className="mt-1 text-sm font-medium text-slate-900">{profile.phoneNumber || 'N/A'}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Age / Gender</label>
                <div className="mt-1 text-sm font-medium text-slate-900">{profile.age} yrs / {profile.gender || 'N/A'}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Doctor</label>
                <div className="mt-1 text-sm font-medium text-slate-900">Dr. {profile.assignedDoctorName}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Status</label>
                <div className="mt-1 text-sm font-medium text-slate-900 capitalize">{profile.accountStatus || 'N/A'}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Next Appointment</label>
                <div className="mt-1 text-sm font-medium text-indigo-600">
                  {profile.nextAppointmentDate ? `${new Date(profile.nextAppointmentDate).toLocaleDateString()} at ${profile.nextAppointmentTime}` : 'No upcoming appointments'}
                </div>
              </div>
            </div>

            <h3 className="text-md font-bold text-slate-900 mb-4 mt-8 border-b pb-2">Current Metrics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Height</div>
                <div className="text-xl font-bold text-slate-900">{profile.height ? `${profile.height} cm` : 'N/A'}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Weight</div>
                <div className="text-xl font-bold text-slate-900">{profile.weight ? `${profile.weight} kg` : 'N/A'}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Current BMI</div>
                <div className="text-xl font-bold text-slate-900">{profile.currentBmi || 'N/A'}</div>
              </div>
              <div className={`rounded-lg p-4 border ${getObesityColor(profile.latestObesityClassification)}`}>
                <div className="text-xs opacity-80 mb-1">Latest Classification</div>
                <div className="text-xl font-bold">{formatObesityLabel(profile.latestObesityClassification)}</div>
              </div>
            </div>
            <div className="mt-6 text-xs text-slate-500 italic">
              * Note: Base account details (Name, Email, etc.) can only be modified by an Administrator.
            </div>
          </div>
        )}

        {/* HEALTH DETAILS TAB */}
        {activeTab === 'health' && (
          <form onSubmit={saveHealthDetails}>
            <div className="flex justify-between items-center mb-6 border-b pb-2">
              <h2 className="text-lg font-bold text-slate-900">Health & Prediction Details</h2>
              <button 
                type="submit" 
                disabled={savingHealth}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {savingHealth ? 'Saving...' : 'Save Health Details'}
              </button>
            </div>
            
            {healthMessage.text && (
              <div className={`p-3 mb-6 rounded-lg text-sm ${healthMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {healthMessage.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {/* Prediction Features */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 border-b pb-2">Lifestyle & Habits (ML Inputs)</h3>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Family History of Overweight</label>
                  <select name="familyHistoryOverweight" value={healthDetails.familyHistoryOverweight || ''} onChange={handleHealthDetailChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">Select option...</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Frequent High-Calorie Food (FAVC)</label>
                  <select name="highCalorieFoodConsumption" value={healthDetails.highCalorieFoodConsumption || ''} onChange={handleHealthDetailChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">Select option...</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vegetable Consumption (FCVC) 1-3</label>
                  <input type="number" min="1" max="3" step="0.1" name="vegetableConsumption" value={healthDetails.vegetableConsumption || ''} onChange={handleHealthDetailChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. 2.5" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Main Meals Per Day (NCP) 1-4</label>
                  <input type="number" min="1" max="4" step="0.1" name="mainMealsPerDay" value={healthDetails.mainMealsPerDay || ''} onChange={handleHealthDetailChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. 3.0" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Food Between Meals (CAEC)</label>
                  <select name="foodBetweenMeals" value={healthDetails.foodBetweenMeals || ''} onChange={handleHealthDetailChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">Select option...</option>
                    <option value="no">No</option>
                    <option value="Sometimes">Sometimes</option>
                    <option value="Frequently">Frequently</option>
                    <option value="Always">Always</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Daily Water Consumption (CH2O) 1-3 Liters</label>
                  <input type="number" min="1" max="3" step="0.1" name="waterConsumption" value={healthDetails.waterConsumption || ''} onChange={handleHealthDetailChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. 2.0" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Calorie Monitoring (SCC)</label>
                  <select name="calorieMonitoring" value={healthDetails.calorieMonitoring || ''} onChange={handleHealthDetailChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">Select option...</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>

              {/* Other Features & Dietary */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-700 border-b pb-2 invisible md:visible">Continued</h3>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Physical Activity (FAF) 0-3 days/week</label>
                  <input type="number" min="0" max="3" step="0.1" name="physicalActivity" value={healthDetails.physicalActivity || ''} onChange={handleHealthDetailChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. 1.0" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Technology Usage (TUE) 0-24 hours/day</label>
                  <input type="number" min="0" max="24" step="0.1" name="technologyUsage" value={healthDetails.technologyUsage || ''} onChange={handleHealthDetailChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. 5.0" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Smoking Status (SMOKE)</label>
                  <select name="smokingStatus" value={healthDetails.smokingStatus || ''} onChange={handleHealthDetailChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">Select option...</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Alcohol Consumption (CALC)</label>
                  <select name="alcoholConsumption" value={healthDetails.alcoholConsumption || ''} onChange={handleHealthDetailChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">Select option...</option>
                    <option value="no">No</option>
                    <option value="Sometimes">Sometimes</option>
                    <option value="Frequently">Frequently</option>
                    <option value="Always">Always</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Main Transportation Method (MTRANS)</label>
                  <select name="transportationMethod" value={healthDetails.transportationMethod || ''} onChange={handleHealthDetailChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">Select option...</option>
                    <option value="Automobile">Automobile</option>
                    <option value="Motorbike">Motorbike</option>
                    <option value="Bike">Bike</option>
                    <option value="Public_Transportation">Public Transportation</option>
                    <option value="Walking">Walking</option>
                  </select>
                </div>

                <h3 className="font-semibold text-slate-700 border-b pb-2 pt-4">Meal Plan Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dietary Preference</label>
                  <select name="dietaryPreference" value={healthDetails.dietaryPreference || ''} onChange={handleHealthDetailChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">Select option...</option>
                    <option value="None">None</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Food Allergies (Comma separated)</label>
                  <input type="text" name="foodAllergies" value={healthDetails.foodAllergies?.join(', ') || ''} onChange={handleArrayDetailChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. Milk, Peanuts, Soy" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Disliked Foods (Comma separated)</label>
                  <input type="text" name="dislikedFoods" value={healthDetails.dislikedFoods?.join(', ') || ''} onChange={handleArrayDetailChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. Tomatoes, Mushroom" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Medical Conditions (Comma separated)</label>
                  <input type="text" name="medicalConditions" value={healthDetails.medicalConditions?.join(', ') || ''} onChange={handleArrayDetailChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g. Diabetes, Hypertension" />
                </div>
              </div>
            </div>
          </form>
        )}

        {/* ASSESSMENTS TAB */}
        {activeTab === 'assessments' && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-6 border-b pb-2">Obesity Assessments</h2>
            {(assessments || []).length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg">No assessments have been recorded for this patient.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Predicted Class</th>
                      <th className="px-4 py-3 font-medium">Doctor</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {assessments.map(a => (
                      <tr key={a._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-900">{new Date(a.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{formatObesityLabel(a.obesityClass)}</td>
                        <td className="px-4 py-3 text-slate-600">Dr. {a.doctorId?.fullName || 'Unknown'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${a.isApproved ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                            {a.isApproved ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link to={`/doctor/assessments/${a._id}`} className="text-blue-600 hover:text-blue-800 text-xs font-medium">View Result</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MEAL PLAN TAB */}
        {activeTab === 'meals' && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-6 border-b pb-2">Meal Plans</h2>
            {(mealPlans || []).length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg">No meal plans have been generated for this patient.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 font-medium">Created Date</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {mealPlans.map(mp => (
                      <tr key={mp._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-900">{new Date(mp.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${mp.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                            {mp.status === 'Approved' ? 'Approved' : 'Draft'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link to={`/doctor/meals/${mp._id}`} className="text-blue-600 hover:text-blue-800 text-xs font-medium">View Meal Plan</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PROGRESS TAB */}
        {activeTab === 'progress' && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-6 border-b pb-2">Progress Tracking</h2>
            {(progressRecords || []).length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-lg">No progress records available for this patient.</div>
            ) : (
              <div className="space-y-8">
                {/* Trend Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 text-center">Weight Trend (kg)</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={progressChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="date" tick={{fontSize: 12}} tickMargin={10} stroke="#94a3b8" />
                          <YAxis tick={{fontSize: 12}} stroke="#94a3b8" domain={['dataMin - 2', 'dataMax + 2']} />
                          <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Line type="monotone" dataKey="weight" stroke="#4f46e5" strokeWidth={3} dot={{r: 4, fill: '#4f46e5', strokeWidth: 0}} activeDot={{r: 6}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 text-center">BMI Trend</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={progressChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="date" tick={{fontSize: 12}} tickMargin={10} stroke="#94a3b8" />
                          <YAxis tick={{fontSize: 12}} stroke="#94a3b8" domain={['dataMin - 1', 'dataMax + 1']} />
                          <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Line type="monotone" dataKey="bmi" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 0}} activeDot={{r: 6}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Progress Table */}
                <div>
                  <h3 className="text-md font-bold text-slate-900 mb-4">Progress Log</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border border-slate-200 rounded-lg">
                      <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3 font-medium border-b border-slate-200">Date</th>
                          <th className="px-4 py-3 font-medium border-b border-slate-200">Weight</th>
                          <th className="px-4 py-3 font-medium border-b border-slate-200">BMI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {progressRecords.map(pr => (
                          <tr key={pr._id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-900">{new Date(pr.date).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-slate-600">{pr.weight} kg</td>
                            <td className="px-4 py-3 text-slate-600">{pr.bmi}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DOCTOR NOTES TAB */}
        {activeTab === 'notes' && (
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-6 border-b pb-2">Clinical Notes</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Note Form */}
              <div className="lg:col-span-1 bg-slate-50 p-5 rounded-xl border border-slate-200 self-start">
                <h3 className="text-md font-semibold text-slate-800 mb-4">
                  {editingNoteId ? 'Edit Clinical Note' : 'Add Clinical Note'}
                </h3>
                
                {noteMessage.text && (
                  <div className={`p-3 mb-4 rounded-lg text-sm ${noteMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {noteMessage.text}
                  </div>
                )}
                
                <form onSubmit={submitNote}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Patient Name</label>
                    <input type="text" value={profile.fullName} disabled className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-slate-100 text-slate-500 cursor-not-allowed" />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Clinical Note</label>
                    <textarea 
                      rows="6"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Enter clinical observations, recommendations..."
                      className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                      maxLength={5000}
                    ></textarea>
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      type="submit" 
                      disabled={savingNote || !newNote.trim()}
                      className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {savingNote ? 'Saving...' : editingNoteId ? 'Update Note' : 'Save Note'}
                    </button>
                    
                    {editingNoteId && (
                      <button 
                        type="button" 
                        onClick={cancelEditNote}
                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-300 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Notes List */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-md font-semibold text-slate-800 mb-4">Previous Notes</h3>
                
                {(notes || []).length === 0 ? (
                  <div className="p-8 text-center text-slate-500 border border-dashed border-slate-300 rounded-xl">
                    No clinical notes have been added for this patient.
                  </div>
                ) : (
                  notes.map(note => (
                    <div key={note._id} className={`p-5 rounded-xl border ${editingNoteId === note._id ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-white'} shadow-sm relative group`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-semibold text-slate-800">
                          Dr. {note.doctorId?.fullName || 'Unknown'}
                        </div>
                        <div className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded">
                          {new Date(note.createdAt).toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                        {note.note}
                      </div>
                      
                      {String(note.doctorId?._id || note.doctorId) === String(loggedInUser?._id) && (
                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => startEditNote(note)}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                          >
                            Edit Note
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
        
      </div>
    </DashboardLayout>
  );
}
