import React, { useState } from 'react';
import { X, Loader2, Ban } from 'lucide-react';

export default function AppointmentRejectModal({ isOpen, onClose, onSubmit, loading }) {
  const predefinedReasons = [
    'Doctor unavailable',
    'Selected time unavailable',
    'Clinic closed',
    'Invalid appointment request',
    'Other'
  ];

  const [selectedReason, setSelectedReason] = useState(predefinedReasons[0]);
  const [customReason, setCustomReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalReason = selectedReason === 'Other' ? customReason.trim() : selectedReason;
    
    if (!finalReason) {
      alert('Please provide a rejection reason.');
      return;
    }
    
    onSubmit(finalReason);
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200">
              <Ban className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-950 leading-tight">Reject Appointment</h3>
              <p className="text-[11px] text-rose-700">Formal reason will be documented in patient records</p>
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
          <p className="text-xs text-slate-600 leading-relaxed">
            Please select the official administrative reason for rejecting this consultation request.
          </p>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <select 
                value={selectedReason} 
                onChange={(e) => setSelectedReason(e.target.value)} 
                disabled={loading}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition cursor-pointer"
              >
                {predefinedReasons.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {selectedReason === 'Other' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Specify Custom Reason <span className="text-rose-500">*</span>
                </label>
                <textarea 
                  value={customReason} 
                  onChange={(e) => setCustomReason(e.target.value)}
                  disabled={loading}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none transition placeholder:text-slate-400"
                  placeholder="Explain why this request is rejected..."
                  required
                  autoFocus
                />
              </div>
            )}
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
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirm Rejection</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
