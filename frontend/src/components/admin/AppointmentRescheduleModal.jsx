import React, { useState, useEffect } from 'react';
import { X, Loader2, CalendarClock } from 'lucide-react';
import apiClient from '../../services/apiClient';

export default function AppointmentRescheduleModal({ isOpen, onClose, onSubmit, appointment, loading }) {
  const [doctors, setDoctors] = useState([]);
  const [fetchingDocs, setFetchingDocs] = useState(false);
  
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    doctorId: '',
    rescheduleNote: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchActiveDoctors();
      if (appointment) {
        setFormData({
          date: new Date(appointment.date).toISOString().split('T')[0],
          time: appointment.time,
          doctorId: appointment.doctorId?._id || '',
          rescheduleNote: ''
        });
      }
    }
  }, [isOpen, appointment]);

  const fetchActiveDoctors = async () => {
    try {
      setFetchingDocs(true);
      const res = await apiClient.get('/admin/doctors');
      setDoctors(res.data.data.filter(d => d.status === 'active'));
    } catch {
      console.error('Failed to fetch doctors');
    } finally {
      setFetchingDocs(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.date || !formData.time || !formData.doctorId) {
      alert("Date, time, and doctor are required to reschedule.");
      return;
    }
    if (!formData.rescheduleNote.trim()) {
      alert("Reschedule note is required.");
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200">
              <CalendarClock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-950 leading-tight">Reschedule Appointment</h3>
              <p className="text-[11px] text-amber-700">Select new slot and practitioner</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Date <span className="text-rose-500">*</span>
              </label>
              <input 
                type="date" 
                name="date" 
                value={formData.date} 
                onChange={handleChange} 
                disabled={loading} 
                required 
                min={new Date().toISOString().split('T')[0]} 
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none transition" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New Time <span className="text-rose-500">*</span>
              </label>
              <input 
                type="time" 
                name="time" 
                value={formData.time} 
                onChange={handleChange} 
                disabled={loading} 
                required 
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none transition" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assign Practitioner <span className="text-rose-500">*</span>
            </label>
            <select 
              name="doctorId" 
              value={formData.doctorId} 
              onChange={handleChange} 
              disabled={loading || fetchingDocs} 
              required 
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none transition cursor-pointer"
            >
              <option value="">-- Select an active doctor --</option>
              {doctors.map(doc => (
                <option key={doc._id} value={doc._id}>
                  Dr. {doc.fullName} ({doc.profile?.specialisation || 'General'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reschedule Note / Reason <span className="text-rose-500">*</span>
            </label>
            <textarea 
              name="rescheduleNote" 
              value={formData.rescheduleNote} 
              onChange={handleChange} 
              disabled={loading} 
              rows={2} 
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none transition placeholder:text-slate-400" 
              placeholder="Explain the time shift reason for patient notification..." 
              required 
            />
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
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
              disabled={loading} 
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirm Reschedule</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
