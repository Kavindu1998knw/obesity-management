import React, { useState, useEffect } from 'react';
import {
  X,
  Loader2,
  Stethoscope,
  Scale,
  Ruler,
  HeartPulse,
  Utensils,
  Calendar,
  TrendingUp,
  User,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import apiClient from '../../services/apiClient';

export default function PatientViewModal({ isOpen, onClose, patientId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && patientId) {
      fetchPatientDetails();
    }
  }, [isOpen, patientId]);

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient.get(`/admin/patients/${patientId}`);
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load clinical details');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} Years`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Patient Clinical Profile</h3>
              <p className="text-[11px] text-slate-500">Read-only health summary, predictions, progress tracking, and appointment records</p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/40 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-2">
              <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-medium text-slate-500">Loading patient records...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-medium text-center">
              {error}
            </div>
          ) : data ? (
            <div className="space-y-6">
              
              {/* Top Summary 4 Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Doctor */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shrink-0">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Assigned Doctor</p>
                    <p className="font-bold text-xs sm:text-sm text-slate-900 truncate mt-0.5">
                      {data.profile?.assignedDoctor?.fullName ? `Dr. ${data.profile.assignedDoctor.fullName}` : 'Unassigned'}
                    </p>
                    {data.profile?.assignedDoctorAt && (
                      <p className="text-[10px] text-slate-400">Since {new Date(data.profile.assignedDoctorAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>

                {/* BMI */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Current BMI</p>
                    <p className="font-bold text-xs sm:text-sm text-slate-900 mt-0.5">
                      {data.profile?.currentBmi ? `${data.profile.currentBmi} kg/m²` : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Height / Weight */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
                    <Ruler className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Height & Weight</p>
                    <p className="font-bold text-xs sm:text-sm text-slate-900 mt-0.5">
                      {data.profile?.height ? `${data.profile.height} cm` : '--'} / {data.profile?.weight ? `${data.profile.weight} kg` : '--'}
                    </p>
                  </div>
                </div>

                {/* Latest Assessment */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Latest Risk Category</p>
                    <p className="font-bold text-xs text-rose-600 truncate mt-0.5">
                      {data.assessments?.[0]?.obesityClass || 'Not Assessed'}
                    </p>
                  </div>
                </div>

              </div>

              {/* Personal Info Card */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Personal Details</h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                    data.user.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {data.user.status === 'active' ? 'Active Account' : 'Inactive'}
                  </span>
                </div>
                <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <p className="text-slate-400 text-[11px]">Full Name</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{data.user.fullName}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[11px]">Email Address</p>
                    <p className="font-semibold text-slate-800 mt-0.5 truncate">{data.user.email}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[11px]">Phone</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{data.profile?.phoneNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[11px]">Gender</p>
                    <p className="font-semibold text-slate-800 mt-0.5 capitalize">{data.profile?.gender || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[11px]">Calculated Age</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{calculateAge(data.profile?.dob)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[11px]">Date of Birth</p>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {data.profile?.dob ? new Date(data.profile.dob).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-slate-400 text-[11px]">Enrolled On</p>
                    <p className="font-semibold text-slate-800 mt-0.5">{new Date(data.user.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Latest Approved Meal Plan */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-teal-600" />
                    Latest Approved Meal Plan
                  </h4>
                </div>
                <div className="p-5">
                  {data.mealPlan ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <p className="text-slate-400 text-[11px]">Approval Date</p>
                        <p className="font-semibold text-slate-800 mt-0.5">
                          {data.mealPlan.approvedAt ? new Date(data.mealPlan.approvedAt).toLocaleDateString() : 'Active'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[11px]">Daily Target</p>
                        <p className="font-bold text-teal-700 mt-0.5">{data.mealPlan.dailyCalorieTarget} kcal</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[11px]">Total Protein</p>
                        <p className="font-semibold text-slate-800 mt-0.5">{data.mealPlan.totalProtein}g</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-[11px]">Clinical Class</p>
                        <p className="font-semibold text-rose-600 mt-0.5">{data.mealPlan.obesityClass}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-slate-400 text-xs font-medium">
                      No approved nutritional meal plan on record.
                    </div>
                  )}
                </div>
              </div>

              {/* Clinical Tables Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Predictions Table */}
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-72">
                  <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                      <HeartPulse className="w-3.5 h-3.5 text-indigo-600" /> Assessment History
                    </h4>
                  </div>
                  <div className="flex-1 overflow-auto">
                    {data.assessments && data.assessments.length > 0 ? (
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 sticky top-0">
                          <tr>
                            <th className="px-4 py-2.5">Date</th>
                            <th className="px-4 py-2.5">Clinician</th>
                            <th className="px-4 py-2.5">Assessment Class</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.assessments.map(a => (
                            <tr key={a._id} className="hover:bg-slate-50/70">
                              <td className="px-4 py-2.5 font-medium text-slate-700">{new Date(a.createdAt).toLocaleDateString()}</td>
                              <td className="px-4 py-2.5 text-slate-600">Dr. {a.doctorId?.fullName || 'Unknown'}</td>
                              <td className="px-4 py-2.5 font-semibold text-rose-600">{a.obesityClass}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                        No assessments recorded.
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Records Table */}
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-72">
                  <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Weight & BMI Logs
                    </h4>
                  </div>
                  <div className="flex-1 overflow-auto">
                    {data.progressRecords && data.progressRecords.length > 0 ? (
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 sticky top-0">
                          <tr>
                            <th className="px-4 py-2.5">Date</th>
                            <th className="px-4 py-2.5">Weight</th>
                            <th className="px-4 py-2.5">BMI Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.progressRecords.map(p => (
                            <tr key={p._id} className="hover:bg-slate-50/70">
                              <td className="px-4 py-2.5 font-medium text-slate-700">{new Date(p.date).toLocaleDateString()}</td>
                              <td className="px-4 py-2.5 font-bold text-slate-800">{p.weight} kg</td>
                              <td className="px-4 py-2.5 text-slate-600">{p.bmi}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                        No progress logs available.
                      </div>
                    )}
                  </div>
                </div>

                {/* Appointments History Table */}
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-72 lg:col-span-2">
                  <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" /> Appointment History
                    </h4>
                  </div>
                  <div className="flex-1 overflow-auto">
                    {data.appointments && data.appointments.length > 0 ? (
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 sticky top-0">
                          <tr>
                            <th className="px-4 py-2.5">Date</th>
                            <th className="px-4 py-2.5">Time</th>
                            <th className="px-4 py-2.5">Doctor</th>
                            <th className="px-4 py-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.appointments.map(a => (
                            <tr key={a._id} className="hover:bg-slate-50/70">
                              <td className="px-4 py-2.5 font-medium text-slate-800">{new Date(a.date).toLocaleDateString()}</td>
                              <td className="px-4 py-2.5 text-slate-600 font-mono">{a.time}</td>
                              <td className="px-4 py-2.5 text-slate-700">Dr. {a.doctorId?.fullName || 'Unknown'}</td>
                              <td className="px-4 py-2.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize border ${
                                  a.status === 'completed' || a.status === 'approved' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                    : a.status === 'cancelled' || a.status === 'rejected'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {a.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                        No consultation history found.
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}
