import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import { exportToPdf } from '../../utils/pdfExport';
import {
  Utensils,
  FileDown,
  History,
  CheckCircle2,
  AlertTriangle,
  X,
  Droplets,
  HeartPulse,
  Loader2,
  Sparkles
} from 'lucide-react';

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
    } catch {
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
      <div className="space-y-6 pb-12">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-xs">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Personalized Nutrition Plan</h1>
                <p className="text-xs text-slate-500 mt-0.5">Doctor-approved dietary guidelines, caloric targets, and daily meal schedules.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {historyPlans.length > 0 && (
              <button 
                onClick={() => setShowHistoryModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>Previous Plans ({historyPlans.length})</span>
              </button>
            )}
            {currentPlan && (
              <button 
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                <span>{downloading ? 'Preparing PDF...' : 'Download PDF'}</span>
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center h-80 text-slate-400 space-y-2">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-medium">Loading nutritional guidelines...</span>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-center text-xs font-medium">
            {error}
          </div>
        ) : !currentPlan ? (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto border border-teal-100">
              <Utensils className="w-7 h-7 stroke-[1.5]" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">No Active Meal Plan Available</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Your customized nutrition plan has not been published yet. Your doctor will configure and approve your daily meal target following your clinical assessment.
            </p>
          </div>
        ) : (
          <div className="space-y-6" ref={reportRef}>
            
            {/* Active Plan Overview Card */}
            <div className="summary-card avoid-break avoid-page-break print-avoid-break bg-white border border-slate-100 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
              
              {/* Plan Metadata Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Active Approved Plan</span>
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-semibold uppercase">
                      #{currentPlan._id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Clinical Dietary Target for {currentPlan.assessmentId?.obesityClass?.replace(/_/g, ' ') || currentPlan.obesityClass?.replace(/_/g, ' ') || 'Assigned Profile'}
                  </h2>
                </div>

                <div className="text-right text-xs">
                  <p className="text-slate-400">Prescribed By</p>
                  <p className="font-bold text-slate-900 mt-0.5">Dr. {currentPlan.doctorId?.fullName || 'Specialist'}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Approved: {new Date(currentPlan.approvedAt || currentPlan.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Caloric Target & Macros Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left: Calorie Target Card */}
                <div className="bg-gradient-to-br from-teal-50/60 to-slate-50 border border-teal-100 rounded-2xl p-5 text-center flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">Prescribed Daily Target</p>
                    <p className="text-4xl font-black text-teal-700 mt-1">{currentPlan.dailyCalorieTarget || 0}</p>
                    <p className="text-xs text-slate-500 font-medium">kcal per day</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-teal-100/80 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Selected Meals:</span>
                      <span className="font-bold text-slate-800">
                        {currentPlan.totalMealCalories ?? currentPlan.totalCalories ?? (currentPlan.meals?.reduce((sum, m) => sum + (m.calories || 0), 0) || 0)} kcal
                      </span>
                    </div>
                    {currentPlan.waterTarget && (
                      <div className="flex justify-between items-center text-teal-800 font-semibold pt-1">
                        <span className="flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-teal-600" /> Water Target:</span>
                        <span>{currentPlan.waterTarget}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Macronutrient Breakdown */}
                <div className="lg:col-span-2 bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Daily Macronutrient Target Ratios
                  </h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 text-center shadow-2xs">
                      <span className="text-[10px] font-bold text-teal-600 uppercase block">Protein</span>
                      <span className="text-xl font-black text-slate-900 mt-0.5 block">{currentPlan.totalProtein ?? 0}g</span>
                      <span className="text-[10px] text-slate-400">Muscle support</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 text-center shadow-2xs">
                      <span className="text-[10px] font-bold text-sky-600 uppercase block">Carbohydrates</span>
                      <span className="text-xl font-black text-slate-900 mt-0.5 block">{currentPlan.totalCarbohydrates ?? currentPlan.totalCarbs ?? 0}g</span>
                      <span className="text-[10px] text-slate-400">Energy source</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 text-center shadow-2xs">
                      <span className="text-[10px] font-bold text-amber-600 uppercase block">Healthy Fats</span>
                      <span className="text-xl font-black text-slate-900 mt-0.5 block">{currentPlan.totalFat ?? 0}g</span>
                      <span className="text-[10px] text-slate-400">Hormonal balance</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 text-center shadow-2xs">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase block">Dietary Fiber</span>
                      <span className="text-xl font-black text-slate-900 mt-0.5 block">{currentPlan.totalFiber ?? 0}g</span>
                      <span className="text-[10px] text-slate-400">Digestive health</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Doctor Guidance & Foods to Avoid Callouts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {currentPlan.doctorInstructions && (
                  <div className="bg-teal-50/70 border border-teal-100 p-4 rounded-2xl space-y-1">
                    <h4 className="font-bold text-teal-950 uppercase tracking-wide flex items-center gap-1.5">
                      <HeartPulse className="w-3.5 h-3.5 text-teal-600" />
                      <span>Doctor Instructions</span>
                    </h4>
                    <p className="text-teal-900 leading-relaxed font-medium">{currentPlan.doctorInstructions}</p>
                  </div>
                )}

                {currentPlan.foodsToAvoid && currentPlan.foodsToAvoid.length > 0 && (
                  <div className="bg-rose-50/80 border border-rose-100 p-4 rounded-2xl space-y-1">
                    <h4 className="font-bold text-rose-900 uppercase tracking-wide flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Foods to Strictly Avoid</span>
                    </h4>
                    <ul className="list-disc pl-4 text-rose-800 space-y-0.5">
                      {currentPlan.foodsToAvoid.map((food, i) => <li key={i}>{food}</li>)}
                    </ul>
                  </div>
                )}
              </div>

            </div>

            {/* Daily Meals Schedule */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
                <Utensils className="w-4 h-4 text-teal-600" />
                <span>Daily Meal Breakdown & Recipes</span>
              </h3>

              <div className="space-y-6">
                {currentPlan.meals.map((meal, idx) => (
                  <div key={idx} className="meal-card avoid-break avoid-page-break print-avoid-break bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 font-bold text-[10px] uppercase border border-teal-100 mb-1.5">
                          {meal.mealType}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{meal.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{meal.description}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-lg font-black text-slate-900">{meal.calories}</span>
                        <span className="text-xs text-slate-400 ml-1">kcal</span>
                        <p className="text-[11px] text-teal-700 font-bold mt-0.5">Portion: {meal.portionSize}</p>
                      </div>
                    </div>

                    {/* Macronutrient breakdown */}
                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                      <div>Protein: <span className="font-bold text-slate-800">{meal.protein}g</span></div>
                      <div>Carbs: <span className="font-bold text-slate-800">{meal.carbohydrates ?? meal.carbs ?? 0}g</span></div>
                      <div>Fat: <span className="font-bold text-slate-800">{meal.fat}g</span></div>
                      <div>Fiber: <span className="font-bold text-slate-800">{meal.fiber}g</span></div>
                    </div>

                    {meal.ingredients && meal.ingredients.length > 0 && (
                      <div className="text-[11px] text-slate-500 pt-1">
                        <span className="font-semibold text-slate-700">Ingredients: </span>
                        {meal.ingredients.join(', ')}
                      </div>
                    )}

                    {/* Alternative Options Sub-section */}
                    {currentPlan.alternatives?.[meal.mealType] && (
                      (() => {
                        const alts = currentPlan.alternatives[meal.mealType].filter(
                          alt => String(alt.templateId || alt._id) !== String(meal.templateId || meal._id) && alt.name !== meal.name
                        );
                        if (alts.length === 0) return null;
                        return (
                          <div className="mt-3 pt-3 border-t border-slate-200 bg-slate-50 p-4 rounded-xl space-y-2.5">
                            <p className="text-xs font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                              <span>Alternative Options for Daily Variety:</span>
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {alts.map((alt, aIdx) => (
                                <div key={aIdx} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                                  <div className="flex justify-between items-start gap-1.5">
                                    <h5 className="text-xs font-bold text-slate-900 leading-snug break-words flex-1">{alt.name}</h5>
                                    <span className="text-xs font-bold text-teal-700 shrink-0 whitespace-nowrap">{alt.calories} kcal</span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 font-medium">{alt.portionSize}</p>
                                  <div className="flex gap-2.5 pt-1.5 border-t border-slate-100 text-[11px] text-slate-700">
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
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={() => setShowHistoryModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900">Archived Meal Plans</h3>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3">
              {historyPlans.map((plan) => (
                <div key={plan._id} className="border border-slate-200 rounded-xl p-4 flex justify-between items-center bg-slate-50 hover:bg-slate-100 transition-colors text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">
                      Approved on {new Date(plan.approvedAt || plan.createdAt).toLocaleDateString()}
                    </span>
                    <p className="font-bold text-slate-900">Target: {plan.dailyCalorieTarget} kcal/day</p>
                    <p className="text-slate-500 mt-0.5">Dr. {plan.doctorId?.fullName || 'Assigned Specialist'}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                      {plan.status}
                    </span>
                    <p className="font-mono text-[10px] text-slate-400 mt-1">#{plan._id.slice(-6).toUpperCase()}</p>
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
