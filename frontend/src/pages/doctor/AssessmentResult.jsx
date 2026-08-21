import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import { FaArrowLeft, FaSave, FaUtensils, FaDownload, FaInfoCircle, FaSpinner } from 'react-icons/fa';
import { exportToPdf } from '../../utils/pdfExport';

export default function AssessmentResult() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // If id is 'preview', we look for data in location.state
  const isPreview = id === 'preview';
  
  const [assessment, setAssessment] = useState(null);
  const [patient, setPatient] = useState(null); // Used mainly for preview mode to get full name
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
      // Fetch patient details to display name in preview
      apiClient.get(`/doctor/patients`)
        .then(res => {
          const p = res.data.data.find(pat => pat._id === data.patientId);
          setPatient(p ? { fullName: p.name } : { fullName: 'Unknown Patient' });
        })
        .finally(() => setLoading(false));
    } else {
      fetchAssessmentDetails();
    }
    // eslint-disable-next-line
  }, [id]);

  const fetchAssessmentDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/doctor/assessments/${id}`);
      setAssessment(response.data.data);
    } catch (err) {
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
      // Navigate to the saved assessment view
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
        <div className="p-12 text-center text-slate-500"><FaSpinner className="animate-spin inline-block mr-2" /> Loading result...</div>
      </DashboardLayout>
    );
  }

  if (error || !assessment) {
    return (
      <DashboardLayout role="doctor">
        <div className="p-12 text-center text-red-500">{error || 'Assessment not found'}</div>
      </DashboardLayout>
    );
  }

  const obesityClass = assessment.prediction ? assessment.prediction.obesityClass : assessment.obesityClass;

  return (
    <DashboardLayout role="doctor">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link to={isPreview ? "/doctor/assessments/new" : "/doctor/assessments"} className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
            <FaArrowLeft />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#172033]">
              {isPreview ? 'Prediction Preview' : 'Assessment Result'}
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              {isPreview ? 'Review the AI prediction before saving.' : `Assessment ID: ${assessment._id}`}
            </p>
          </div>
        </div>
        
        {!isPreview && (
          <div className="flex gap-2">
            <button 
              onClick={handleDownloadPDF} 
              disabled={downloading}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition flex items-center gap-2"
            >
              {downloading ? <FaSpinner className="animate-spin" /> : <FaDownload />}
              {downloading ? 'Downloading...' : 'Download Report'}
            </button>
            <Link 
              to={`/doctor/meals/new?assessment=${assessment._id}`}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition flex items-center gap-2"
            >
              <FaUtensils /> Generate Meal Plan
            </Link>
          </div>
        )}
      </div>

      <div id="assessment-result-content" className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-50 p-2 rounded-xl">
        
        {/* Left Column - Main Prediction */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 text-center relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500"></div>
            
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Predicted Obesity Level</h2>
            <div className="text-4xl font-black text-indigo-900 mb-4 capitalize">
              {obesityClass.replace(/_/g, ' ')}
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase mb-1">BMI</p>
                <p className="text-2xl font-bold text-slate-800">{assessment.bmi}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase mb-1">Weight</p>
                <p className="text-xl font-bold text-slate-800">{assessment.weight} kg</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase mb-1">Height</p>
                <p className="text-xl font-bold text-slate-800">{(assessment.height * 100).toFixed(0)} cm</p>
              </div>
            </div>
          </div>

          {isPreview && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Add Doctor Note</h3>
              <textarea 
                rows="3"
                value={doctorNote}
                onChange={(e) => setDoctorNote(e.target.value)}
                placeholder="Add any clinical observations or comments regarding this prediction..."
                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500"
              ></textarea>
              
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-70 flex items-center gap-2"
                >
                  {saving ? 'Saving...' : <><FaSave /> Save Assessment</>}
                </button>
              </div>
            </div>
          )}

          {!isPreview && assessment.doctorNote && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-2">Doctor Note</h3>
              <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-lg border border-slate-100">
                {assessment.doctorNote}
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Context & Disclaimer */}
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FaInfoCircle className="text-indigo-500 text-lg" /> Patient Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Name:</span>
                <span className="font-medium text-slate-900">
                  {isPreview ? (patient?.fullName || 'Unknown') : (assessment.patientId?.fullName || 'Unknown')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-medium text-slate-900">
                  {isPreview ? new Date().toLocaleDateString() : new Date(assessment.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4">Important factors generally used by the model</h3>
            <ul className="text-sm text-slate-600 space-y-3 list-disc pl-5">
              <li><strong>Weight & Height (BMI):</strong> The strongest indicators of obesity classification.</li>
              <li><strong>Gender & Age:</strong> Demographic factors influencing metabolic rates.</li>
              <li><strong>Physical Activity Score:</strong> Calculated from activity frequency (FAF) minus technology usage time (TUE).</li>
              <li><strong>Family History:</strong> Genetic predisposition significantly affects risk.</li>
              <li><strong>Eating Habits:</strong> Frequent consumption of high-calorie food (FAVC) and food between meals (CAEC).</li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <h4 className="text-amber-800 font-bold text-sm mb-2 flex items-center gap-2">
              <FaInfoCircle /> Disclaimer
            </h4>
            <p className="text-amber-700 text-xs leading-relaxed">
              This prediction provides decision-support information based on a Random Forest machine learning model and does not replace professional medical diagnosis. Please review the inputs and confidence scores before making clinical decisions.
            </p>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
