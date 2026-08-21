import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import {
  Utensils,
  Search,
  Filter,
  Eye,
  PenSquare,
  FileDown,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

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
    } catch {
      setError('Failed to load meal plans.');
    } finally {
      setLoading(false);
    }
  };

  const formatClass = (cls) => cls ? cls.replace(/_/g, ' ') : 'Unknown';

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.patientId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || plan._id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' ? true : plan.status === statusFilter;
    const matchesClass = classFilter === 'All' ? true : plan.obesityClass === classFilter;
    return matchesSearch && matchesStatus && matchesClass;
  });

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-6 pb-10">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-xs">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dietary Meal Plans</h1>
                <p className="text-xs text-slate-500 mt-0.5">Directory of tailored caloric and nutritional meal plans for enrolled patients.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Card Container */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[520px]">
          
          {/* Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 flex-wrap">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search by patient name or ID..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
              
              {/* Status Filter */}
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-xs bg-white text-slate-700 font-medium cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Draft">Draft Plans</option>
                <option value="Approved">Approved Plans</option>
              </select>

              {/* Class Filter */}
              <select 
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-xs bg-white text-slate-700 font-medium max-w-[200px] truncate cursor-pointer"
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
            
            {/* Total Results */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full">
                Total: {filteredPlans.length} {filteredPlans.length === 1 ? 'Plan' : 'Plans'}
              </span>
            </div>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="flex flex-col justify-center items-center h-64 text-slate-400 space-y-2">
                <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-medium">Loading nutritional plans...</span>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center h-64 text-rose-500 text-xs font-medium p-4 text-center">
                {error}
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-64 text-slate-400 space-y-2">
                <Utensils className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-medium text-slate-500">No meal plans found.</p>
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">Plan ID</th>
                    <th className="px-5 py-3.5">Patient Details</th>
                    <th className="px-5 py-3.5">Caloric Target</th>
                    <th className="px-5 py-3.5">Dates</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPlans.map((plan) => (
                    <tr key={plan._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-semibold uppercase">
                          #{plan._id.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">{plan.patientId?.fullName || 'Unknown'}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{formatClass(plan.obesityClass)}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-800">{plan.totalMealCalories} / {plan.dailyCalorieTarget} kcal</div>
                        <div className={`text-[11px] font-semibold mt-0.5 ${plan.calorieDifference > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {plan.calorieDifference > 0 ? `+${plan.calorieDifference}` : plan.calorieDifference} kcal diff
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        <div>Created: {new Date(plan.createdAt).toLocaleDateString()}</div>
                        {plan.approvedAt && (
                          <div className="text-emerald-700 text-[11px] font-semibold mt-0.5">Approved: {new Date(plan.approvedAt).toLocaleDateString()}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          plan.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {plan.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end items-center gap-1">
                          {plan.status === 'Draft' ? (
                            <Link 
                              to={`/doctor/meals/${plan._id}/edit`}
                              className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Draft"
                            >
                              <PenSquare className="w-4 h-4" />
                            </Link>
                          ) : (
                            <>
                              <Link 
                                to={`/doctor/meals/${plan._id}`}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                title="View Plan"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <Link 
                                to={`/doctor/meals/${plan._id}`}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Export PDF"
                              >
                                <FileDown className="w-4 h-4" />
                              </Link>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
