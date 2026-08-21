import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import { FaSearch, FaFilter, FaUsers, FaStethoscope, FaChartLine, FaUtensils, FaEye } from 'react-icons/fa';

// Map database enum values to friendly display labels
const OBESITY_LEVELS = [
  { value: 'Insufficient_Weight', label: 'Insufficient Weight' },
  { value: 'Normal_Weight', label: 'Normal Weight' },
  { value: 'Overweight_Level_I', label: 'Overweight Level I' },
  { value: 'Overweight_Level_II', label: 'Overweight Level II' },
  { value: 'Obesity_Type_I', label: 'Obesity Type I' },
  { value: 'Obesity_Type_II', label: 'Obesity Type II' },
  { value: 'Obesity_Type_III', label: 'Obesity Type III' },
];

function getObesityColor(level) {
  if (level === 'Not Assessed') return 'text-slate-500';
  if (level.includes('Obesity')) return 'text-red-600';
  if (level.includes('Overweight')) return 'text-orange-500';
  if (level === 'Normal_Weight') return 'text-green-600';
  if (level === 'Insufficient_Weight') return 'text-blue-600';
  return 'text-slate-700';
}

function formatObesityLabel(val) {
  const found = OBESITY_LEVELS.find(o => o.value === val);
  return found ? found.label : val;
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
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172033]">My Patients</h1>
          <p className="text-sm text-[#64748B] mt-1">Manage and monitor your assigned patients.</p>
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
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div className="w-full md:w-48 relative">
            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select 
              value={assessmentFilter}
              onChange={(e) => setAssessmentFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Assessed">Assessed</option>
              <option value="Not Assessed">Not Assessed</option>
            </select>
          </div>

          <div className="w-full md:w-56 relative">
            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select 
              value={obesityFilter}
              onChange={(e) => setObesityFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
            >
              <option value="">All Obesity Levels</option>
              {OBESITY_LEVELS.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
            Loading patients...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 bg-red-50">{error}</div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <div className="bg-slate-100 p-4 rounded-full mb-4">
              <FaUsers className="text-slate-400 text-3xl" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">No patients found</h3>
            <p>We couldn't find any patients matching your current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Patient Details</th>
                  <th className="px-6 py-4 font-medium">BMI & Level</th>
                  <th className="px-6 py-4 font-medium">Last Assessment</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPatients.map((patient) => (
                  <tr key={patient._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{patient.name}</div>
                      <div className="text-slate-500 text-xs mt-1">
                        ID: {patient._id.substring(patient._id.length - 8).toUpperCase()} | {patient.age} yrs | {patient.gender}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{patient.currentBmi}</div>
                      <div className={`text-xs mt-1 font-medium ${getObesityColor(patient.latestObesityLevel)}`}>
                        {formatObesityLabel(patient.latestObesityLevel)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {patient.lastAssessmentDate ? new Date(patient.lastAssessmentDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          to={`/doctor/patients/${patient._id}`} 
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Patient"
                        >
                          <FaEye />
                        </Link>
                        <Link 
                          to={`/doctor/assessments/new?patient=${patient._id}`} 
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Start Assessment"
                        >
                          <FaStethoscope />
                        </Link>
                        <Link 
                          to={`/doctor/patients/${patient._id}?tab=progress`} 
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="View Progress"
                        >
                          <FaChartLine />
                        </Link>
                        <Link 
                          to={`/doctor/patients/${patient._id}?tab=meals`} 
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="View Meal Plan"
                        >
                          <FaUtensils />
                        </Link>
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
