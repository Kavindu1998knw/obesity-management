import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import { FaSearch, FaFilter, FaFilePdf, FaEye, FaEdit, FaUtensils, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

export default function MealPlanList() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('All');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/doctor/meal-plans');
      setPlans(response.data.data);
    } catch (err) {
      setError('Failed to load meal plans.');
    } finally {
      setLoading(false);
    }
  };

  const formatClass = (cls) => cls ? cls.replace(/_/g, ' ') : 'Unknown';

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.patientId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' ? true : plan.status === statusFilter;
    const matchesClass = classFilter === 'All' ? true : plan.obesityClass === classFilter;
    return matchesSearch && matchesStatus && matchesClass;
  });

  return (
    <DashboardLayout role="doctor">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172033]">Meal Plans</h1>
          <p className="text-sm text-[#64748B] mt-1">Manage AI-generated dietary plans for your patients.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm mb-6">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search patient by name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>
          
          <div className="w-full md:w-48 relative">
            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Approved">Approved</option>
            </select>
          </div>

          <div className="w-full md:w-56 relative">
            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select 
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="All">All Obesity Classes</option>
              <option value="Insufficient_Weight">Insufficient Weight</option>
              <option value="Normal_Weight">Normal Weight</option>
              <option value="Overweight_Level_I">Overweight Level I</option>
              <option value="Overweight_Level_II">Overweight Level II</option>
              <option value="Obesity_Type_I">Obesity Type I</option>
              <option value="Obesity_Type_II">Obesity Type II</option>
              <option value="Obesity_Type_III">Obesity Type III</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading plans...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-500">{error}</div>
        ) : filteredPlans.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <FaUtensils className="text-slate-300 text-4xl mb-3" />
            <p>No meal plans found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">ID & Dates</th>
                  <th className="px-6 py-4 font-medium">Patient Details</th>
                  <th className="px-6 py-4 font-medium text-center">Calories</th>
                  <th className="px-6 py-4 font-medium text-center">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPlans.map((plan) => (
                  <tr key={plan._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{plan._id.substring(plan._id.length - 6).toUpperCase()}</div>
                      <div className="text-slate-500 text-xs mt-1">C: {new Date(plan.createdAt).toLocaleDateString()}</div>
                      {plan.approvedAt && (
                        <div className="text-emerald-600 text-xs mt-0.5">A: {new Date(plan.approvedAt).toLocaleDateString()}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{plan.patientId?.fullName || 'Unknown'}</div>
                      <div className="text-slate-500 text-xs mt-1">{formatClass(plan.obesityClass)}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-medium text-slate-700">{plan.totalMealCalories} / {plan.dailyCalorieTarget}</div>
                      <div className={`text-xs mt-1 font-bold ${plan.calorieDifference > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {plan.calorieDifference > 0 ? `+${plan.calorieDifference}` : plan.calorieDifference} kcal
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {plan.status === 'Approved' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold">
                          <FaCheckCircle /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold">
                          <FaExclamationCircle /> Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {plan.status === 'Draft' ? (
                          <Link 
                            to={`/doctor/meals/${plan._id}/edit`}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Draft"
                          >
                            <FaEdit />
                          </Link>
                        ) : (
                          <>
                            <Link 
                              to={`/doctor/meals/${plan._id}`}
                              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="View Plan"
                            >
                              <FaEye />
                            </Link>
                            <Link 
                              to={`/doctor/meals/${plan._id}`}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="View & Download PDF"
                            >
                              <FaFilePdf />
                            </Link>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
