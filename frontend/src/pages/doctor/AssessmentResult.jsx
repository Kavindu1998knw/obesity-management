import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import {
  ArrowLeft,
  Save,
  Utensils,
  FileDown,
  Info,
  Loader2,
  Activity,
  CheckCircle2,
  Scale,
  Ruler,
  User,
  Calendar
} from 'lucide-react';
import { exportToPdf } from '../../utils/pdfExport';

function getObesityBadge(cls) {
  if (!cls || cls === 'Not Assessed') return 'bg-slate-100 text-slate-600 border-slate-200';
  if (cls.includes('Obesity_Type_II') || cls.includes('Obesity_Type_III')) return 'bg-rose-50 text-rose-700 border-rose-200';
  if (cls.includes('Obesity') || cls.includes('Overweight')) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (cls === 'Normal_Weight') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (cls === 'Insufficient_Weight') return 'bg-sky-50 text-sky-700 border-sky-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

export default function AssessmentResult() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isPreview = id === 'preview';
  
  const [assessment, setAssessment] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [doctorNote, setDoctorNote] = useState('');

  useEffect(() => {
    if (isPreview) {
      if (!location.state?.assessmentData) {
        navigate('/doctor/assessments/new');
        return;
      }
      const data = location.state.assessmentData;
      setAssessment(data);
      
      apiClient.get('/doctor/patients')
        .then(res => {
          const p = res.data.data.find(pat => pat._id === data.patientId);
          setPatient(p ? { fullName: p.name } : { fullName: 'Unknown Patient' });
        })
        .finally(() => setLoading(false));
    } else {
      fetchAssessmentDetails();
    }
  }, [id]);

  const fetchAssessmentDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/doctor/assessments/${id}`);
      setAssessment(response.data.data);
    } catch {
      setError('Failed to load assessment details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        patientId: assessment.patientId,
        inputs: assessment.inputs,
        height: assessment.height,
        weight: assessment.weight,
        bmi: assessment.bmi,
        mealPlanRequirements: assessment.mealPlanRequirements,
        prediction: assessment.prediction,
        doctorNote
      };
      
      const response = await apiClient.post('/doctor/assessments/save', payload);
      navigate(`/doctor/assessments/${response.data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save assessment.');
      setSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const safePatientName = (assessment.patientId?.fullName || patient?.fullName || 'Patient').replace(/\s+/g, '_');
      const filename = `Assessment_${safePatientName}_${assessment._id ? assessment._id.slice(-6) : 'Report'}.pdf`;
      await exportToPdf('assessment-result-content', {
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
          <span className="text-xs font-medium">Loading prediction outcome...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !assessment) {
    return (
      <DashboardLayout role="doctor">
        <div className="p-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-center text-xs font-medium">
          {error || 'Assessment not found'}
        </div>
      </DashboardLayout>
    );
  }

  const obesityClass = assessment.prediction ? assessment.prediction.obesityClass : assessment.obesityClass;

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-6 pb-12">
        
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link 
              to={isPreview ? "/doctor/assessments/new" : "/doctor/assessments"} 
              className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-500 hover:text-teal-600 hover:border-teal-200 transition-colors shadow-2xs"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {isPreview ? 'Prediction Preview' : 'Assessment Result'}
                </h1>
                {assessment._id && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-semibold uppercase">
                    #{assessment._id.slice(-6).toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isPreview ? 'Review the Random Forest ML prediction before recording into health profile.' : `Captured on ${new Date(assessment.createdAt).toLocaleString()}`}
              </p>
            </div>
          </div>
          
          {!isPreview && (
            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <button 
                onClick={handleDownloadPDF} 
                disabled={downloading}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" /> : <FileDown className="w-3.5 h-3.5 text-teal-600" />}
                <span>{downloading ? 'Exporting PDF...' : 'Download PDF'}</span>
              </button>
              <Link 
                to={`/doctor/meals/new?assessment=${assessment._id}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Generate Meal Plan</span>
              </Link>
            </div>
          )}
        </div>

        {/* Content Layout */}
        <div id="assessment-result-content" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Hero Card & Notes */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Hero Prediction Card */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 sm:p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-500 to-emerald-500"></div>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-100 mb-3">
                <Activity className="w-3.5 h-3.5" />
                <span>AI Random Forest Classification</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1 capitalize">
                {obesityClass ? obesityClass.replace(/_/g, ' ') : 'Unknown'}
              </h2>
              
              <div className="mt-2 flex justify-center">
                <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold border ${getObesityBadge(obesityClass)}`}>
                  Clinical Risk Level: {obesityClass ? obesityClass.replace(/_/g, ' ') : 'N/A'}
                </span>
              </div>

              {/* 3 Metric Badges */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Calculated BMI</p>
                  <p className="text-xl font-bold text-slate-900 mt-0.5">{assessment.bmi} <span className="text-xs text-slate-400 font-normal">kg/m²</span></p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Recorded Weight</p>
                  <p className="text-xl font-bold text-slate-900 mt-0.5">{assessment.weight} <span className="text-xs text-slate-400 font-normal">kg</span></p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Recorded Height</p>
                  <p className="text-xl font-bold text-slate-900 mt-0.5">{(assessment.height * 100).toFixed(0)} <span className="text-xs text-slate-400 font-normal">cm</span></p>
                </div>
              </div>
            </div>

            {/* Doctor Note Section (Save Form for Preview or Read-Only for Saved) */}
            {isPreview && (
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-4">
                <div className="border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Doctor Observations & Recommendations</h3>
                  <p className="text-[11px] text-slate-500">Attach clinical remarks prior to committing prediction to patient records.</p>
                </div>

                <textarea 
                  rows={3}
                  value={doctorNote}
                  onChange={(e) => setDoctorNote(e.target.value)}
                  placeholder="Record diagnosis insights, clinical verification notes, or targeted calorie suggestions..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none placeholder:text-slate-400"
                />
                
                <div className="flex justify-end pt-1">
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save & Record Assessment</span>
                  </button>
                </div>
              </div>
            )}

            {!isPreview && assessment.doctorNote && (
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 space-y-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Doctor Consultation Note</h3>
                <p className="text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
                  {assessment.doctorNote}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Context & Disclaimers */}
          <div className="space-y-6">
            
            {/* Patient Context Card */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-2">
                <User className="w-4 h-4 text-teal-600" />
                Patient Information
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Full Name:</span>
                  <span className="font-bold text-slate-900">
                    {isPreview ? (patient?.fullName || 'Unknown') : (assessment.patientId?.fullName || 'Unknown')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date Assessed:</span>
                  <span className="font-semibold text-slate-800">
                    {isPreview ? new Date().toLocaleDateString() : new Date(assessment.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Feature Importance Card */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
                Key AI Predictive Factors
              </h3>
              <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4 leading-relaxed">
                <li><strong className="text-slate-800">Weight & Height (BMI):</strong> Primary physiological determinants.</li>
                <li><strong className="text-slate-800">Family Genetic History:</strong> Significant risk multiplier for predisposed individuals.</li>
                <li><strong className="text-slate-800">High-Calorie Food (FAVC):</strong> Direct impact on energy balance.</li>
                <li><strong className="text-slate-800">Physical Activity Score:</strong> Balances sedentary screen time against active movement.</li>
              </ul>
            </div>



          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
