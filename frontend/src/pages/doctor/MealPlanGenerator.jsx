import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import { FaArrowLeft, FaSave, FaCheckCircle, FaExclamationTriangle, FaExchangeAlt, FaDownload, FaSpinner, FaTimes, FaUtensils } from 'react-icons/fa';
import { exportToPdf } from '../../utils/pdfExport';

export default function MealPlanGenerator() {
  const { id } = useParams(); // id could be "new" or a mealPlanId
  const location = useLocation();
  const navigate = useNavigate();

  const isNew = id === 'new';
  const queryParams = new URLSearchParams(location.search);
  const assessmentId = queryParams.get('assessment'); // required if isNew

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

  // Editable fields bound to local state before saving
  const [doctorInstructions, setDoctorInstructions] = useState('');
  const [exerciseRecommendation, setExerciseRecommendation] = useState('');
  const [waterTarget, setWaterTarget] = useState('');
  const [foodsToAvoid, setFoodsToAvoid] = useState(''); // comma separated string for UI
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
    // eslint-disable-next-line
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
    setExerciseRecommendation(data.exerciseRecommendation || '30 minutes of moderate activity daily.');
    setWaterTarget(data.waterTarget || '2.5 Liters');
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
      alert("Doctor Instructions are required.");
      return;
    }
    if (plan.medicalConditions?.length > 0 && !medicalAck) {
      alert("Please acknowledge the medical warning before approving.");
      return;
    }

    if (!window.confirm("Are you sure you want to approve this meal plan? After approval, this plan will be available to the patient.")) {
      return;
    }

    try {
      setLoading(true);
      // First save the draft to ensure DB has the latest fields
      if (isNew) {
         // Cannot approve a completely new un-saved plan directly in one step cleanly if the user hasn't saved.
         // Actually we can, just save it first.
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
    // Replace the meal in local state and recalculate totals locally for UI feedback.
    // The backend will re-verify on save.
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
      alert('Failed to export PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <DashboardLayout role="doctor"><div className="p-12 text-center text-slate-500"><FaSpinner className="animate-spin inline-block mr-2" /> Loading plan...</div></DashboardLayout>;
  if (error) return <DashboardLayout role="doctor"><div className="p-12 text-center text-red-500">{error}</div></DashboardLayout>;
  if (!plan) return null;

  return (
    <DashboardLayout role="doctor">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link to="/doctor/meals" className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 transition">
            <FaArrowLeft />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#172033]">
              {isNew ? 'Generate Meal Plan' : isReadOnly ? 'View Meal Plan' : 'Edit Draft Plan'}
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Patient: {plan.patientId?.fullName || 'Unknown'} | Status: <span className={isReadOnly ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>{plan.status || 'Unsaved'}</span>
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {isReadOnly ? (
            <button 
              onClick={handleDownloadPDF} 
              disabled={downloading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              {downloading ? <FaSpinner className="animate-spin" /> : <FaDownload />}
              {downloading ? 'Downloading...' : 'Download PDF'}
            </button>
          ) : (
            <>
              <button onClick={handleSaveDraft} className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 transition flex items-center gap-2">
                <FaSave /> Save as Draft
              </button>
              <button onClick={handleApprove} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition flex items-center gap-2">
                <FaCheckCircle /> Approve Plan
              </button>
            </>
          )}
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg">
          <ul className="list-disc pl-5">
            {warnings.map((w, idx) => <li key={idx} className="text-sm">{w}</li>)}
          </ul>
        </div>
      )}

      {plan.medicalConditions?.length > 0 && !isReadOnly && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg flex flex-col gap-2">
          <div className="flex items-center gap-2 font-bold"><FaExclamationTriangle /> Medical Condition Recorded</div>
          <p className="text-sm">This patient has recorded medical conditions ({plan.medicalConditions.join(', ')}). This suggested plan requires careful doctor review before approval.</p>
          <label className="flex items-center gap-2 text-sm mt-2 font-medium cursor-pointer">
            <input type="checkbox" checked={medicalAck} onChange={e => setMedicalAck(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
            I acknowledge this warning and have reviewed the meals.
          </label>
        </div>
      )}

      {/* Main Container - We apply ID here for PDF download */}
      <div id="pdf-content" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col - Patient Summary & Totals */}
        <div className="lg:col-span-1 space-y-6 avoid-break">
          
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 summary-card avoid-break">
            <h2 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Patient Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Name</span><span className="font-medium">{plan.patientId?.fullName}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">BMI</span><span className="font-medium text-indigo-600">{plan.bmi}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Class</span><span className="font-medium">{plan.obesityClass.replace(/_/g, ' ')}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Diet</span><span className="font-medium">{plan.dietaryPreference}</span></div>
              <div className="flex justify-between">
                <span className="text-slate-500">Allergies</span>
                <span className="font-medium text-red-500">{plan.allergies?.length ? plan.allergies.join(', ') : 'None'}</span>
              </div>
            </div>
            
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mt-6 mb-4">Calculations</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">BMR</span><span className="font-medium">{plan.bmr} kcal</span></div>
              <div className="flex justify-between"><span className="text-slate-500">TDEE</span><span className="font-medium">{plan.tdee} kcal</span></div>
              <div className="flex justify-between">
                <span className="text-slate-500">Suggested Target</span>
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 rounded">{plan.dailyCalorieTarget} kcal</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold text-slate-700">Selected Meal Total</span>
                <span className="text-lg font-black text-slate-900">{plan.totalMealCalories} kcal</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Difference</span>
                <span className={`font-bold ${plan.calorieDifference > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {plan.calorieDifference > 0 ? `+${plan.calorieDifference}` : plan.calorieDifference} kcal
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-blue-50 p-2 rounded text-blue-800"><b>Pro</b><br/>{plan.totalProtein}g</div>
              <div className="bg-green-50 p-2 rounded text-green-800"><b>Carb</b><br/>{plan.totalCarbohydrates}g</div>
              <div className="bg-yellow-50 p-2 rounded text-yellow-800"><b>Fat</b><br/>{plan.totalFat}g</div>
              <div className="bg-purple-50 p-2 rounded text-purple-800"><b>Fib</b><br/>{plan.totalFiber}g</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 avoid-break">
            <h2 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Doctor Recommendations</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Water Target</label>
                {isReadOnly ? <p className="text-sm">{waterTarget}</p> : 
                  <input type="text" value={waterTarget} onChange={e => setWaterTarget(e.target.value)} className="w-full text-sm border-slate-300 rounded p-2 focus:ring-indigo-500" />
                }
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Foods to Avoid</label>
                {isReadOnly ? <p className="text-sm text-red-600">{foodsToAvoid}</p> : 
                  <textarea value={foodsToAvoid} onChange={e => setFoodsToAvoid(e.target.value)} placeholder="Comma separated..." rows="2" className="w-full text-sm border-slate-300 rounded p-2 focus:ring-indigo-500"></textarea>
                }
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Exercise Recommendation</label>
                {isReadOnly ? <p className="text-sm">{exerciseRecommendation}</p> : 
                  <textarea value={exerciseRecommendation} onChange={e => setExerciseRecommendation(e.target.value)} rows="3" className="w-full text-sm border-slate-300 rounded p-2 focus:ring-indigo-500"></textarea>
                }
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Doctor Instructions <span className="text-red-500">*</span></label>
                {isReadOnly ? <p className="text-sm bg-indigo-50 p-3 rounded">{doctorInstructions}</p> : 
                  <textarea value={doctorInstructions} onChange={e => setDoctorInstructions(e.target.value)} rows="4" placeholder="Required before approval..." className="w-full text-sm border-indigo-300 bg-indigo-50 rounded p-2 focus:ring-indigo-500"></textarea>
                }
              </div>
            </div>
          </div>

        </div>

        {/* Right Col - Meal Cards */}
        <div className="lg:col-span-2 space-y-4">
          {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(type => {
            const mealsOfType = plan.meals.filter(m => m.mealType === type);
            
            return (
              <div key={type} className="meal-section meal-card avoid-break mb-6">
                <h3 className="font-black text-slate-800 text-lg mb-3 uppercase tracking-wide border-b-2 border-indigo-100 pb-1 inline-block">{type}</h3>
                
                {mealsOfType.length === 0 ? (
                  <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-sm font-medium">
                    <FaExclamationTriangle className="inline mr-2"/> Missing {type}. Doctor review is required.
                    {!isReadOnly && (
                      <button onClick={() => openChangeModal({ mealType: type })} className="ml-4 underline hover:text-red-800">Add {type}</button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mealsOfType.map((meal, idx) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 relative group transition-all hover:shadow-md avoid-break">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-lg text-slate-900">{meal.name}</h4>
                            <p className="text-sm text-slate-500 mt-1">{meal.description}</p>
                            <p className="text-xs font-bold text-indigo-600 mt-2 bg-indigo-50 inline-block px-2 py-1 rounded">Portion: {meal.portionSize}</p>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-2xl font-black text-slate-800">{meal.calories}</span>
                            <span className="text-sm text-slate-500 ml-1">kcal</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mt-4 text-xs font-medium text-slate-600 border-t border-slate-100 pt-3">
                          <div>Protein: <span className="text-slate-900">{meal.protein}g</span></div>
                          <div>Carbs: <span className="text-slate-900">{meal.carbohydrates}g</span></div>
                          <div>Fat: <span className="text-slate-900">{meal.fat}g</span></div>
                          <div>Fiber: <span className="text-slate-900">{meal.fiber}g</span></div>
                        </div>

                        <div className="mt-3 text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">Ingredients: </span> 
                          {meal.ingredients.join(', ')}
                        </div>

                        {!isReadOnly && (
                          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                            <button 
                              onClick={() => openChangeModal(meal)}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <FaExchangeAlt /> Change {type}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {plan.alternatives?.[type] && (
                      (() => {
                        const selectedNames = new Set(mealsOfType.map(m => m.name));
                        const alts = plan.alternatives[type].filter(a => !selectedNames.has(a.name));
                        if (alts.length === 0) return null;
                        return (
                          <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50/80 p-3.5 rounded-lg avoid-break">
                            <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <FaUtensils className="text-indigo-500 text-xs" />
                              Alternative Options for Daily Variety:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {alts.map((alt, aIdx) => (
                                <div key={aIdx} className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs avoid-break">
                                  <div className="flex justify-between items-start">
                                    <h5 className="text-xs font-bold text-slate-800 leading-tight">{alt.name}</h5>
                                    <span className="text-xs font-bold text-emerald-600 shrink-0 ml-1">{alt.calories} kcal</span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-1">{alt.portionSize}</p>
                                  <div className="flex gap-2 mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-600">
                                    <span><b>P:</b> {alt.protein}g</span>
                                    <span><b>C:</b> {alt.carbohydrates || alt.carbs}g</span>
                                    <span><b>F:</b> {alt.fat}g</span>
                                    <span><b>Fi:</b> {alt.fiber}g</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()
                    )}

                    {/* Allow adding a second snack */}
                    {type === 'Snack' && mealsOfType.length === 1 && !isReadOnly && (
                      <button 
                        onClick={() => openChangeModal({ mealType: 'Snack' })} // dummy meal obj
                        className="w-full py-3 border-2 border-dashed border-slate-300 text-slate-500 font-medium text-sm rounded-xl hover:bg-slate-50 hover:text-indigo-600 transition-colors"
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

      {/* Change Meal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800">Select Alternative {modalType}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700"><FaTimes className="text-xl"/></button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-100/50 flex-1">
              {loadingAlts ? (
                <div className="text-center py-12 text-slate-500"><FaSpinner className="animate-spin inline-block text-2xl mb-2" /><br/>Finding suitable options...</div>
              ) : alternatives.length === 0 ? (
                <div className="text-center py-12 text-amber-600 bg-amber-50 rounded-lg">No other suitable options found that match the patient's diet and allergy profile.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {alternatives.map(alt => (
                    <div key={alt.templateId} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-400 transition cursor-pointer" onClick={() => selectAlternative(alt)}>
                      <div className="flex justify-between mb-2">
                        <h4 className="font-bold text-slate-900">{alt.name}</h4>
                        <span className="font-black text-indigo-700">{alt.calories} kcal</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-3 line-clamp-2">{alt.description}</p>
                      <div className="grid grid-cols-4 gap-1 text-[10px] text-center mb-3">
                        <div className="bg-slate-50 p-1 rounded">P: {alt.protein}g</div>
                        <div className="bg-slate-50 p-1 rounded">C: {alt.carbohydrates}g</div>
                        <div className="bg-slate-50 p-1 rounded">F: {alt.fat}g</div>
                        <div className="bg-slate-50 p-1 rounded">Fib: {alt.fiber}g</div>
                      </div>
                      <button className="w-full py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-600 hover:text-white transition">Select</button>
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
