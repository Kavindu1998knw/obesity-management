import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import {
  FileSpreadsheet,
  FileDown,
  Loader2,
  Users,
  Stethoscope,
  CalendarCheck,
  Scale,
  Filter
} from 'lucide-react';
import { exportToPdf } from '../../utils/pdfExport';

export default function ReportManagement() {
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  const [reportType, setReportType] = useState('patient');
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    doctorId: 'all',
    status: 'all',
    patientStatus: 'all',
    obesityCategory: 'all'
  });

  const reportTypes = [
    { id: 'doctor', label: 'Doctor Summary Report', icon: Stethoscope, desc: 'Practitioner metrics & appointments' },
    { id: 'patient', label: 'Patient Enrolment Report', icon: Users, desc: 'Registered patients & demographics' },
    { id: 'appointment', label: 'Appointment Log Report', icon: CalendarCheck, desc: 'Clinical schedule & visit status' },
    { id: 'obesity_classification', label: 'Obesity Risk Classification Report', icon: Scale, desc: 'ML assessment predictions & scores' }
  ];

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await apiClient.get('/admin/doctors');
      setDoctors(res.data.data.filter(d => d.status === 'active'));
    } catch {
      console.error("Failed to fetch doctors");
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      setReportData(null);
      
      const res = await apiClient.post('/admin/reports/generate', {
        reportType,
        filters
      });
      
      setReportData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    try {
      setDownloading(true);
      const safeTitle = (reportTypes.find(r => r.id === reportType)?.label || 'Report').replace(/\s+/g, '_');
      const filename = `${safeTitle}_${new Date().toISOString().split('T')[0]}.pdf`;
      await exportToPdf('admin-report-content', {
        filename,
        margin: 0.4,
        jsPDF: { format: 'a4', orientation: 'landscape' }
      });
    } catch (err) {
      console.error('Error exporting PDF:', err);
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  const renderReportContent = () => {
    if (!reportData) return null;
    if (reportData.length === 0) {
      return (
        <div className="text-center py-12 text-slate-400 text-xs font-medium">
          No records found matching the specified filter criteria.
        </div>
      );
    }

    const printHeader = (
      <div className="mb-6 text-center border-b pb-4 border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 mb-0.5 tracking-tight">SmartObesity AI Healthcare System</h1>
        <h2 className="text-lg font-semibold text-slate-700">{reportTypes.find(r => r.id === reportType)?.label}</h2>
        <p className="text-xs text-slate-400 mt-1">Generated: {new Date().toLocaleString()}</p>
        {(filters.fromDate || filters.toDate) && (
          <div className="mt-2 flex gap-4 justify-center text-xs text-slate-600">
            {filters.fromDate && <span>From: {filters.fromDate}</span>}
            {filters.toDate && <span>To: {filters.toDate}</span>}
          </div>
        )}
      </div>
    );

    switch (reportType) {
      case 'patient':
        return (
          <div className="print-container">
            {printHeader}
            <table className="w-full text-xs text-left border border-slate-200 border-collapse">
              <thead className="bg-slate-100 border-b border-slate-300">
                <tr>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-700">Patient Name</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-700">Email Address</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-700">Gender</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-700">Account Status</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-700">Registered On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {reportData.map((row, i) => (
                  <tr key={i} className={i % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{row.fullName}</td>
                    <td className="px-4 py-3 text-slate-600">{row.email}</td>
                    <td className="px-4 py-3 text-slate-600 capitalize">{row.gender || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                        row.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{new Date(row.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'doctor':
        return (
          <div className="print-container">
            {printHeader}
            <table className="w-full text-xs text-left border border-slate-200 border-collapse">
              <thead className="bg-slate-100 border-b border-slate-300">
                <tr>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-700">Doctor Name</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-700">Email Address</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-700">Specialisation</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-700">Total Consultations</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-700">Onboarding Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {reportData.map((row, i) => (
                  <tr key={i} className={i % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                    <td className="px-4 py-3 font-semibold text-slate-900">Dr. {row.fullName}</td>
                    <td className="px-4 py-3 text-slate-600">{row.email}</td>
                    <td className="px-4 py-3 text-slate-600">{row.specialisation || 'General Practice'}</td>
                    <td className="px-4 py-3 text-slate-800 font-bold">{row.totalAppointments}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(row.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'appointment':
        return (
          <div className="print-container">
            {printHeader}
            <table className="w-full text-xs text-left border border-slate-200 border-collapse">
              <thead className="bg-slate-100 border-b border-slate-300">
                <tr>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-700">Date & Time</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-700">Patient</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-700">Doctor</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {reportData.map((row, i) => (
                  <tr key={i} className={i % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{new Date(row.date).toLocaleDateString()} {row.time}</td>
                    <td className="px-4 py-3 text-slate-700">{row.patientId?.fullName || 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-700">Dr. {row.doctorId?.fullName || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                        row.status === 'completed' || row.status === 'approved' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : row.status === 'cancelled' || row.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'obesity_classification':
        return (
          <div className="print-container">
            {printHeader}
            <table className="w-full text-xs text-left border border-slate-200 border-collapse">
              <thead className="bg-slate-100 border-b border-slate-300">
                <tr>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-700">Assessment Date</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-700">Patient</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-700">Obesity Class</th>
                  <th className="px-4 py-3 font-bold uppercase tracking-wider text-slate-700">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {reportData.map((row, i) => (
                  <tr key={i} className={i % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{new Date(row.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-700">{row.patientId?.fullName || 'N/A'}</td>
                    <td className="px-4 py-3 font-bold text-rose-600">{row.obesityClass}</td>
                    <td className="px-4 py-3 text-slate-700 font-semibold font-mono">{(row.confidenceScore * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6 pb-10">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Reports & Analytics</h1>
                <p className="text-xs text-slate-500 mt-0.5">Generate, filter, preview, and export clinical audit logs and administrative summaries.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Report Type Selector Tabs / Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
          {reportTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = reportType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => { setReportType(type.id); setReportData(null); }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-900/20 ring-2 ring-teal-600/30'
                    : 'bg-white border-slate-100 text-slate-800 hover:border-slate-200 hover:bg-slate-50/50 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-teal-50 text-teal-600'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-teal-200 ring-4 ring-white/20"></span>
                  )}
                </div>
                <div>
                  <h3 className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>{type.label}</h3>
                  <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-teal-100' : 'text-slate-500'}`}>{type.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Configuration Filters Card */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 sm:p-6 no-print space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Filter className="w-4 h-4 text-teal-600" />
              Report Configuration Filters
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Fine-tune dataset criteria</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {/* From Date */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                From Date
              </label>
              <input 
                type="date" 
                name="fromDate" 
                value={filters.fromDate} 
                onChange={handleFilterChange} 
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none transition" 
              />
            </div>

            {/* To Date */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                To Date
              </label>
              <input 
                type="date" 
                name="toDate" 
                value={filters.toDate} 
                onChange={handleFilterChange} 
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none transition" 
              />
            </div>
            
            {/* Doctor Filter */}
            {(reportType === 'appointment' || reportType === 'obesity_classification' || reportType === 'patient') && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                  Doctor / Clinician
                </label>
                <select 
                  name="doctorId" 
                  value={filters.doctorId} 
                  onChange={handleFilterChange} 
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none transition cursor-pointer"
                >
                  <option value="all">All Doctors</option>
                  {doctors.map(d => (
                    <option key={d._id} value={d._id}>Dr. {d.fullName}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Patient Status */}
            {reportType === 'patient' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                  Patient Status
                </label>
                <select 
                  name="patientStatus" 
                  value={filters.patientStatus} 
                  onChange={handleFilterChange} 
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none transition cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Accounts</option>
                  <option value="inactive">Inactive Accounts</option>
                </select>
              </div>
            )}

            {/* Appointment Status */}
            {reportType === 'appointment' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                  Appointment Status
                </label>
                <select 
                  name="status" 
                  value={filters.status} 
                  onChange={handleFilterChange} 
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none transition cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending Requests</option>
                  <option value="approved">Approved Consultations</option>
                  <option value="completed">Completed Sessions</option>
                  <option value="cancelled">Cancelled Visits</option>
                </select>
              </div>
            )}

            {/* Obesity Category */}
            {reportType === 'obesity_classification' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                  Obesity Classification
                </label>
                <select 
                  name="obesityCategory" 
                  value={filters.obesityCategory} 
                  onChange={handleFilterChange} 
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none transition cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="Underweight">Insufficient Weight</option>
                  <option value="Normal">Normal Weight</option>
                  <option value="Overweight">Overweight</option>
                  <option value="Obesity I">Obesity Type I</option>
                  <option value="Obesity II">Obesity Type II</option>
                  <option value="Obesity III">Obesity Type III</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            {reportData && (
              <button 
                onClick={downloadPDF} 
                disabled={downloading}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" /> : <FileDown className="w-3.5 h-3.5 text-teal-600" />}
                <span>{downloading ? 'Preparing PDF...' : 'Download as PDF'}</span>
              </button>
            )}
            <button 
              onClick={generateReport} 
              disabled={loading} 
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Generate Report</span>
            </button>
          </div>
        </div>

        {/* Report View Area */}
        {(reportData || error) && (
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center no-print">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Report Preview</h3>
              <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-100 px-3 py-0.5 rounded-full">
                {Array.isArray(reportData) ? `${reportData.length} records generated` : 'Dataset ready'}
              </span>
            </div>
            <div id="admin-report-content" className="p-6 overflow-x-auto bg-white text-slate-800 print:p-0">
              {error ? (
                <div className="text-center py-6 text-rose-600 text-xs font-medium">{error}</div>
              ) : (
                renderReportContent()
              )}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
