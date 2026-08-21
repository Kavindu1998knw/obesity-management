import React, { useState, useEffect } from 'react';
import { X, Loader2, Calendar, Clock, User, Stethoscope, AlertTriangle } from 'lucide-react';

export default function AppointmentCancelModal({ isOpen, onClose, onSubmit, appointment, loading }) {
  const [cancellationReason, setCancellationReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCancellationReason('');
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cancellationReason.trim()) {
      alert("Cancellation Reason is required.");
      return;
    }
    onSubmit({ cancellationReason });
  };

  if (!isOpen || !appointment) return null;

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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-950 leading-tight">Cancel Appointment</h3>
              <p className="text-[11px] text-rose-700">This action will cancel the scheduled consultation</p>
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
        <div className="p-6 space-y-4">
          <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-4 space-y-2 text-xs">
            <p className="text-rose-900 font-bold uppercase tracking-wider text-[10px]">
              Appointment To Be Cancelled:
            </p>
            <div className="space-y-1.5 text-slate-700 pt-1">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span className="font-semibold">{appointment.patientId?.fullName || 'Patient'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Dr. {appointment.doctorId?.fullName || 'Assigned Clinician'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{appointment.time || '10:00 AM'}</span>
              </div>
            </div>
          </div>

          <form id="cancel-form" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cancellation Reason <span className="text-rose-500">*</span>
              </label>
              <textarea 
                value={cancellationReason} 
                onChange={(e) => setCancellationReason(e.target.value)} 
                disabled={loading} 
                rows={3} 
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition placeholder:text-slate-400" 
                placeholder="Reason for cancelling this appointment..." 
                required
              />
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
            Close
          </button>
          <button 
            type="submit" 
            form="cancel-form" 
            disabled={loading} 
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Confirm Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
