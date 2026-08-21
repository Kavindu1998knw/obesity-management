import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import apiClient from '../../services/apiClient';
import { FaFileInvoice, FaFilePdf, FaSpinner, FaHospitalUser, FaUserDoctor, FaCalendarCheck, FaScaleBalanced, FaArrowTrendUp } from 'react-icons/fa6';
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
    { id: 'doctor', label: 'Doctor Report', icon: <FaUserDoctor /> },
    { id: 'patient', label: 'Patient Report', icon: <FaHospitalUser /> },
    { id: 'appointment', label: 'Appointment Report', icon: <FaCalendarCheck /> },
    { id: 'obesity_classification', label: 'Obesity Classification Report', icon: <FaScaleBalanced /> }
  ];

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await apiClient.get('/admin/doctors');
      setDoctors(res.data.data.filter(d => d.status === 'active'));
    } catch (err) {
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
    if (reportData.length === 0) return <div className="text-center p-8 text-slate-500">No data found for the selected filters.</div>;

    const printHeader = (
      <div className="mb-6 text-center border-b pb-4 border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Hospital Dietary Management System</h1>
        <h2 className="text-xl font-semibold text-slate-700">{reportTypes.find(r => r.id === reportType)?.label}</h2>
        <p className="text-xs text-slate-500 mt-1">Generated on: {new Date().toLocaleString()}</p>
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
            <table className="w-full text-sm text-left border border-slate-200 border-collapse">
              <thead className="bg-slate-100 border-b-2 border-slate-300">
                <tr>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-800 bg-slate-100 border-b border-slate-300">Patient Name</th>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-800 bg-slate-100 border-b border-slate-300">Email</th>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-800 bg-slate-100 border-b border-slate-300">Gender</th>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-800 bg-slate-100 border-b border-slate-300">Status</th>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-800 bg-slate-100 border-b border-slate-300">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {reportData.map((row, i) => (
                  <tr key={i} className={i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="px-4 py-3 font-medium text-slate-800">{row.fullName}</td>
                    <td className="px-4 py-3 text-slate-600">{row.email}</td>
                    <td className="px-4 py-3 text-slate-600">{row.gender || 'N/A'}</td>
                    <td className="px-4 py-3"><span className="inline-block px-2 py-0.5 text-xs font-semibold rounded capitalize bg-emerald-50 text-emerald-700 border border-emerald-200">{row.status}</span></td>
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
            <table className="w-full text-sm text-left border border-slate-200 border-collapse">
              <thead className="bg-slate-100 border-b-2 border-slate-300">
                <tr>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-800 bg-slate-100 border-b border-slate-300">Doctor Name</th>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-800 bg-slate-100 border-b border-slate-300">Email</th>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-800 bg-slate-100 border-b border-slate-300">Specialisation</th>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-800 bg-slate-100 border-b border-slate-300">Total Appointments</th>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-800 bg-slate-100 border-b border-slate-300">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {reportData.map((row, i) => (
                  <tr key={i} className={i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="px-4 py-3 font-medium text-slate-800">Dr. {row.fullName}</td>
                    <td className="px-4 py-3 text-slate-600">{row.email}</td>
                    <td className="px-4 py-3 text-slate-600">{row.specialisation || 'General'}</td>
                    <td className="px-4 py-3 text-slate-700 font-semibold">{row.totalAppointments}</td>
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
            <table className="w-full text-sm text-left border border-slate-200 border-collapse">
              <thead className="bg-slate-100 border-b-2 border-slate-300">
                <tr>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-800 bg-slate-100 border-b border-slate-300">Date & Time</th>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-800 bg-slate-100 border-b border-slate-300">Patient</th>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-800 bg-slate-100 border-b border-slate-300">Doctor</th>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-800 bg-slate-100 border-b border-slate-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {reportData.map((row, i) => (
                  <tr key={i} className={i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="px-4 py-3 font-medium text-slate-800">{new Date(row.date).toLocaleDateString()} {row.time}</td>
                    <td className="px-4 py-3 text-slate-700">{row.patientId?.fullName || 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-700">Dr. {row.doctorId?.fullName || 'N/A'}</td>
                    <td className="px-4 py-3"><span className="inline-block px-2 py-0.5 text-xs font-semibold rounded capitalize bg-blue-50 text-blue-700 border border-blue-200">{row.status}</span></td>
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
            <table className="w-full text-sm text-left border border-slate-200 border-collapse">
              <thead className="bg-slate-100 border-b-2 border-slate-300">
                <tr>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-800 bg-slate-100 border-b border-slate-300">Assessment Date</th>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-800 bg-slate-100 border-b border-slate-300">Patient</th>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-800 bg-slate-100 border-b border-slate-300">Obesity Class</th>
                  <th className="px-4 py-3 font-bold text-xs uppercase tracking-wider text-slate-800 bg-slate-100 border-b border-slate-300">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {reportData.map((row, i) => (
                  <tr key={i} className={i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="px-4 py-3 font-medium text-slate-800">{new Date(row.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-700">{row.patientId?.fullName || 'N/A'}</td>
                    <td className="px-4 py-3 font-bold text-rose-600">{row.obesityClass}</td>
                    <td className="px-4 py-3 text-slate-700 font-semibold">{(row.confidenceScore * 100).toFixed(1)}%</td>
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
      <div className="mb-8 no-print">
        <h1 className="text-2xl font-bold text-[#172033] flex items-center gap-2">
          <FaFileInvoice className="text-blue-600" />
          System Reports
        </h1>
        <p className="text-sm text-[#64748B] mt-1">Generate and download clinical and administrative summaries.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6 no-print">
        {/* Report Type Selector */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-semibold text-slate-800">Report Type</h3>
          </div>
          <div className="p-2 space-y-1">
            {reportTypes.map(type => (
              <button
                key={type.id}
                onClick={() => { setReportType(type.id); setReportData(null); }}
                className={`w-full text-left px-4 py-3 text-sm rounded-lg flex items-center gap-3 transition-colors ${
                  reportType === type.id 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className={reportType === type.id ? 'text-blue-600' : 'text-slate-400'}>{type.icon}</span>
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Configuration Filters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">From Date</label>
              <input type="date" name="fromDate" value={filters.fromDate} onChange={handleFilterChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">To Date</label>
              <input type="date" name="toDate" value={filters.toDate} onChange={handleFilterChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm" />
            </div>
            
            {(reportType === 'appointment' || reportType === 'obesity_classification' || reportType === 'patient') && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">Doctor</label>
                <select name="doctorId" value={filters.doctorId} onChange={handleFilterChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm bg-white">
                  <option value="all">All Doctors</option>
                  {doctors.map(d => <option key={d._id} value={d._id}>Dr. {d.fullName}</option>)}
                </select>
              </div>
            )}

            {reportType === 'patient' && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">Patient Status</label>
                <select name="patientStatus" value={filters.patientStatus} onChange={handleFilterChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm bg-white">
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}

            {reportType === 'appointment' && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">Status</label>
                <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm bg-white">
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}

            {reportType === 'obesity_classification' && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">Obesity Category</label>
                <select name="obesityCategory" value={filters.obesityCategory} onChange={handleFilterChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500 text-sm bg-white">
                  <option value="all">All Categories</option>
                  <option value="Underweight">Underweight</option>
                  <option value="Normal">Normal</option>
                  <option value="Overweight">Overweight</option>
                  <option value="Obesity I">Obesity I</option>
                  <option value="Obesity II">Obesity II</option>
                  <option value="Obesity III">Obesity III</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            {reportData && (
              <button 
                onClick={downloadPDF} 
                disabled={downloading}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                {downloading ? <FaSpinner className="animate-spin text-rose-600" /> : <FaFilePdf className="text-rose-600" />}
                {downloading ? 'Generating PDF...' : 'Download as PDF'}
              </button>
            )}
            <button onClick={generateReport} disabled={loading} className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
              {loading && <FaSpinner className="animate-spin" />}
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Report View Area */}
      {(reportData || error) && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 no-print">
            <h3 className="font-bold text-slate-800">Report Preview</h3>
          </div>
          <div id="admin-report-content" className="p-6 overflow-x-auto bg-white text-slate-800 print:p-0">
            {error ? (
              <div className="text-center p-4 text-rose-600">{error}</div>
            ) : (
              renderReportContent()
            )}
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
