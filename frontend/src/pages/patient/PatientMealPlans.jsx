import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import { exportToPdf } from '../../utils/pdfExport';
import { FaUtensils, FaDownload, FaHistory, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

export default function PatientMealPlans() {
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const reportRef = useRef(null);

  useEffect(() => {
    fetchMealPlans();
  }, []);

  const fetchMealPlans = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/patient/meal-plans');
      setMealPlans(res.data.data);
    } catch (err) {
      setError('Failed to load meal plans.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      setDownloading(true);
      await exportToPdf(reportRef.current, {
        filename: `Meal_Plan_${currentPlan._id.slice(-6)}.pdf`,
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

  const currentPlan = mealPlans.length > 0 ? mealPlans[0] : null;
  const historyPlans = mealPlans.length > 1 ? mealPlans.slice(1) : [];

  return (
    <DashboardLayout role="patient">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172033]">My Meal Plan</h1>
          <p className="text-sm text-[#64748B] mt-1">View your active approved meal plan recommended by your doctor.</p>
        </div>
        {historyPlans.length > 0 && (
          <button 
            onClick={() => setShowHistoryModal(true)}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition flex items-center gap-2"
          >
            <FaHistory /> View Previous Plans
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading meal plan...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : !currentPlan ? (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 text-center">
          <FaUtensils className="mx-auto text-5xl text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">No Meal Plan Available</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            No approved meal plan is available yet. Your doctor will review and approve a plan after your assessment.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-6">
          
          <div className="px-6 py-4 border-b border-slate-200 bg-emerald-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="font-bold text-lg text-emerald-800 flex items-center gap-2">
              <FaCheckCircle /> Active Approved Plan
            </h2>
            <button 
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2 disabled:opacity-50"
            >
              <FaDownload /> {downloading ? 'Downloading...' : 'Download PDF'}
            </button>
          </div>

          <div className="p-6" ref={reportRef}>
            
            {/* PAGE 1: Prescription & Nutrition Plan Overview */}
            <div className="summary-card avoid-break mb-10">
              {/* Summary Information */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 border-b border-slate-100 pb-8">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Doctor</p>
                  <p className="font-bold text-slate-900">Dr. {currentPlan.doctorId?.fullName || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Approved Date</p>
                  <p className="font-bold text-slate-900">{new Date(currentPlan.approvedAt || currentPlan.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Obesity Class</p>
                  <p className="font-bold text-emerald-700 capitalize">{currentPlan.assessmentId?.obesityClass?.replace(/_/g, ' ') || currentPlan.obesityClass?.replace(/_/g, ' ') || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Plan ID</p>
                  <p className="font-mono text-sm text-slate-700">{currentPlan._id.slice(-8).toUpperCase()}</p>
                </div>
              </div>

              {/* Calories and Macros Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                
                <div className="lg:col-span-1 bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800 uppercase mb-4 text-center">Calorie Target</h3>
                  <div className="text-center mb-4">
                    <p className="text-4xl font-black text-emerald-600">{currentPlan.dailyCalorieTarget || 0}</p>
                    <p className="text-xs text-slate-500 mt-1 uppercase font-bold">Daily Kcal</p>
                  </div>
                  <div className="space-y-2 text-sm border-t border-slate-200 pt-4">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Selected Meals</span>
                      <span className="font-bold">
                        {currentPlan.totalMealCalories ?? currentPlan.totalCalories ?? (currentPlan.meals?.reduce((sum, m) => sum + (m.calories || 0), 0) || 0)} kcal
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Difference</span>
                      <span className="font-semibold">
                        {(() => {
                          const total = currentPlan.totalMealCalories ?? currentPlan.totalCalories ?? (currentPlan.meals?.reduce((sum, m) => sum + (m.calories || 0), 0) || 0);
                          const target = currentPlan.dailyCalorieTarget || 0;
                          const diff = currentPlan.calorieDifference ?? (total - target);
                          return `${diff > 0 ? '+' : ''}${diff} kcal`;
                        })()}
                      </span>
                    </div>
                    {currentPlan.waterTarget && (
                      <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                        <span className="text-blue-600 font-bold">Water Target</span>
                        <span className="font-bold">{currentPlan.waterTarget}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-2 bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800 uppercase mb-4">Macronutrient Summary</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white p-3 rounded-lg border border-slate-100 text-center">
                      <p className="text-xs text-slate-500 font-bold uppercase mb-1">Protein</p>
                      <p className="text-xl font-bold text-slate-800">{currentPlan.totalProtein ?? 0}g</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-100 text-center">
                      <p className="text-xs text-slate-500 font-bold uppercase mb-1">Carbs</p>
                      <p className="text-xl font-bold text-slate-800">{currentPlan.totalCarbohydrates ?? currentPlan.totalCarbs ?? 0}g</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-100 text-center">
                      <p className="text-xs text-slate-500 font-bold uppercase mb-1">Fat</p>
                      <p className="text-xl font-bold text-slate-800">{currentPlan.totalFat ?? 0}g</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-100 text-center">
                      <p className="text-xs text-slate-500 font-bold uppercase mb-1">Fiber</p>
                      <p className="text-xl font-bold text-slate-800">{currentPlan.totalFiber ?? 0}g</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Additional Guidance & Doctor Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {currentPlan.doctorInstructions && (
                  <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
                    <h3 className="text-sm font-bold text-blue-900 uppercase mb-2">Doctor Instructions</h3>
                    <p className="text-sm text-blue-800">{currentPlan.doctorInstructions}</p>
                  </div>
                )}
                {currentPlan.foodsToAvoid && currentPlan.foodsToAvoid.length > 0 && (
                  <div className="bg-rose-50 border border-rose-100 p-5 rounded-xl">
                    <h3 className="text-sm font-bold text-rose-900 uppercase mb-2">Foods to Avoid</h3>
                    <ul className="list-disc pl-5 text-sm text-rose-800">
                      {currentPlan.foodsToAvoid.map((food, i) => <li key={i}>{food}</li>)}
                    </ul>
                  </div>
                )}
                {currentPlan.exerciseRecommendation && (
                  <div className="bg-teal-50 border border-teal-100 p-5 rounded-xl">
                    <h3 className="text-sm font-bold text-teal-900 uppercase mb-2">Exercise / Lifestyle</h3>
                    <p className="text-sm text-teal-800">{currentPlan.exerciseRecommendation}</p>
                  </div>
                )}
                {currentPlan.medicalWarning && (
                  <div className="bg-amber-50 border border-amber-200 p-5 rounded-xl">
                    <h3 className="text-sm font-bold text-amber-900 uppercase mb-2 flex items-center gap-2">
                      <FaExclamationCircle /> Medical Warning
                    </h3>
                    <p className="text-sm text-amber-800 font-medium">{currentPlan.medicalWarning}</p>
                  </div>
                )}
              </div>

              {/* Disclaimer */}
              <div className="text-center pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500 font-medium max-w-2xl mx-auto">
                  <strong>Disclaimer:</strong> Follow this plan according to your doctor's instructions. Contact your doctor before making significant changes.
                </p>
              </div>
            </div>

            {/* PAGE 2+: Daily Meals Schedule */}
            <div className="page-break-before mb-10">
              <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Daily Meals</h3>
              <div className="space-y-6">
                {currentPlan.meals.map((meal, idx) => (
                  <div key={idx} className={`meal-card avoid-break border border-slate-200 rounded-xl p-5 bg-white shadow-2xs ${idx > 0 ? 'page-break-before' : ''}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold uppercase rounded mb-2">
                          {meal.mealType}
                        </span>
                        <h4 className="text-lg font-bold text-slate-900">{meal.name}</h4>
                        <p className="text-sm text-slate-600 mt-1">{meal.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-emerald-600">{meal.calories} kcal</p>
                        <p className="text-xs text-slate-500 font-medium">Portion: {meal.portionSize}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-4 bg-slate-50 p-2.5 rounded border border-slate-100 text-center text-xs">
                      <div><span className="text-slate-500 font-bold">P:</span> {meal.protein}g</div>
                      <div><span className="text-slate-500 font-bold">C:</span> {meal.carbohydrates ?? meal.carbs ?? 0}g</div>
                      <div><span className="text-slate-500 font-bold">F:</span> {meal.fat}g</div>
                      <div><span className="text-slate-500 font-bold">Fi:</span> {meal.fiber}g</div>
                    </div>

                    <div className="text-sm">
                      {meal.ingredients && meal.ingredients.length > 0 && (
                        <p className="mb-1"><span className="font-bold text-slate-700">Ingredients:</span> <span className="text-slate-600">{meal.ingredients.join(', ')}</span></p>
                      )}
                      {meal.allergens && meal.allergens.length > 0 && (
                        <p><span className="font-bold text-rose-600">Allergens:</span> <span className="text-slate-600">{meal.allergens.join(', ')}</span></p>
                      )}
                    </div>

                    {currentPlan.alternatives?.[meal.mealType] && (
                      (() => {
                        const alts = currentPlan.alternatives[meal.mealType].filter(
                          alt => String(alt.templateId || alt._id) !== String(meal.templateId || meal._id) && alt.name !== meal.name
                        );
                        if (alts.length === 0) return null;
                        return (
                          <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50/90 p-3.5 rounded-lg avoid-break">
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
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-lg text-slate-800">Previous Approved Plans</h2>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto">
              {historyPlans.map((plan) => (
                <div key={plan._id} className="border border-slate-200 rounded-lg p-4 mb-4 flex justify-between items-center bg-slate-50">
                  <div>
                    <p className="text-xs font-bold text-slate-500 mb-1">Approved: {new Date(plan.approvedAt || plan.createdAt).toLocaleDateString()}</p>
                    <p className="font-bold text-slate-800">Target: {plan.dailyCalorieTarget} kcal</p>
                    <p className="text-sm text-slate-600">Dr. {plan.doctorId?.fullName || 'Unknown'}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded mb-2">
                      {plan.status}
                    </span>
                    <p className="text-xs text-slate-400">ID: {plan._id.slice(-6).toUpperCase()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
