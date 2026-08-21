import React, { useState, useEffect } from 'react';
import { FaXmark, FaSpinner } from 'react-icons/fa6';
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
    } catch (err) {
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
      <div className="fixed inset-0 bg-slate-900/60" onClick={!loading ? onClose : undefined}></div>
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-amber-600">Reschedule Appointment</h3>
          <button onClick={onClose} disabled={loading} className="text-slate-400 hover:text-slate-600 focus:outline-none">
            <FaXmark className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Date *</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} disabled={loading} required min={new Date().toISOString().split('T')[0]} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-amber-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Time *</label>
              <input type="time" name="time" value={formData.time} onChange={handleChange} disabled={loading} required className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-amber-500 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Assign Doctor *</label>
            <select name="doctorId" value={formData.doctorId} onChange={handleChange} disabled={loading || fetchingDocs} required className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-amber-500 text-sm bg-white">
              <option value="">Select a doctor</option>
              {doctors.map(doc => (
                <option key={doc._id} value={doc._id}>Dr. {doc.fullName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Reschedule Note *</label>
            <textarea name="rescheduleNote" value={formData.rescheduleNote} onChange={handleChange} disabled={loading} rows={2} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-amber-500 text-sm" placeholder="Reason for changing time..." required />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700">
              {loading && <FaSpinner className="animate-spin" />}
              Confirm Reschedule
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
