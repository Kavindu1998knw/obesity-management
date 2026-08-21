import React, { useState, useEffect } from 'react';
import { FaXmark, FaSpinner, FaUserDoctor, FaScaleBalanced, FaRulerVertical, FaNotesMedical, FaCalendarCheck, FaUtensils, FaChartLine } from 'react-icons/fa6';
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
      setError(err.response?.data?.message || 'Failed to load details');
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
      <div className="fixed inset-0 bg-slate-900/60" onClick={onClose}></div>
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh]">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900">Patient Medical Profile</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 focus:outline-none">
            <FaXmark className="text-xl" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500">
              <FaSpinner className="animate-spin text-4xl mb-4 text-blue-600" />
              <p>Loading clinical records...</p>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64 text-rose-500">{error}</div>
          ) : data ? (
            <div className="space-y-6">
              
              {/* Top Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-lg text-blue-600"><FaUserDoctor className="text-xl"/></div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Assigned Doctor</p>
                    <p className="font-bold text-slate-900">{data.profile?.assignedDoctor?.fullName ? `Dr. ${data.profile.assignedDoctor.fullName}` : 'Not Assigned'}</p>
                    {data.profile?.assignedDoctorAt && <p className="text-[10px] text-slate-400">Since {new Date(data.profile.assignedDoctorAt).toLocaleDateString()}</p>}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600"><FaScaleBalanced className="text-xl"/></div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Current BMI</p>
                    <p className="font-bold text-slate-900">{data.profile?.currentBmi || 'N/A'}</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="bg-amber-100 p-3 rounded-lg text-amber-600"><FaRulerVertical className="text-xl"/></div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Height / Weight</p>
                    <p className="font-bold text-slate-900">{data.profile?.height ? `${data.profile.height}cm` : 'N/A'} / {data.profile?.weight ? `${data.profile.weight}kg` : 'N/A'}</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="bg-rose-100 p-3 rounded-lg text-rose-600"><FaNotesMedical className="text-xl"/></div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Latest Assessment</p>
                    <p className="font-bold text-slate-900 truncate">
                      {data.assessments?.[0]?.obesityClass || 'Not Assessed'}
                    </p>
                    {data.assessments?.[0]?.createdAt && <p className="text-[10px] text-slate-400">On {new Date(data.assessments[0].createdAt).toLocaleDateString()}</p>}
                  </div>
                </div>
              </div>

              {/* Personal Info */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <h4 className="font-bold text-slate-800">Personal Information</h4>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  <div><p className="text-sm text-slate-500">Full Name</p><p className="font-medium">{data.user.fullName}</p></div>
                  <div><p className="text-sm text-slate-500">Email Address</p><p className="font-medium">{data.user.email}</p></div>
                  <div><p className="text-sm text-slate-500">Phone</p><p className="font-medium">{data.profile?.phoneNumber || 'N/A'}</p></div>
                  <div><p className="text-sm text-slate-500">Gender</p><p className="font-medium capitalize">{data.profile?.gender || 'N/A'}</p></div>
                  <div>
                    <p className="text-sm text-slate-500">Age</p>
                    <p className="font-medium">
                      {calculateAge(data.profile?.dob)}
                    </p>
                  </div>
                  <div><p className="text-sm text-slate-500">Account Status</p><p className="font-medium capitalize">{data.user.status}</p></div>
                  <div className="col-span-2"><p className="text-sm text-slate-500">Registration Date</p><p className="font-medium">{new Date(data.user.createdAt).toLocaleString()}</p></div>
                </div>
              </div>

              {/* Latest Approved Meal Plan */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2"><FaUtensils className="text-orange-500" /> Latest Approved Meal Plan</h4>
                </div>
                <div className="p-6">
                  {data.mealPlan ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                       <div><p className="text-sm text-slate-500">Approval Date</p><p className="font-medium">{data.mealPlan.approvedAt ? new Date(data.mealPlan.approvedAt).toLocaleDateString() : 'N/A'}</p></div>
                       <div><p className="text-sm text-slate-500">Target Calories</p><p className="font-medium text-emerald-600">{data.mealPlan.dailyCalorieTarget} kcal</p></div>
                       <div><p className="text-sm text-slate-500">Total Proteins</p><p className="font-medium">{data.mealPlan.totalProtein}g</p></div>
                       <div><p className="text-sm text-slate-500">Obesity Class</p><p className="font-medium text-rose-600">{data.mealPlan.obesityClass}</p></div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center text-slate-400 py-4">No approved meal plan available.</div>
                  )}
                </div>
              </div>

              {/* Layout for Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Predictions Table */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-80">
                  <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2"><FaNotesMedical className="text-indigo-500" /> Assessment History</h4>
                  </div>
                  <div className="flex-1 overflow-auto">
                    {data.assessments && data.assessments.length > 0 ? (
                      <table className="w-full text-sm text-left">
                        <thead className="bg-white text-slate-500 text-xs uppercase sticky top-0 shadow-sm border-b border-slate-200">
                          <tr><th className="px-4 py-2">Date</th><th className="px-4 py-2">Doctor</th><th className="px-4 py-2">Class</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.assessments.map(a => (
                            <tr key={a._id} className="hover:bg-slate-50">
                              <td className="px-4 py-3">{new Date(a.createdAt).toLocaleDateString()}</td>
                              <td className="px-4 py-3">Dr. {a.doctorId?.fullName || 'Unknown'}</td>
                              <td className="px-4 py-3 font-medium text-rose-600">{a.obesityClass}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400">No assessments recorded.</div>
                    )}
                  </div>
                </div>

                {/* Progress Records Table */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-80">
                  <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2"><FaChartLine className="text-emerald-500" /> Weight & BMI Progress</h4>
                  </div>
                  <div className="flex-1 overflow-auto">
                    {data.progressRecords && data.progressRecords.length > 0 ? (
                      <table className="w-full text-sm text-left">
                        <thead className="bg-white text-slate-500 text-xs uppercase sticky top-0 shadow-sm border-b border-slate-200">
                          <tr><th className="px-4 py-2">Date</th><th className="px-4 py-2">Weight (kg)</th><th className="px-4 py-2">BMI</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.progressRecords.map(p => (
                            <tr key={p._id} className="hover:bg-slate-50">
                              <td className="px-4 py-3">{new Date(p.date).toLocaleDateString()}</td>
                              <td className="px-4 py-3 font-medium">{p.weight}</td>
                              <td className="px-4 py-3 text-slate-600">{p.bmi}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400">No progress history found.</div>
                    )}
                  </div>
                </div>

                {/* Appointments Table */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-80 lg:col-span-2">
                  <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2"><FaCalendarCheck className="text-blue-500" /> Appointment History</h4>
                  </div>
                  <div className="flex-1 overflow-auto">
                    {data.appointments && data.appointments.length > 0 ? (
                      <table className="w-full text-sm text-left">
                        <thead className="bg-white text-slate-500 text-xs uppercase sticky top-0 shadow-sm border-b border-slate-200">
                          <tr><th className="px-4 py-2">Date</th><th className="px-4 py-2">Time</th><th className="px-4 py-2">Doctor</th><th className="px-4 py-2">Status</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.appointments.map(a => (
                            <tr key={a._id} className="hover:bg-slate-50">
                              <td className="px-4 py-3">{new Date(a.date).toLocaleDateString()}</td>
                              <td className="px-4 py-3">{a.time}</td>
                              <td className="px-4 py-3">Dr. {a.doctorId?.fullName || 'Unknown'}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  a.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                  a.status === 'cancelled' || a.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                                  a.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                  'bg-amber-100 text-amber-800'
                                }`}>
                                  {a.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-400">No appointments scheduled.</div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : null}
        </div>

        <div className="px-6 py-4 bg-white border-t border-slate-200 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 focus:outline-none transition-colors">
            Close Medical Profile
          </button>
        </div>
      </div>
    </div>
  );
}
