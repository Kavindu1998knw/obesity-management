import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import { exportToPdf } from '../../utils/pdfExport';
import { FaStethoscope, FaEye, FaDownload, FaFilter, FaTriangleExclamation } from 'react-icons/fa6';

export default function PatientAssessments() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [dateFilter, setDateFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');

  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const reportRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [patientProfile, setPatientProfile] = useState(null);

  useEffect(() => {
    fetchAssessments();
    fetchPatientProfile();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/patient/assessments');
      setAssessments(res.data.data);
    } catch (err) {
      setError('Failed to load assessments.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientProfile = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setPatientProfile(JSON.parse(userStr));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatObesityClass = (val) => {
    if (!val) return '';
    return val.replace(/_/g, ' ');
  };

  const openViewModal = (assessment) => {
    setSelectedAssessment(assessment);
    setShowModal(true);
  };

  const closeViewModal = () => {
    setShowModal(false);
    setSelectedAssessment(null);
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    try {
      setDownloading(true);
      await exportToPdf(reportRef.current, {
        filename: `Assessment_Report_${selectedAssessment._id.slice(-6)}.pdf`,
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

  const filteredAssessments = assessments.filter(a => {
    const matchesDate = dateFilter ? new Date(a.createdAt).toISOString().split('T')[0] === dateFilter : true;
    const matchesClass = classFilter ? a.obesityClass === classFilter : true;
    return matchesDate && matchesClass;
  });

  const latestAssessment = assessments.length > 0 ? assessments[0] : null;

  return (
    <DashboardLayout role="patient">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172033]">My Assessments</h1>
          <p className="text-sm text-[#64748B] mt-1">Review your obesity assessments and predictions from your doctor.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading assessments...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : (
        <>
          {/* Latest Assessment Card */}
          {latestAssessment && (
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl shadow-md mb-8 text-white overflow-hidden">
              <div className="p-6 sm:p-8 relative">
                <FaStethoscope className="absolute right-[-20px] bottom-[-20px] text-[120px] text-white/10" />
                <h2 className="text-sm font-bold text-indigo-100 tracking-wider uppercase mb-6 border-b border-white/20 pb-2">Latest Assessment</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                  <div>
                    <p className="text-indigo-200 text-xs font-bold uppercase mb-1">Date</p>
                    <p className="text-lg font-bold">{new Date(latestAssessment.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-indigo-200 text-xs font-bold uppercase mb-1">Doctor</p>
                    <p className="text-lg font-bold">Dr. {latestAssessment.doctorId?.fullName || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-indigo-200 text-xs font-bold uppercase mb-1">Measurements</p>
                    <p className="text-sm font-medium">{latestAssessment.weight} kg, {latestAssessment.height} cm</p>
                    <p className="text-sm font-bold mt-0.5">BMI: {latestAssessment.bmi}</p>
                  </div>
                  <div>
                    <p className="text-indigo-200 text-xs font-bold uppercase mb-1">Prediction</p>
                    <p className="text-xl font-black text-white capitalize leading-tight">
                      {formatObesityClass(latestAssessment.obesityClass)}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex justify-end relative z-10">
                  <button 
                    onClick={() => openViewModal(latestAssessment)}
                    className="px-6 py-2 bg-white text-indigo-700 font-bold rounded-lg shadow hover:bg-indigo-50 transition"
                  >
                    View Full Result
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Assessment History */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="font-bold text-slate-800">Assessment History</h3>
              
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <FaFilter className="text-slate-400" />
                  <select 
                    value={classFilter} 
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="w-full sm:w-auto border border-slate-300 rounded-lg text-sm px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Classifications</option>
                    <option value="Insufficient_Weight">Insufficient Weight</option>
                    <option value="Normal_Weight">Normal Weight</option>
                    <option value="Overweight_Level_I">Overweight Level I</option>
                    <option value="Overweight_Level_II">Overweight Level II</option>
                    <option value="Obesity_Type_I">Obesity Type I</option>
                    <option value="Obesity_Type_II">Obesity Type II</option>
                    <option value="Obesity_Type_III">Obesity Type III</option>
                  </select>
                </div>
                <input 
                  type="date" 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full sm:w-auto border border-slate-300 rounded-lg text-sm px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-bold">Assessment ID</th>
                    <th className="px-6 py-4 font-bold">Date</th>
                    <th className="px-6 py-4 font-bold">Doctor</th>
                    <th className="px-6 py-4 font-bold">BMI</th>
                    <th className="px-6 py-4 font-bold">Prediction</th>
                    <th className="px-6 py-4 font-bold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAssessments.length > 0 ? filteredAssessments.map(appt => (
                    <tr key={appt._id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {appt._id.substring(appt._id.length - 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4">
                        {new Date(appt.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        Dr. {appt.doctorId?.fullName || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 font-bold">
                        {appt.bmi}
                      </td>
                      <td className="px-6 py-4 capitalize font-medium text-indigo-700">
                        {formatObesityClass(appt.obesityClass)}
                      </td>
                      <td className="px-6 py-4 flex justify-center gap-2">
                        <button 
                          onClick={() => openViewModal(appt)}
                          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition"
                          title="View Assessment"
                        >
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                        <FaStethoscope className="mx-auto text-4xl text-slate-300 mb-3" />
                        <p className="font-medium">No assessments found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* View Assessment Modal */}
      {showModal && selectedAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
              <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <FaStethoscope className="text-indigo-600" /> Assessment Result
              </h2>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-sm font-bold rounded transition disabled:opacity-50"
                >
                  <FaDownload /> {downloading ? 'Generating PDF...' : 'Download Report'}
                </button>
                <button onClick={closeViewModal} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
              </div>
            </div>

            {/* Modal Body (Scrollable & Printable) */}
            <div className="p-6 overflow-y-auto" ref={reportRef}>
              
              {/* Patient Information */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-800 uppercase border-b pb-2 mb-4">Patient Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase">Patient Name</p>
                    <p className="font-medium text-slate-900">{patientProfile?.fullName || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase">Age / Gender</p>
                    <p className="font-medium text-slate-900">{selectedAssessment.age} yrs / {selectedAssessment.gender}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase">Assessment Date</p>
                    <p className="font-medium text-slate-900">{new Date(selectedAssessment.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase">Doctor Name</p>
                    <p className="font-medium text-slate-900">Dr. {selectedAssessment.doctorId?.fullName || 'Unknown'}</p>
                  </div>
                </div>
              </div>

              {/* Measurements */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-800 uppercase border-b pb-2 mb-4">Measurements</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Height</p>
                    <p className="text-xl font-bold text-slate-900">{selectedAssessment.height} <span className="text-sm font-normal">cm</span></p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Weight</p>
                    <p className="text-xl font-bold text-slate-900">{selectedAssessment.weight} <span className="text-sm font-normal">kg</span></p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 text-center">
                    <p className="text-xs text-indigo-500 font-bold uppercase mb-1">BMI</p>
                    <p className="text-2xl font-black text-indigo-700">{selectedAssessment.bmi}</p>
                  </div>
                </div>
              </div>

              {/* Prediction Result */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-800 uppercase border-b pb-2 mb-4">Prediction Result</h3>
                
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-indigo-100 rounded-lg p-6 mb-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <p className="text-sm text-indigo-600 font-bold uppercase tracking-wider mb-2">Predicted Classification</p>
                      <p className="text-3xl font-black text-slate-800 capitalize leading-tight">
                        {formatObesityClass(selectedAssessment.obesityClass)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature Importance (Static) */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-800 uppercase border-b pb-2 mb-4">Important factors generally used by the model</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">Weight</span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">Height</span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">Age</span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">Gender</span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">Family History</span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">Caloric Intake</span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">Physical Activity</span>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="mt-8 bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3">
                <FaTriangleExclamation className="text-amber-500 text-xl shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  <strong>Disclaimer:</strong> This prediction provides decision-support information and does not replace professional medical diagnosis. Please consult your doctor for personalized medical advice.
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
