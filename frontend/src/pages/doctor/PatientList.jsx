import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import {
  Users,
  Search,
  Filter,
  Eye,
  Activity,
  TrendingUp,
  Utensils,
  Stethoscope,
  ChevronRight
} from 'lucide-react';

const OBESITY_LEVELS = [
  { value: 'Insufficient_Weight', label: 'Insufficient Weight' },
  { value: 'Normal_Weight', label: 'Normal Weight' },
  { value: 'Overweight_Level_I', label: 'Overweight Level I' },
  { value: 'Overweight_Level_II', label: 'Overweight Level II' },
  { value: 'Obesity_Type_I', label: 'Obesity Type I' },
  { value: 'Obesity_Type_II', label: 'Obesity Type II' },
  { value: 'Obesity_Type_III', label: 'Obesity Type III' },
];

function getObesityBadge(level) {
  if (!level || level === 'Not Assessed') {
    return 'bg-slate-100 text-slate-600 border-slate-200';
  }
  if (level.includes('Obesity_Type_II') || level.includes('Obesity_Type_III')) {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }
  if (level.includes('Obesity') || level.includes('Overweight')) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  if (level === 'Normal_Weight') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (level === 'Insufficient_Weight') {
    return 'bg-sky-50 text-sky-700 border-sky-200';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function formatObesityLabel(val) {
  const found = OBESITY_LEVELS.find(o => o.value === val);
  return found ? found.label : (val ? val.replace(/_/g, ' ') : 'Not Assessed');
}

export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [obesityFilter, setObesityFilter] = useState('');
  const [assessmentFilter, setAssessmentFilter] = useState('All');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/doctor/patients');
      setPatients(response.data.data);
    } catch (err) {
      setError('Failed to load patients. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesObesity = obesityFilter ? patient.latestObesityLevel === obesityFilter : true;
    
    let matchesAssessment = true;
    if (assessmentFilter === 'Assessed') {
      matchesAssessment = patient.latestObesityLevel !== 'Not Assessed';
    } else if (assessmentFilter === 'Not Assessed') {
      matchesAssessment = patient.latestObesityLevel === 'Not Assessed';
    }

    return matchesSearch && matchesObesity && matchesAssessment;
  });

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-6 pb-10">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-xs">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Patients</h1>
                <p className="text-xs text-slate-500 mt-0.5">Clinical directory of assigned patients, medical metrics, and risk monitoring.</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Link
              to="/doctor/assessments/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Activity className="w-4 h-4" />
              <span>New Assessment</span>
            </Link>
          </div>
        </div>

        {/* Main Card Container */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[520px]">
          
          {/* Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              {/* Search Bar */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search patient by name..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
              
              {/* Filter: Assessment Status */}
              <div className="flex gap-2.5 flex-wrap">
                <select 
                  value={assessmentFilter}
                  onChange={(e) => setAssessmentFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-xs bg-white text-slate-700 font-medium cursor-pointer"
                >
                  <option value="All">All Assessment Statuses</option>
                  <option value="Assessed">Assessed</option>
                  <option value="Not Assessed">Not Assessed</option>
                </select>

                {/* Filter: Obesity Level */}
                <select 
                  value={obesityFilter}
                  onChange={(e) => setObesityFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-xs bg-white text-slate-700 font-medium max-w-[200px] truncate cursor-pointer"
                >
                  <option value="">All Obesity Levels</option>
                  {OBESITY_LEVELS.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Total Results Pill */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full">
                Total: {filteredPatients.length} {filteredPatients.length === 1 ? 'Patient' : 'Patients'}
              </span>
            </div>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-x-auto">
            {loading ? (
              <div className="flex flex-col justify-center items-center h-64 text-slate-400 space-y-2">
                <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-medium">Loading patient directory...</span>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center h-64 text-rose-500 text-xs font-medium p-4 text-center">
                {error}
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-64 text-slate-400 space-y-2">
                <Users className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-medium text-slate-500">No patients match your filter criteria.</p>
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">Patient ID</th>
                    <th className="px-5 py-3.5">Patient Name</th>
                    <th className="px-5 py-3.5">Demographics</th>
                    <th className="px-5 py-3.5">BMI & Risk Level</th>
                    <th className="px-5 py-3.5">Last Assessment</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPatients.map((patient) => {
                    const initials = patient.name
                      ? patient.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()
                      : 'PT';

                    return (
                      <tr key={patient._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-semibold uppercase">
                            #{patient._id.slice(-6).toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-xs shrink-0 border border-teal-100">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-900 block truncate" title={patient.name}>
                                {patient.name}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          <span className="font-medium text-slate-800">{patient.age ? `${patient.age} yrs` : 'N/A'}</span>
                          <span className="text-slate-400 mx-1.5">•</span>
                          <span className="capitalize">{patient.gender || 'Not specified'}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{patient.currentBmi ? `${patient.currentBmi}` : '--'}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getObesityBadge(patient.latestObesityLevel)}`}>
                              {formatObesityLabel(patient.latestObesityLevel)}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">
                          {patient.lastAssessmentDate ? (
                            <span className="font-medium text-slate-700">{new Date(patient.lastAssessmentDate).toLocaleDateString()}</span>
                          ) : (
                            <span className="text-slate-400 italic">Not assessed yet</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex justify-end items-center gap-1">
                            <Link 
                              to={`/doctor/patients/${patient._id}`} 
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" 
                              title="View Patient Record"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link 
                              to={`/doctor/assessments/new?patient=${patient._id}`} 
                              className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer" 
                              title="Start AI Assessment"
                            >
                              <Activity className="w-4 h-4" />
                            </Link>
                            <Link 
                              to={`/doctor/patients/${patient._id}?tab=progress`} 
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer" 
                              title="View Progress Logs"
                            >
                              <TrendingUp className="w-4 h-4" />
                            </Link>
                            <Link 
                              to={`/doctor/patients/${patient._id}?tab=meals`} 
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer" 
                              title="View Meal Plan"
                            >
                              <Utensils className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
