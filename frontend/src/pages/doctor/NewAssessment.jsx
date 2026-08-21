import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import {
  ArrowLeft,
  Activity,
  AlertTriangle,
  Loader2,
  CheckCircle2
} from 'lucide-react';

export default function NewAssessment() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialPatientId = queryParams.get('patient');

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for Form Fields
  const [patientId, setPatientId] = useState(initialPatientId || '');
  
  // B. Basic Measurements
  const [Age, setAge] = useState('');
  const [Gender, setGender] = useState('Male');
  const [HeightCm, setHeightCm] = useState('');
  const [Weight, setWeight] = useState('');

  // C. Eating Habits
  const [FAVC, setFAVC] = useState('yes');
  const [FCVC, setFCVC] = useState('2');
  const [NCP, setNCP] = useState('3');
  const [CAEC, setCAEC] = useState('Sometimes');
  const [CH2O, setCH2O] = useState('2');
  const [SCC, setSCC] = useState('no');
  const [CALC, setCALC] = useState('Sometimes');

  // D. Lifestyle
  const [family_history_with_overweight, setFamilyHistory] = useState('yes');
  const [SMOKE, setSMOKE] = useState('no');
  const [FAF, setFAF] = useState('1');
  const [TUE, setTUE] = useState('1');
  const [MTRANS, setMTRANS] = useState('Public_Transportation');

  // Meal Plan Info
  const [dietaryPreference, setDietaryPreference] = useState('No Special Preference');
  const [foodAllergies, setFoodAllergies] = useState(['None']);
  const [otherAllergy, setOtherAllergy] = useState('');
  const [medicalConditions, setMedicalConditions] = useState(['None']);
  const [dislikedFoods, setDislikedFoods] = useState('');

  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState('');

  const [lastAssessmentDate, setLastAssessmentDate] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await apiClient.get('/doctor/patients');
      setPatients(response.data.data);
      setLoading(false);
    } catch {
      setError('Failed to load assigned patients.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchPatientDetails(patientId);
    } else {
      setLastAssessmentDate(null);
    }
  }, [patientId]);

  const fetchPatientDetails = async (id) => {
    try {
      const response = await apiClient.get(`/doctor/patients/${id}`);
      const data = response.data.data;
      const profile = data.profile || {};
      const hd = data.healthDetails || {};
      const assessments = data.assessments || [];
      const latestAssessment = assessments.length > 0 ? assessments[0] : null;

      if (latestAssessment) {
        setLastAssessmentDate(latestAssessment.createdAt);
        const inp = latestAssessment.inputs || {};
        const reqs = latestAssessment.mealPlanRequirements || {};

        // Basic Measurements from latest assessment
        if (inp.Age !== undefined) setAge(String(inp.Age));
        else if (profile.age && profile.age !== 'N/A') setAge(String(profile.age));

        if (inp.Gender) setGender(inp.Gender);
        else if (profile.gender && profile.gender !== 'N/A') setGender(profile.gender);

        if (latestAssessment.height) {
          const hVal = latestAssessment.height;
          setHeightCm(String(Math.round(hVal > 3 ? hVal : hVal * 100)));
        } else if (inp.Height) {
          const hVal = inp.Height;
          setHeightCm(String(Math.round(hVal > 3 ? hVal : hVal * 100)));
        } else if (profile.height) {
          setHeightCm(String(profile.height));
        }

        if (latestAssessment.weight) {
          setWeight(String(latestAssessment.weight));
        } else if (inp.Weight) {
          setWeight(String(inp.Weight));
        } else if (profile.weight) {
          setWeight(String(profile.weight));
        }

        // Eating Habits from latest assessment
        if (inp.FAVC) setFAVC(inp.FAVC);
        else if (hd.highCalorieFoodConsumption) setFAVC(hd.highCalorieFoodConsumption);

        if (inp.FCVC !== undefined) setFCVC(String(inp.FCVC));
        else if (hd.vegetableConsumption !== undefined) setFCVC(String(hd.vegetableConsumption));

        if (inp.NCP !== undefined) setNCP(String(inp.NCP));
        else if (hd.mainMealsPerDay !== undefined) setNCP(String(hd.mainMealsPerDay));

        if (inp.CAEC) setCAEC(inp.CAEC);
        else if (hd.foodBetweenMeals) setCAEC(hd.foodBetweenMeals);

        if (inp.CH2O !== undefined) setCH2O(String(inp.CH2O));
        else if (hd.waterConsumption !== undefined) setCH2O(String(hd.waterConsumption));

        if (inp.SCC) setSCC(inp.SCC);
        else if (hd.calorieMonitoring) setSCC(hd.calorieMonitoring);

        if (inp.CALC) setCALC(inp.CALC);
        else if (hd.alcoholConsumption) setCALC(hd.alcoholConsumption);

        // Lifestyle from latest assessment
        if (inp.family_history_with_overweight) setFamilyHistory(inp.family_history_with_overweight);
        else if (hd.familyHistoryOverweight) setFamilyHistory(hd.familyHistoryOverweight);

        if (inp.SMOKE) setSMOKE(inp.SMOKE);
        else if (hd.smokingStatus) setSMOKE(hd.smokingStatus);

        if (inp.FAF !== undefined) setFAF(String(inp.FAF));
        else if (hd.physicalActivity !== undefined) setFAF(String(hd.physicalActivity));

        if (inp.TUE !== undefined) setTUE(String(inp.TUE));
        else if (hd.technologyUsage !== undefined) setTUE(String(hd.technologyUsage));

        if (inp.MTRANS) setMTRANS(inp.MTRANS);
        else if (hd.transportationMethod) setMTRANS(hd.transportationMethod);

        // Meal Plan Info
        if (reqs.dietaryPreference && reqs.dietaryPreference !== 'None') {
          setDietaryPreference(reqs.dietaryPreference);
        } else if (hd.dietaryPreference && hd.dietaryPreference !== 'None') {
          setDietaryPreference(hd.dietaryPreference);
        }

        const rawAllergies = reqs.foodAllergies || hd.foodAllergies || [];
        if (rawAllergies.length > 0) {
          const standardList = [
            'None',
            'Seafood / Shellfish',
            'Strong Fish Types & Maldive Fish',
            'Red Meats',
            'Acidic Fruits',
            'Certain Vegetables',
            'Milk & Dairy',
            'Egg',
            'Peanuts, Tree Nuts & Soy',
            'Gluten'
          ];
          const newSelected = [];
          let customOther = '';

          rawAllergies.forEach(item => {
            if (standardList.includes(item)) {
              newSelected.push(item);
            } else if (item.startsWith('Other:')) {
              newSelected.push('Other');
              customOther = item.replace(/^Other:\s*/, '').trim();
            } else if (item && item !== 'None') {
              newSelected.push('Other');
              customOther = item;
            }
          });

          if (newSelected.length > 0) {
            setFoodAllergies([...new Set(newSelected)]);
          } else {
            setFoodAllergies(['None']);
          }
          if (customOther) {
            setOtherAllergy(customOther);
          }
        }

        if (reqs.medicalConditions && reqs.medicalConditions.length > 0) {
          setMedicalConditions(reqs.medicalConditions);
        } else if (hd.medicalConditions && hd.medicalConditions.length > 0) {
          setMedicalConditions(hd.medicalConditions);
        }

        if (reqs.dislikedFoods && reqs.dislikedFoods.length > 0) {
          setDislikedFoods(Array.isArray(reqs.dislikedFoods) ? reqs.dislikedFoods.join(', ') : reqs.dislikedFoods);
        } else if (hd.dislikedFoods && hd.dislikedFoods.length > 0) {
          setDislikedFoods(Array.isArray(hd.dislikedFoods) ? hd.dislikedFoods.join(', ') : hd.dislikedFoods);
        }

      } else {
        setLastAssessmentDate(null);

        if (profile.age && profile.age !== 'N/A') setAge(String(profile.age));
        if (profile.gender && profile.gender !== 'N/A') setGender(profile.gender);
        if (profile.height) setHeightCm(String(profile.height));
        if (profile.weight) setWeight(String(profile.weight));

        if (hd.familyHistoryOverweight) setFamilyHistory(hd.familyHistoryOverweight);
        if (hd.highCalorieFoodConsumption) setFAVC(hd.highCalorieFoodConsumption);
        if (hd.vegetableConsumption !== undefined) setFCVC(String(hd.vegetableConsumption));
        if (hd.mainMealsPerDay !== undefined) setNCP(String(hd.mainMealsPerDay));
        if (hd.foodBetweenMeals) setCAEC(hd.foodBetweenMeals);
        if (hd.waterConsumption !== undefined) setCH2O(String(hd.waterConsumption));
        if (hd.calorieMonitoring) setSCC(hd.calorieMonitoring);
        if (hd.smokingStatus) setSMOKE(hd.smokingStatus);
        if (hd.alcoholConsumption) setCALC(hd.alcoholConsumption);
        if (hd.physicalActivity !== undefined) setFAF(String(hd.physicalActivity));
        if (hd.technologyUsage !== undefined) setTUE(String(hd.technologyUsage));
        if (hd.transportationMethod) setMTRANS(hd.transportationMethod);

        if (hd.dietaryPreference && hd.dietaryPreference !== 'None') setDietaryPreference(hd.dietaryPreference);
        if (hd.foodAllergies && hd.foodAllergies.length > 0) setFoodAllergies(hd.foodAllergies);
        if (hd.medicalConditions && hd.medicalConditions.length > 0) setMedicalConditions(hd.medicalConditions);
        if (hd.dislikedFoods && hd.dislikedFoods.length > 0) {
          setDislikedFoods(Array.isArray(hd.dislikedFoods) ? hd.dislikedFoods.join(', ') : hd.dislikedFoods);
        }
      }
      
    } catch (err) {
      console.error('Failed to load patient details:', err);
    }
  };

  const handleWeightChange = (e) => {
    setWeight(e.target.value);
  };

  const handleAllergyToggle = (allergy) => {
    if (allergy === 'None') {
      setFoodAllergies(['None']);
      setOtherAllergy('');
    } else {
      let updated = foodAllergies.filter(a => a !== 'None');
      if (updated.includes(allergy)) {
        updated = updated.filter(a => a !== allergy);
        if (updated.length === 0) updated = ['None'];
        if (allergy === 'Other') setOtherAllergy('');
      } else {
        updated.push(allergy);
      }
      setFoodAllergies(updated);
    }
  };

  const handleMedicalToggle = (condition) => {
    if (condition === 'None') {
      setMedicalConditions(['None']);
    } else {
      let updated = medicalConditions.filter(c => c !== 'None');
      if (updated.includes(condition)) {
        updated = updated.filter(c => c !== condition);
        if (updated.length === 0) updated = ['None'];
      } else {
        updated.push(condition);
      }
      setMedicalConditions(updated);
    }
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!patientId || !Age || !HeightCm || !Weight) {
      setError('Please fill out all required basic measurements and select a patient.');
      return;
    }

    try {
      setPredicting(true);
      setError('');

      let finalAllergies = [...foodAllergies];
      if (finalAllergies.includes('Other') && otherAllergy.trim()) {
        finalAllergies = finalAllergies.map(a => a === 'Other' ? `Other: ${otherAllergy.trim()}` : a);
      }

      const HeightInMeters = parseFloat(HeightCm) / 100;

      const payload = {
        patientId,
        Age,
        Gender,
        Height: HeightInMeters,
        Weight,
        FAVC,
        FCVC,
        NCP,
        CAEC,
        CH2O,
        SCC,
        CALC,
        family_history_with_overweight,
        SMOKE,
        FAF,
        TUE,
        MTRANS,
        mealPlanRequirements: {
          dietaryPreference,
          foodAllergies: finalAllergies,
          medicalConditions,
          dislikedFoods: dislikedFoods.split(',').map(s => s.trim()).filter(s => s)
        }
      };

      const response = await apiClient.post('/doctor/assessments/predict', payload);
      navigate('/doctor/assessments/preview', { state: { assessmentData: response.data.data } });

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to run prediction. Is the ML service running?');
    } finally {
      setPredicting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="doctor">
        <div className="flex flex-col justify-center items-center h-80 text-slate-400 space-y-2">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-medium">Preparing assessment interface...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-6 pb-12">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              to="/doctor/assessments" 
              className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-teal-600 hover:border-teal-200 transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">New AI Obesity Assessment</h1>
              <p className="text-xs text-slate-500 mt-0.5">Collect clinical lifestyle metrics and trigger Random Forest ML risk classification.</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handlePredict} className="space-y-6">
          
          {/* Section A: Patient Selection */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-xs border border-teal-100">
                  A
                </div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Patient Selection</h3>
              </div>
            </div>

            <div className="max-w-md">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Assigned Patient <span className="text-rose-500">*</span>
              </label>
              <select 
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition cursor-pointer"
                required
              >
                <option value="">-- Choose from Assigned Patients --</option>
                {patients.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.name} (#{p._id.slice(-6).toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {lastAssessmentDate && (
              <div className="p-3.5 bg-teal-50/70 border border-teal-100 rounded-xl text-xs text-teal-800 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>
                  <strong>Clinical History Loaded:</strong> Form auto-populated from previous assessment ({new Date(lastAssessmentDate).toLocaleDateString()}). Please update current metrics (e.g., Weight).
                </span>
              </div>
            )}
          </div>

          {/* Section B: Basic Measurements */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-xs border border-teal-100">
                  B
                </div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Basic Anthropometric Measurements</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Age <span className="text-rose-500">*</span></label>
                <input 
                  type="number" min="1" max="120" required placeholder="e.g. 32"
                  value={Age} onChange={(e) => setAge(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gender <span className="text-rose-500">*</span></label>
                <select 
                  value={Gender} onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Height in Centimetres (cm) <span className="text-rose-500">*</span></label>
                <input 
                  type="number" min="50" max="250" required placeholder="e.g. 175"
                  value={HeightCm} onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">Converted to metres for ML model automatically.</p>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Weight in Kilograms (kg) <span className="text-rose-500">*</span></label>
                <input 
                  type="number" step="0.1" min="10" max="300" required placeholder="e.g. 78.5"
                  value={Weight} onChange={handleWeightChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section C: Eating Habits */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-xs border border-teal-100">
                  C
                </div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Nutritional & Eating Habits</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">High-Calorie Food Intake (FAVC) <span className="text-rose-500">*</span></label>
                <select value={FAVC} onChange={(e) => setFAVC(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer">
                  <option value="yes">Frequent High-Calorie Intake (Yes)</option>
                  <option value="no">Low / Controlled Intake (No)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vegetables in Meals (FCVC) <span className="text-rose-500">*</span></label>
                <select value={FCVC} onChange={(e) => setFCVC(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer">
                  <option value="1">Rarely / Never</option>
                  <option value="2">Sometimes</option>
                  <option value="3">Frequently / Every Meal</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Main Meals Per Day (NCP) <span className="text-rose-500">*</span></label>
                <select value={NCP} onChange={(e) => setNCP(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer">
                  <option value="1">1 Main Meal</option>
                  <option value="2">2 Main Meals</option>
                  <option value="3">3 Main Meals (Standard)</option>
                  <option value="4">4+ Main Meals</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Snacking Between Meals (CAEC) <span className="text-rose-500">*</span></label>
                <select value={CAEC} onChange={(e) => setCAEC(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer">
                  <option value="no">Never / Rarely</option>
                  <option value="Sometimes">Sometimes</option>
                  <option value="Frequently">Frequently</option>
                  <option value="Always">Always</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Water Intake (CH2O) <span className="text-rose-500">*</span></label>
                <select value={CH2O} onChange={(e) => setCH2O(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer">
                  <option value="1">Less than 1 Litre</option>
                  <option value="2">1 to 2 Litres</option>
                  <option value="3">More than 2 Litres</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Calorie Monitoring (SCC) <span className="text-rose-500">*</span></label>
                <select value={SCC} onChange={(e) => setSCC(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer">
                  <option value="yes">Yes (Monitors)</option>
                  <option value="no">No (Does Not Monitor)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alcohol Consumption (CALC) <span className="text-rose-500">*</span></label>
                <select value={CALC} onChange={(e) => setCALC(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer">
                  <option value="no">Never / Non-Drinker</option>
                  <option value="Sometimes">Sometimes</option>
                  <option value="Frequently">Frequently</option>
                  <option value="Always">Always</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section D: Lifestyle Information */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-xs border border-teal-100">
                  D
                </div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Lifestyle & Physical Factors</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Family Overweight History <span className="text-rose-500">*</span></label>
                <select value={family_history_with_overweight} onChange={(e) => setFamilyHistory(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer">
                  <option value="yes">Yes (Present in Family)</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Smoking Habit (SMOKE) <span className="text-rose-500">*</span></label>
                <select value={SMOKE} onChange={(e) => setSMOKE(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer">
                  <option value="yes">Yes (Smoker)</option>
                  <option value="no">No (Non-Smoker)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Physical Activity (FAF) <span className="text-rose-500">*</span></label>
                <select value={FAF} onChange={(e) => setFAF(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer">
                  <option value="0">No Regular Physical Activity (0 days)</option>
                  <option value="1">Light Physical Activity (1-2 days/week)</option>
                  <option value="2">Moderate Physical Activity (3-4 days/week)</option>
                  <option value="3">High Physical Activity (5+ days/week)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Screen & Tech Usage (TUE) <span className="text-rose-500">*</span></label>
                <select value={TUE} onChange={(e) => setTUE(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer">
                  <option value="0">0 to 2 Hours Daily</option>
                  <option value="1">3 to 5 Hours Daily</option>
                  <option value="2">More than 5 Hours Daily</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary Commute (MTRANS) <span className="text-rose-500">*</span></label>
                <select value={MTRANS} onChange={(e) => setMTRANS(e.target.value)} className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer">
                  <option value="Public_Transportation">Public Transportation (Bus / Train)</option>
                  <option value="Automobile">Automobile / Car</option>
                  <option value="Walking">Walking</option>
                  <option value="Motorbike">Motorbike</option>
                  <option value="Bike">Bicycle</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section E: Meal Plan Requirements */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-xs border border-teal-100">
                  E
                </div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Meal Plan & Dietary Constraints</h3>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dietary Preference</label>
                <select value={dietaryPreference} onChange={(e) => setDietaryPreference(e.target.value)} className="w-full md:w-1/2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer">
                  <option value="No Special Preference">No Special Preference</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-2">Food Allergies</label>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    'None',
                    'Seafood / Shellfish',
                    'Strong Fish Types & Maldive Fish',
                    'Red Meats',
                    'Acidic Fruits',
                    'Certain Vegetables',
                    'Milk & Dairy',
                    'Egg',
                    'Peanuts, Tree Nuts & Soy',
                    'Gluten',
                    'Other'
                  ].map(allergy => {
                    const isChecked = foodAllergies.includes(allergy);
                    return (
                      <button
                        key={allergy}
                        type="button"
                        onClick={() => handleAllergyToggle(allergy)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {allergy}
                      </button>
                    );
                  })}
                </div>
                {foodAllergies.includes('Other') && (
                  <input 
                    type="text" 
                    placeholder="Specify other allergy..." 
                    value={otherAllergy}
                    onChange={(e) => setOtherAllergy(e.target.value)}
                    className="mt-2.5 w-full md:w-1/2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none" 
                  />
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-2">Medical Conditions</label>
                <div className="flex flex-wrap gap-2.5">
                  {['None', 'Diabetes', 'High Blood Pressure', 'High Cholesterol', 'Other'].map(condition => {
                    const isChecked = medicalConditions.includes(condition);
                    return (
                      <button
                        key={condition}
                        type="button"
                        onClick={() => handleMedicalToggle(condition)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {condition}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Disliked Foods (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. mushrooms, broccoli, bitter gourd (comma separated)" 
                  value={dislikedFoods}
                  onChange={(e) => setDislikedFoods(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none" 
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Link 
              to="/doctor/assessments" 
              className="px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button 
              type="submit" 
              disabled={predicting}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {predicting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
              <span>{predicting ? 'Processing AI Model...' : 'Run Random Forest Prediction'}</span>
            </button>
          </div>
        </form>

      </div>
    </DashboardLayout>
  );
}
