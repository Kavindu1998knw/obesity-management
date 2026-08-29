import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import { exportToPdf } from '../../utils/pdfExport';
import {
  Activity,
  Eye,
  FileDown,
  Filter,
  X,
  Sparkles,
  Loader2
} from 'lucide-react';

function getObesityBadge(cls) {
  if (!cls || cls === 'Not Assessed') return 'bg-slate-100 text-slate-600 border-slate-200';
  if (cls.includes('Obesity_Type_II') || cls.includes('Obesity_Type_III')) return 'bg-rose-50 text-rose-700 border-rose-200';
  if (cls.includes('Obesity') || cls.includes('Overweight')) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (cls === 'Normal_Weight' || cls === 'Normal') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (cls === 'Insufficient_Weight' || cls === 'Underweight') return 'bg-sky-50 text-sky-700 border-sky-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

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
    } catch {
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
      <div className="space-y-6 pb-12">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-xs">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Obesity Assessments</h1>
                <p className="text-xs text-slate-500 mt-0.5">Review machine-learning health risk evaluations and clinical history.</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center h-80 text-slate-400 space-y-2">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-medium">Loading clinical assessments...</span>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-center text-xs font-medium">
            {error}
          </div>
        ) : (
          <>
            {/* Latest Assessment Hero Card */}
            {latestAssessment && (
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
                <div className="absolute right-0 top-0 w-80 h-full bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/10 pb-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Latest Clinical Assessment</span>
                    </div>
                    <span className="text-xs text-slate-400">
                      Evaluated: {new Date(latestAssessment.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-[11px] text-teal-200 uppercase font-bold tracking-wider">Attending Clinician</p>
                      <p className="text-base font-bold text-white mt-1">Dr. {latestAssessment.doctorId?.fullName || 'Assigned Specialist'}</p>
                    </div>

                    <div>
                      <p className="text-[11px] text-teal-200 uppercase font-bold tracking-wider">Anthropometrics</p>
                      <p className="text-base font-bold text-white mt-1">{latestAssessment.weight} kg • {latestAssessment.height} cm</p>
                      <p className="text-xs text-teal-300 mt-0.5">BMI: {latestAssessment.bmi} kg/m²</p>
                    </div>

                    <div className="col-span-2">
                      <p className="text-[11px] text-teal-200 uppercase font-bold tracking-wider">Predicted Classification</p>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xl sm:text-2xl font-black text-white capitalize leading-tight">
                          {formatObesityClass(latestAssessment.obesityClass)}
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getObesityBadge(latestAssessment.obesityClass)}`}>
                          {formatObesityClass(latestAssessment.obesityClass)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button 
                      onClick={() => openViewModal(latestAssessment)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Complete Clinical Details</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Assessment History Card */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
              
              {/* Filter Toolbar */}
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
                <div className="flex flex-col sm:flex-row gap-3 flex-1 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                    <select 
                      value={classFilter} 
                      onChange={(e) => setClassFilter(e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-xs bg-white text-slate-700 font-medium cursor-pointer"
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
                    className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-xs bg-white text-slate-700 font-medium cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                  <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full">
                    Total: {filteredAssessments.length} {filteredAssessments.length === 1 ? 'Assessment' : 'Assessments'}
                  </span>
                </div>
              </div>

              {/* Table Content */}
              <div className="flex-1 overflow-x-auto">
                {filteredAssessments.length === 0 ? (
                  <div className="flex flex-col justify-center items-center h-64 text-slate-400 space-y-2">
                    <Activity className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                    <p className="text-xs font-medium text-slate-500">No assessments found.</p>
                  </div>
                ) : (
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-3.5">Assessment ID</th>
                        <th className="px-5 py-3.5">Date</th>
                        <th className="px-5 py-3.5">Doctor</th>
                        <th className="px-5 py-3.5">BMI Score</th>
                        <th className="px-5 py-3.5">AI Classification</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAssessments.map((appt) => (
                        <tr key={appt._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-semibold uppercase">
                              #{appt._id.slice(-6).toUpperCase()}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-700">
                            {new Date(appt.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3.5 font-medium text-slate-900">
                            Dr. {appt.doctorId?.fullName || 'Specialist'}
                          </td>
                          <td className="px-5 py-3.5 font-bold text-slate-900">
                            {appt.bmi} <span className="text-[10px] text-slate-400 font-normal">kg/m²</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getObesityBadge(appt.obesityClass)}`}>
                              {formatObesityClass(appt.obesityClass)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button 
                              onClick={() => openViewModal(appt)}
                              className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                              title="View Assessment"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}

      </div>

      {/* View Assessment Modal */}
      {showModal && selectedAssessment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={closeViewModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900">Assessment Result & Metrics</h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                  <span>{downloading ? 'Generating...' : 'Download PDF'}</span>
                </button>
                <button onClick={closeViewModal} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs" ref={reportRef}>
              
              {/* Patient & Doctor Banner */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-2 mb-3">Clinical Evaluation Context</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Patient Name</span>
                    <span className="font-bold text-slate-900">{patientProfile?.fullName || 'Assigned Patient'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Demographics</span>
                    <span className="font-medium text-slate-800">{selectedAssessment.age} yrs • {selectedAssessment.gender}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Evaluation Date</span>
                    <span className="font-medium text-slate-800">{new Date(selectedAssessment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Attending Clinician</span>
                    <span className="font-bold text-teal-700">Dr. {selectedAssessment.doctorId?.fullName || 'Specialist'}</span>
                  </div>
                </div>
              </div>

              {/* Measurements */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2 mb-3">Anthropometric Measurements</h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Height</span>
                    <span className="text-lg font-bold text-slate-900">{selectedAssessment.height} <span className="text-xs font-normal">cm</span></span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Weight</span>
                    <span className="text-lg font-bold text-slate-900">{selectedAssessment.weight} <span className="text-xs font-normal">kg</span></span>
                  </div>
                  <div className="bg-teal-50 p-3.5 rounded-xl border border-teal-100 text-teal-900">
                    <span className="text-teal-600 block text-[10px] font-bold uppercase">BMI Score</span>
                    <span className="text-xl font-black text-teal-700">{selectedAssessment.bmi}</span>
                  </div>
                </div>
              </div>

              {/* Classification Hero */}
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs text-center space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-100">
                  <Activity className="w-3.5 h-3.5" />
                  <span>AI Random Forest Classification</span>
                </span>
                <h3 className="text-2xl font-black text-slate-900 capitalize">
                  {formatObesityClass(selectedAssessment.obesityClass)}
                </h3>
                <div>
                  <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold border ${getObesityBadge(selectedAssessment.obesityClass)}`}>
                    Clinical Status: {formatObesityClass(selectedAssessment.obesityClass)}
                  </span>
                </div>
              </div>

              {/* Key Features Factors */}
              <div>
                <h4 className="font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2 mb-3">Key Features Evaluated by AI Model</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg">Weight & Height (BMI)</span>
                  <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg">Age & Gender</span>
                  <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg">Family Genetic History</span>
                  <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg">High-Calorie Intake</span>
                  <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg">Physical Movement (FAF)</span>
                  <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg">Daily Water Consumption</span>
                </div>
              </div>



            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
