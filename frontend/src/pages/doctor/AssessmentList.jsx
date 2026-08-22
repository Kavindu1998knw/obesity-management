import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import {
  Activity,
  Search,
  Eye,
  Utensils,
  Plus
} from 'lucide-react';

function getObesityBadge(cls) {
  if (!cls || cls === 'Not Assessed') return 'bg-slate-100 text-slate-600 border-slate-200';
  if (cls.includes('Obesity_Type_II') || cls.includes('Obesity_Type_III')) return 'bg-rose-50 text-rose-700 border-rose-200';
  if (cls.includes('Obesity') || cls.includes('Overweight')) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (cls === 'Normal_Weight') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (cls === 'Insufficient_Weight') return 'bg-sky-50 text-sky-700 border-sky-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

export default function AssessmentList() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialPatientId = queryParams.get('patient');

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const url = initialPatientId ? `/doctor/assessments?patientId=${initialPatientId}` : '/doctor/assessments';
      const response = await apiClient.get(url);
      setAssessments(response.data.data);
    } catch {
      setError('Failed to load assessments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatObesityClass = (cls) => {
    return cls ? cls.replace(/_/g, ' ') : 'N/A';
  };

  const filteredAssessments = assessments.filter(ass => {
    const matchesSearch = ass.patientId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || ass._id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === 'All' ? true : ass.obesityClass === classFilter;
    
    let matchesDate = true;
    if (dateFilter) {
      const assDate = new Date(ass.createdAt).toISOString().split('T')[0];
      matchesDate = assDate === dateFilter;
    }

    return matchesSearch && matchesClass && matchesDate;
  });

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-6 pb-10">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-xs">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Obesity Assessments</h1>
                <p className="text-xs text-slate-500 mt-0.5">Machine learning risk evaluation history, predictions, and dietary planning triggers.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Link 
              to={initialPatientId ? `/doctor/assessments/new?patient=${initialPatientId}` : "/doctor/assessments/new"}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Assessment</span>
            </Link>
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
              
              {/* Obesity Class Filter */}
              <select 
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-xs bg-white text-slate-700 font-medium cursor-pointer"
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

              {/* Date Filter */}
              <input 
                type="date" 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-xs bg-white text-slate-700 font-medium cursor-pointer" 
              />
            </div>
            
            {/* Total Results */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full">
                Total: {filteredAssessments.length} {filteredAssessments.length === 1 ? 'Record' : 'Records'}
              </span>
            </div>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="flex flex-col justify-center items-center h-64 text-slate-400 space-y-2">
                <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-medium">Loading ML assessments...</span>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center h-64 text-rose-500 text-xs font-medium p-4 text-center">
                {error}
              </div>
            ) : filteredAssessments.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-64 text-slate-400 space-y-2">
                <Activity className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-medium text-slate-500">No assessment records found.</p>
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">Assessment ID</th>
                    <th className="px-5 py-3.5">Assessment Date</th>
                    <th className="px-5 py-3.5">Patient Name</th>
                    <th className="px-5 py-3.5">Calculated BMI</th>
                    <th className="px-5 py-3.5">Predicted Class</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssessments.map((ass) => (
                    <tr key={ass._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-semibold uppercase">
                          #{ass._id.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                        {new Date(ass.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {ass.patientId?.fullName || 'Unknown'}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-800">
                        {ass.bmi} kg/m²
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getObesityBadge(ass.obesityClass)}`}>
                          {formatObesityClass(ass.obesityClass)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end items-center gap-1">
                          <Link 
                            to={`/doctor/assessments/${ass._id}`}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="View Prediction Result"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link 
                            to={`/doctor/meals/new?assessment=${ass._id}`}
                            className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                            title="Generate Meal Plan"
                          >
                            <Utensils className="w-4 h-4" />
                          </Link>
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
