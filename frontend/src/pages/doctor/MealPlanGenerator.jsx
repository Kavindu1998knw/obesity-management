import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertTriangle,
  ArrowLeftRight,
  FileDown,
  Loader2,
  X,
  Utensils
} from 'lucide-react';
import { exportToPdf } from '../../utils/pdfExport';

export default function MealPlanGenerator() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isNew = id === 'new';
  const queryParams = new URLSearchParams(location.search);
  const assessmentId = queryParams.get('assessment');

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState([]);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [alternatives, setAlternatives] = useState([]);
  const [loadingAlts, setLoadingAlts] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [currentMealToChange, setCurrentMealToChange] = useState(null);

  // Editable fields
  const [doctorInstructions, setDoctorInstructions] = useState('');
  const [exerciseRecommendation, setExerciseRecommendation] = useState('');
  const [waterTarget, setWaterTarget] = useState('');
  const [foodsToAvoid, setFoodsToAvoid] = useState('');
  const [medicalAck, setMedicalAck] = useState(false);

  useEffect(() => {
    if (isNew) {
      if (!assessmentId) {
        setError('Assessment ID is required to generate a new meal plan.');
        setLoading(false);
        return;
      }
      generatePayload();
    } else {
      loadDraftOrApproved();
    }
  }, [id]);

  const generatePayload = async () => {
    try {
      setLoading(true);
      const res = await apiClient.post('/doctor/meal-plans/generate', { assessmentId });
      initData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate meal plan.');
    } finally {
      setLoading(false);
    }
  };

  const loadDraftOrApproved = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/doctor/meal-plans/${id}`);
      initData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load meal plan.');
    } finally {
      setLoading(false);
    }
  };

  const initData = (data) => {
    setPlan(data);
    setDoctorInstructions(data.doctorInstructions || '');
    setExerciseRecommendation(data.exerciseRecommendation || '30 minutes of moderate physical activity daily.');
    setWaterTarget(data.waterTarget || '2.5 Litres');
    setFoodsToAvoid(data.foodsToAvoid ? data.foodsToAvoid.join(', ') : '');
    setMedicalAck(data.medicalConditionWarningAcknowledged || false);
    if (data.warnings) setWarnings(data.warnings);
  };

  const isReadOnly = plan && plan.status === 'Approved';

  const handleSaveDraft = async () => {
    try {
      setLoading(true);
      const payload = buildSavePayload();
      
      let res;
      if (isNew) {
        res = await apiClient.post('/doctor/meal-plans', payload);
        navigate(`/doctor/meals/${res.data.data._id}/edit`);
      } else {
        res = await apiClient.put(`/doctor/meal-plans/${id}`, payload);
        initData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save draft.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!doctorInstructions.trim()) {
      alert("Doctor Instructions are required before approving.");
      return;
    }
    if (plan.medicalConditions?.length > 0 && !medicalAck) {
      alert("Please acknowledge the medical warning before approving.");
      return;
    }

    if (!window.confirm("Are you sure you want to approve this meal plan? After approval, this plan will be actively published to the patient portal.")) {
      return;
    }

    try {
      setLoading(true);
      if (isNew) {
         const saveRes = await apiClient.post('/doctor/meal-plans', buildSavePayload());
         await apiClient.post(`/doctor/meal-plans/${saveRes.data.data._id}/approve`);
         navigate(`/doctor/meals/${saveRes.data.data._id}`);
      } else {
         await apiClient.put(`/doctor/meal-plans/${id}`, buildSavePayload());
         await apiClient.post(`/doctor/meal-plans/${id}/approve`);
         navigate(`/doctor/meals/${id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve meal plan.');
      setLoading(false);
    }
  };

  const buildSavePayload = () => {
    return {
      patientId: plan.patientId?._id || plan.patientId,
      assessmentId: plan.assessmentId?._id || plan.assessmentId,
      obesityClass: plan.obesityClass,
      bmi: plan.bmi,
      bmr: plan.bmr,
      activityFactor: plan.activityFactor,
      tdee: plan.tdee,
      calorieAdjustment: plan.calorieAdjustment,
      dailyCalorieTarget: plan.dailyCalorieTarget,
      dietaryPreference: plan.dietaryPreference,
      allergies: plan.allergies,
      medicalConditions: plan.medicalConditions,
      dislikedFoods: plan.dislikedFoods,
      templateIds: plan.meals.map(m => m.templateId),
      waterTarget,
      foodsToAvoid: foodsToAvoid.split(',').map(s => s.trim()).filter(Boolean),
      exerciseRecommendation,
      doctorInstructions,
      medicalConditionWarningAcknowledged: medicalAck
    };
  };

  const openChangeModal = async (meal) => {
    setCurrentMealToChange(meal);
    setModalType(meal.mealType);
    setShowModal(true);
    setLoadingAlts(true);
    
    try {
      const res = await apiClient.post('/doctor/meal-plans/alternatives', {
        assessmentId: isNew ? assessmentId : undefined,
        mealPlanId: !isNew ? id : undefined,
        mealType: meal.mealType,
        excludeTemplateId: meal.templateId
      });
      setAlternatives(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAlts(false);
    }
  };

  const selectAlternative = (altMeal) => {
    const newMeals = plan.meals.map(m => m.templateId === currentMealToChange.templateId ? altMeal : m);
    
    const newCal = newMeals.reduce((sum, m) => sum + m.calories, 0);
    const newPro = newMeals.reduce((sum, m) => sum + m.protein, 0);
    const newCarb = newMeals.reduce((sum, m) => sum + m.carbohydrates, 0);
    const newFat = newMeals.reduce((sum, m) => sum + m.fat, 0);
    const newFib = newMeals.reduce((sum, m) => sum + m.fiber, 0);

    setPlan({
      ...plan,
      meals: newMeals,
      totalMealCalories: newCal,
      totalProtein: newPro,
      totalCarbohydrates: newCarb,
      totalFat: newFat,
      totalFiber: newFib,
      calorieDifference: newCal - plan.dailyCalorieTarget
    });

    setShowModal(false);
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const safePatientName = (plan.patientId?.fullName || 'Patient').replace(/\s+/g, '_');
      const filename = `MealPlan_${safePatientName}.pdf`;
      await exportToPdf('pdf-content', { 
        filename,
        margin: 0.4,
        jsPDF: { format: 'a4', orientation: 'portrait' }
      });
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('Failed to export PDF.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="doctor">
        <div className="flex flex-col justify-center items-center h-80 text-slate-400 space-y-2">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-medium">Configuring dietary plan...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="doctor">
        <div className="p-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-center text-xs font-medium">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  if (!plan) return null;

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-6 pb-12">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link 
              to="/doctor/meals" 
              className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-teal-600 hover:border-teal-200 transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {isNew ? 'Generate Nutritional Meal Plan' : isReadOnly ? 'Patient Meal Plan' : 'Edit Meal Plan Draft'}
                </h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  isReadOnly ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {plan.status || 'Unsaved Draft'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Patient: <span className="font-semibold text-slate-800">{plan.patientId?.fullName || 'Assigned Patient'}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {isReadOnly ? (
              <button 
                onClick={handleDownloadPDF} 
                disabled={downloading}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                <span>{downloading ? 'Preparing PDF...' : 'Download PDF'}</span>
              </button>
            ) : (
              <>
                <button 
                  onClick={handleSaveDraft} 
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-slate-500" />
                  <span>Save Draft</span>
                </button>
                <button 
                  onClick={handleApprove} 
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve & Publish</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Warnings & Medical Alerts */}
        {warnings.length > 0 && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-rose-600" /> Meal Plan Warnings:</div>
            <ul className="list-disc pl-5 space-y-0.5">
              {warnings.map((w, idx) => <li key={idx}>{w}</li>)}
            </ul>
          </div>
        )}

        {plan.medicalConditions?.length > 0 && !isReadOnly && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Medical Conditions Recorded for Patient</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              This patient has documented conditions ({plan.medicalConditions.join(', ')}). Please verify recipe ingredients and macronutrient balance before approving.
            </p>
            <label className="flex items-center gap-2 text-xs font-semibold text-amber-900 cursor-pointer pt-1">
              <input 
                type="checkbox" 
                checked={medicalAck} 
                onChange={e => setMedicalAck(e.target.checked)} 
                className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 cursor-pointer" 
              />
              <span>I confirm that I have reviewed these dietary recipes against the patient's medical profile.</span>
            </label>
          </div>
        )}

        {/* Main Grid Content */}
        <div id="pdf-content" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Summary, Calculations, Recommendations */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Patient Clinical Targets */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
                Patient Nutritional Targets
              </h3>
              
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Class:</span>
                  <span className="font-bold text-slate-900">{plan.obesityClass ? plan.obesityClass.replace(/_/g, ' ') : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Dietary Style:</span>
                  <span className="font-semibold text-slate-800">{plan.dietaryPreference || 'Standard'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Allergies:</span>
                  <span className="font-semibold text-rose-600">{plan.allergies?.length ? plan.allergies.join(', ') : 'None'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Calculated BMR:</span>
                  <span className="font-mono text-slate-800 font-medium">{plan.bmr} kcal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated TDEE:</span>
                  <span className="font-mono text-slate-800 font-medium">{plan.tdee} kcal</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-500 font-semibold">Suggested Daily Target:</span>
                  <span className="font-bold text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-lg">
                    {plan.dailyCalorieTarget} kcal
                  </span>
                </div>
              </div>

              {/* Meal Total & Difference Card */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">Total Meal Calories:</span>
                  <span className="text-sm font-black text-slate-900">{plan.totalMealCalories} kcal</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Caloric Differential:</span>
                  <span className={`font-bold ${plan.calorieDifference > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {plan.calorieDifference > 0 ? `+${plan.calorieDifference}` : plan.calorieDifference} kcal
                  </span>
                </div>
              </div>

              {/* Macro Pills */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-teal-50 border border-teal-100 p-2 rounded-xl text-teal-900">
                  <span className="text-[10px] text-teal-600 font-bold block">Protein</span>
                  <span className="font-bold text-xs">{plan.totalProtein}g</span>
                </div>
                <div className="bg-sky-50 border border-sky-100 p-2 rounded-xl text-sky-900">
                  <span className="text-[10px] text-sky-600 font-bold block">Carbs</span>
                  <span className="font-bold text-xs">{plan.totalCarbohydrates}g</span>
                </div>
                <div className="bg-amber-50 border border-amber-100 p-2 rounded-xl text-amber-900">
                  <span className="text-[10px] text-amber-600 font-bold block">Fat</span>
                  <span className="font-bold text-xs">{plan.totalFat}g</span>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 p-2 rounded-xl text-indigo-900">
                  <span className="text-[10px] text-indigo-600 font-bold block">Fiber</span>
                  <span className="font-bold text-xs">{plan.totalFiber}g</span>
                </div>
              </div>
            </div>

            {/* Doctor Recommendation Form */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4 text-xs">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
                Clinical Recommendations
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Water Intake</label>
                  {isReadOnly ? (
                    <p className="p-2.5 bg-slate-50 rounded-xl text-slate-800 font-medium">{waterTarget}</p>
                  ) : (
                    <input 
                      type="text" 
                      value={waterTarget} 
                      onChange={e => setWaterTarget(e.target.value)} 
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none" 
                    />
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Foods to Strictly Avoid</label>
                  {isReadOnly ? (
                    <p className="p-2.5 bg-slate-50 rounded-xl text-rose-600 font-medium">{foodsToAvoid || 'None'}</p>
                  ) : (
                    <textarea 
                      rows={2} 
                      value={foodsToAvoid} 
                      onChange={e => setFoodsToAvoid(e.target.value)} 
                      placeholder="e.g. Sugary beverages, deep-fried snacks..." 
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Physical Exercise Guidance</label>
                  {isReadOnly ? (
                    <p className="p-2.5 bg-slate-50 rounded-xl text-slate-800 font-medium leading-relaxed">{exerciseRecommendation}</p>
                  ) : (
                    <textarea 
                      rows={2} 
                      value={exerciseRecommendation} 
                      onChange={e => setExerciseRecommendation(e.target.value)} 
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Doctor Instructions <span className="text-rose-500">*</span>
                  </label>
                  {isReadOnly ? (
                    <p className="p-3 bg-teal-50/70 border border-teal-100 rounded-xl text-teal-950 leading-relaxed font-medium">{doctorInstructions}</p>
                  ) : (
                    <textarea 
                      rows={3} 
                      value={doctorInstructions} 
                      onChange={e => setDoctorInstructions(e.target.value)} 
                      placeholder="Mandatory clinical instructions for the patient..." 
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                      required
                    />
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Meal Cards by Type */}
          <div className="lg:col-span-2 space-y-6">
            {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(type => {
              const mealsOfType = plan.meals.filter(m => m.mealType === type);
              
              return (
                <div key={type} className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Utensils className="w-3.5 h-3.5 text-teal-600" />
                      {type} Options
                    </h3>
                  </div>

                  {mealsOfType.length === 0 ? (
                    <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl border border-rose-200 text-xs font-medium flex justify-between items-center">
                      <span>Missing {type} assignment.</span>
                      {!isReadOnly && (
                        <button onClick={() => openChangeModal({ mealType: type })} className="font-bold underline cursor-pointer">
                          Add {type}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {mealsOfType.map((meal, idx) => (
                        <div key={idx} className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-sm text-slate-900">{meal.name}</h4>
                              <p className="text-xs text-slate-500 mt-0.5">{meal.description}</p>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 font-bold text-[10px] mt-1.5 border border-teal-100">
                                Portion: {meal.portionSize}
                              </span>
                            </div>
                            
                            <div className="text-right">
                              <span className="text-lg font-black text-slate-900">{meal.calories}</span>
                              <span className="text-xs text-slate-400 ml-1">kcal</span>
                            </div>
                          </div>

                          {/* Nutrient Breakdown */}
                          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                            <div>Protein: <span className="font-bold text-slate-800">{meal.protein}g</span></div>
                            <div>Carbs: <span className="font-bold text-slate-800">{meal.carbohydrates}g</span></div>
                            <div>Fat: <span className="font-bold text-slate-800">{meal.fat}g</span></div>
                            <div>Fiber: <span className="font-bold text-slate-800">{meal.fiber}g</span></div>
                          </div>

                          <div className="text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-700">Ingredients: </span> 
                            {meal.ingredients.join(', ')}
                          </div>

                          {!isReadOnly && (
                            <div className="pt-2 border-t border-slate-100 flex justify-end">
                              <button 
                                onClick={() => openChangeModal(meal)}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 hover:bg-slate-100 text-teal-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              >
                                <ArrowLeftRight className="w-3.5 h-3.5" />
                                <span>Swap / Change {type}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Alternatives Sub-section */}
                      {plan.alternatives?.[type] && (
                        (() => {
                          const selectedNames = new Set(mealsOfType.map(m => m.name));
                          const alts = plan.alternatives[type].filter(a => !selectedNames.has(a.name));
                          if (alts.length === 0) return null;
                          return (
                            <div className="p-4 bg-slate-50/80 border border-slate-200/60 rounded-2xl space-y-3">
                              <p className="text-[11px] font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                                <Utensils className="w-3.5 h-3.5 text-teal-600" />
                                Alternative Options for Daily Variety:
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                {alts.map((alt, aIdx) => (
                                  <div key={aIdx} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                                    <div className="flex justify-between items-start">
                                      <h5 className="text-xs font-bold text-slate-800 leading-tight truncate">{alt.name}</h5>
                                      <span className="text-xs font-bold text-teal-700 shrink-0 ml-1">{alt.calories} kcal</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400">{alt.portionSize}</p>
                                    <div className="flex gap-2 pt-1 border-t border-slate-100 text-[10px] text-slate-600">
                                      <span><b>P:</b> {alt.protein}g</span>
                                      <span><b>C:</b> {alt.carbohydrates || alt.carbs}g</span>
                                      <span><b>F:</b> {alt.fat}g</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()
                      )}

                      {/* Second Snack Option */}
                      {type === 'Snack' && mealsOfType.length === 1 && !isReadOnly && (
                        <button 
                          onClick={() => openChangeModal({ mealType: 'Snack' })}
                          className="w-full py-2.5 border border-dashed border-slate-300 text-slate-500 font-semibold text-xs rounded-xl hover:bg-slate-50 hover:text-teal-600 transition-colors cursor-pointer"
                        >
                          + Add a Second Snack (Optional)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* Alternative Meal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900">Select Alternative {modalType}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-50/40 flex-1">
              {loadingAlts ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin text-teal-600 mx-auto mb-2" />
                  <span>Loading compatible options...</span>
                </div>
              ) : alternatives.length === 0 ? (
                <div className="text-center py-8 text-amber-700 bg-amber-50 rounded-xl text-xs font-semibold">
                  No other alternative recipes match the patient's dietary preference and allergy constraints.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {alternatives.map(alt => (
                    <div 
                      key={alt.templateId} 
                      className="bg-white border border-slate-200/80 rounded-2xl p-4 hover:border-teal-500 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                      onClick={() => selectAlternative(alt)}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-xs text-slate-900">{alt.name}</h4>
                          <span className="font-black text-teal-700 text-xs">{alt.calories} kcal</span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">{alt.description}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <div className="grid grid-cols-4 gap-1 text-[10px] text-slate-600 text-center mb-2">
                          <div>P: {alt.protein}g</div>
                          <div>C: {alt.carbohydrates}g</div>
                          <div>F: {alt.fat}g</div>
                          <div>Fib: {alt.fiber}g</div>
                        </div>
                        <button className="w-full py-1.5 bg-teal-50 text-teal-700 text-xs font-bold rounded-lg hover:bg-teal-600 hover:text-white transition cursor-pointer">
                          Select Recipe
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
