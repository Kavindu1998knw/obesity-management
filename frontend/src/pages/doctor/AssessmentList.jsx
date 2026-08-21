import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import { FaSearch, FaFilter, FaCalendarAlt, FaPlus, FaEye, FaUtensils, FaStethoscope } from 'react-icons/fa';

export default function AssessmentList() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialPatientId = queryParams.get('patient'); // from URL if launched from patient detail

  useEffect(() => {
    fetchAssessments();
    // eslint-disable-next-line
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const url = initialPatientId ? `/doctor/assessments?patientId=${initialPatientId}` : '/doctor/assessments';
      const response = await apiClient.get(url);
      setAssessments(response.data.data);
    } catch (err) {
      setError('Failed to load assessments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatObesityClass = (cls) => {
    return cls.replace(/_/g, ' ');
  };

  const filteredAssessments = assessments.filter(ass => {
    const matchesSearch = ass.patientId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
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
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172033]">Obesity Assessments</h1>
          <p className="text-sm text-[#64748B] mt-1">Review AI-predicted patient health outcomes.</p>
        </div>
        <Link 
          to={initialPatientId ? `/doctor/assessments/new?patient=${initialPatientId}` : "/doctor/assessments/new"}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
        >
          <FaPlus /> New Assessment
        </Link>
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
          
          <div className="w-full md:w-56 relative">
            <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select 
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
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

          <div className="w-full md:w-48 relative">
            <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
            Loading assessments...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 bg-red-50">{error}</div>
        ) : filteredAssessments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <div className="bg-slate-100 p-4 rounded-full mb-4">
              <FaStethoscope className="text-slate-400 text-3xl" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">No assessments found</h3>
            <p>You haven't run any ML predictions yet, or none match your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">ID & Date</th>
                  <th className="px-6 py-4 font-medium">Patient Name</th>
                  <th className="px-6 py-4 font-medium">BMI</th>
                  <th className="px-6 py-4 font-medium">Predicted Level</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredAssessments.map((ass) => (
                  <tr key={ass._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{ass._id.substring(ass._id.length - 6).toUpperCase()}</div>
                      <div className="text-slate-500 text-xs mt-1">{new Date(ass.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {ass.patientId?.fullName || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {ass.bmi}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-700">
                        {formatObesityClass(ass.obesityClass)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          to={`/doctor/assessments/${ass._id}`}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Result"
                        >
                          <FaEye />
                        </Link>
                        
                        <Link 
                          to={`/doctor/meals/new?assessment=${ass._id}`}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Generate Meal Plan"
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
