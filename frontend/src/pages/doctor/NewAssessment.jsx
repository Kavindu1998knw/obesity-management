import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import { FaArrowLeft, FaExclamationTriangle, FaStethoscope } from 'react-icons/fa';

export default function NewAssessment() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialPatientId = queryParams.get('patient'); // user ID of the patient

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
  const [foodAllergies, setFoodAllergies] = useState([]);
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
      // The patients API returns patient profiles. We need the userId.
      setPatients(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
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

        // Meal Plan Info (Preferences, Allergies, Medical Conditions, Dislikes)
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
        // No previous assessments: load from patient profile & onboarding healthDetails
        setLastAssessmentDate(null);

        // Basic Measurements
        if (profile.age && profile.age !== 'N/A') setAge(String(profile.age));
        if (profile.gender && profile.gender !== 'N/A') setGender(profile.gender);
        if (profile.height) setHeightCm(String(profile.height));
        if (profile.weight) setWeight(String(profile.weight));

        // Health Details (Eating Habits & Lifestyle)
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

        // Meal Plan Info (Preferences, Allergies, Medical Conditions, Dislikes)
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

      // Finalize allergies array with 'Other' if provided
      let finalAllergies = [...foodAllergies];
      if (finalAllergies.includes('Other') && otherAllergy.trim()) {
        finalAllergies = finalAllergies.map(a => a === 'Other' ? `Other: ${otherAllergy.trim()}` : a);
      }

      // Convert Height
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
      
      // We pass the prediction data directly to the result page via React Router state
      // so the doctor can review it BEFORE saving to the DB.
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
        <div className="p-12 text-center text-slate-500">Loading form...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="doctor">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/doctor/assessments" className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
            <FaArrowLeft />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#172033]">New Assessment</h1>
            <p className="text-sm text-[#64748B] mt-1">Run ML prediction for patient obesity outcomes.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg">
          {error}
        </div>
      )}

      <form onSubmit={handlePredict} className="space-y-6">
        
        {/* A. Patient Selection */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">A</span>
            Patient Selection
          </h2>
          <div className="max-w-md">
            <label className="block text-sm font-medium text-slate-700 mb-1">Select Patient <span className="text-red-500">*</span></label>
            <select 
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
              required
            >
              <option value="">-- Select Assigned Patient --</option>
              {patients.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} (ID: {p._id.substring(p._id.length - 6)})
                </option>
              ))}
            </select>
          </div>

          {lastAssessmentDate && (
            <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
              <span>
                <strong>Clinical History Loaded:</strong> Form has been automatically pre-filled with data from the previous assessment ({new Date(lastAssessmentDate).toLocaleDateString()}). You can review and update measurements (e.g. Current Weight) as needed.
              </span>
            </div>
          )}
        </div>

        {/* B. Basic Measurements */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">B</span>
            Basic Measurements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Age <span className="text-red-500">*</span></label>
              <input 
                type="number" min="1" required placeholder="e.g. 30"
                value={Age} onChange={(e) => setAge(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Gender <span className="text-red-500">*</span></label>
              <select 
                value={Gender} onChange={(e) => setGender(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Height (cm) <span className="text-red-500">*</span></label>
              <input 
                type="number" min="1" required placeholder="e.g. 175"
                value={HeightCm} onChange={(e) => setHeightCm(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-slate-500 mt-1">Will be converted to metres for the model automatically.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg) <span className="text-red-500">*</span></label>
              <input 
                type="number" step="0.1" min="1" required placeholder="e.g. 75"
                value={Weight} onChange={handleWeightChange}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* C. Eating Habits */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">C</span>
            Eating Habits
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">High-Calorie Food (FAVC) <span className="text-red-500">*</span></label>
              <select value={FAVC} onChange={(e) => setFAVC(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Vegetable Consumption (FCVC) <span className="text-red-500">*</span></label>
              <select value={FCVC} onChange={(e) => setFCVC(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="1">Rarely</option>
                <option value="2">Sometimes</option>
                <option value="3">Frequently</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Main Meals Per Day (NCP) <span className="text-red-500">*</span></label>
              <select value={NCP} onChange={(e) => setNCP(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Food Between Meals (CAEC) <span className="text-red-500">*</span></label>
              <select value={CAEC} onChange={(e) => setCAEC(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="no">Never</option>
                <option value="Sometimes">Sometimes</option>
                <option value="Frequently">Frequently</option>
                <option value="Always">Always</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Daily Water Consumption (CH2O) <span className="text-red-500">*</span></label>
              <select value={CH2O} onChange={(e) => setCH2O(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="1">Less than 1 litre</option>
                <option value="2">Between 1 and 2 litres</option>
                <option value="3">More than 2 litres</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Calorie Monitoring (SCC) <span className="text-red-500">*</span></label>
              <select value={SCC} onChange={(e) => setSCC(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Alcohol Consumption (CALC) <span className="text-red-500">*</span></label>
              <select value={CALC} onChange={(e) => setCALC(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="no">Never</option>
                <option value="Sometimes">Sometimes</option>
                <option value="Frequently">Frequently</option>
                <option value="Always">Always</option>
              </select>
            </div>
          </div>
        </div>

        {/* D. Lifestyle Information */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">D</span>
            Lifestyle Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Family History of Overweight <span className="text-red-500">*</span></label>
              <select value={family_history_with_overweight} onChange={(e) => setFamilyHistory(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Smoking Status (SMOKE) <span className="text-red-500">*</span></label>
              <select value={SMOKE} onChange={(e) => setSMOKE(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Physical Activity (FAF) <span className="text-red-500">*</span></label>
              <select value={FAF} onChange={(e) => setFAF(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="0">No regular physical activity</option>
                <option value="1">Light physical activity</option>
                <option value="2">Moderate physical activity</option>
                <option value="3">High physical activity</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Technology Usage (TUE) <span className="text-red-500">*</span></label>
              <select value={TUE} onChange={(e) => setTUE(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="0">0 to 2 hours</option>
                <option value="1">3 to 5 hours</option>
                <option value="2">More than 5 hours</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Transportation Method (MTRANS) <span className="text-red-500">*</span></label>
              <select value={MTRANS} onChange={(e) => setMTRANS(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="Public_Transportation">Public Transportation</option>
                <option value="Automobile">Automobile</option>
                <option value="Walking">Walking</option>
                <option value="Motorbike">Motorbike</option>
                <option value="Bike">Bike</option>
              </select>
            </div>
          </div>
        </div>

        {/* Meal Plan Information */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">M</span>
            Meal Plan Information <span className="text-xs font-normal text-slate-400 ml-2">(Not used for ML, saved for diet generation)</span>
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Dietary Preference</label>
              <select value={dietaryPreference} onChange={(e) => setDietaryPreference(e.target.value)} className="w-full md:w-1/2 border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="No Special Preference">No Special Preference</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Vegan">Vegan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Food Allergies</label>
              <div className="flex flex-wrap gap-3">
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
                ].map(allergy => (
                  <label key={allergy} className="inline-flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      checked={foodAllergies.includes(allergy)}
                      onChange={() => handleAllergyToggle(allergy)}
                    />
                    <span className="text-sm text-slate-700">{allergy}</span>
                  </label>
                ))}
              </div>
              {foodAllergies.includes('Other') && (
                <input 
                  type="text" 
                  placeholder="Specify other allergy" 
                  value={otherAllergy}
                  onChange={(e) => setOtherAllergy(e.target.value)}
                  className="mt-3 w-full md:w-1/2 border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500" 
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Medical Conditions</label>
              <div className="flex flex-wrap gap-3">
                {['None', 'Diabetes', 'High Blood Pressure', 'High Cholesterol', 'Other'].map(condition => (
                  <label key={condition} className="inline-flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      checked={medicalConditions.includes(condition)}
                      onChange={() => handleMedicalToggle(condition)}
                    />
                    <span className="text-sm text-slate-700">{condition}</span>
                  </label>
                ))}
              </div>
              {medicalConditions.some(c => c !== 'None') && (
                <p className="mt-2 text-xs font-medium text-amber-600 bg-amber-50 inline-block p-1.5 rounded border border-amber-200">
                  Medical condition recorded. Doctor review is required before approving generated meal plans.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Disliked Foods (Optional)</label>
              <input 
                type="text" 
                placeholder="E.g., mushrooms, broccoli, spicy food (comma separated)" 
                value={dislikedFoods}
                onChange={(e) => setDislikedFoods(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500" 
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pb-8">
          <Link to="/doctor/assessments" className="px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors">
            Cancel
          </Link>
          <button 
            type="submit" 
            disabled={predicting}
            className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center gap-2"
          >
            {predicting ? 'Processing...' : <><FaStethoscope /> Run Prediction</>}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}
