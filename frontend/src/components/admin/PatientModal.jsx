import React, { useState, useEffect } from 'react';
import { X, Loader2, Stethoscope, User, Calendar } from 'lucide-react';
import apiClient from '../../services/apiClient';

export default function PatientModal({ isOpen, onClose, onSubmit, patient, loading }) {
  const [doctors, setDoctors] = useState([]);
  const [fetchingDocs, setFetchingDocs] = useState(false);

  const [formData, setFormData] = useState({
    assignedDoctor: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchActiveDoctors();
    }
  }, [isOpen]);

  useEffect(() => {
    if (patient) {
      setFormData({
        assignedDoctor: patient.assignedDoctor?._id || ''
      });
    }
  }, [patient, isOpen]);

  const fetchActiveDoctors = async () => {
    try {
      setFetchingDocs(true);
      const res = await apiClient.get('/admin/doctors');
      const activeDocs = res.data.data.filter(d => d.status === 'active');
      setDoctors(activeDocs);
    } catch {
      console.error('Failed to load active doctors');
    } finally {
      setFetchingDocs(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.assignedDoctor) {
      alert("Please select an active doctor to assign.");
      return;
    }
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
        onClick={!loading ? onClose : undefined}
      />
      
      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Assign Clinical Doctor</h3>
              <p className="text-[11px] text-slate-500">Allocate patient care responsibility to an active clinician</p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            disabled={loading} 
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          <form id="assign-doctor-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Patient Info Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Selected Patient</p>
                <p className="text-xs font-bold text-slate-900 truncate">{patient?.fullName || 'Patient'}</p>
                <p className="text-[11px] text-slate-500 truncate">{patient?.email || ''}</p>
              </div>
            </div>

            {/* Doctor Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Active Practitioner <span className="text-rose-500">*</span>
              </label>
              <select 
                name="assignedDoctor" 
                value={formData.assignedDoctor} 
                onChange={handleChange} 
                disabled={loading || fetchingDocs} 
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition cursor-pointer"
                required
              >
                <option value="">-- Choose from Active Doctors List --</option>
                {patient?.assignedDoctor && !doctors.some(d => d._id === patient.assignedDoctor._id) && (
                  <option value={patient.assignedDoctor._id} disabled>
                    Dr. {patient.assignedDoctor.fullName} (Inactive Practitioner - Please Reassign)
                  </option>
                )}
                {doctors.map(doc => (
                  <option key={doc._id} value={doc._id}>
                    Dr. {doc.fullName} — {doc.profile?.specialisation || 'General Practice'}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Assignment Date Notice */}
            <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-xl text-xs text-teal-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Assignment timestamp will automatically be stamped upon confirmation.</span>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-2.5">
          <button 
            type="button" 
            onClick={onClose} 
            disabled={loading} 
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="assign-doctor-form" 
            disabled={loading} 
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Confirm Assignment</span>
          </button>
        </div>
      </div>
    </div>
  );
}
