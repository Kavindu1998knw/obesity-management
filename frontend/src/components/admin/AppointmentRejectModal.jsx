import React, { useState } from 'react';
import { FaXmark, FaSpinner } from 'react-icons/fa6';

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
      <div className="fixed inset-0 bg-slate-900/60" onClick={!loading ? onClose : undefined}></div>
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-rose-600">Reject Appointment</h3>
          <button onClick={onClose} disabled={loading} className="text-slate-400 hover:text-slate-600 focus:outline-none">
            <FaXmark className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-sm text-slate-600 mb-4">
            Please select a reason for rejecting this appointment. This reason will be recorded.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rejection Reason *</label>
              <select 
                value={selectedReason} 
                onChange={(e) => setSelectedReason(e.target.value)} 
                disabled={loading}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-rose-500 bg-white"
              >
                {predefinedReasons.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {selectedReason === 'Other' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Specify Reason *</label>
                <textarea 
                  value={customReason} 
                  onChange={(e) => setCustomReason(e.target.value)}
                  disabled={loading}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-rose-500"
                  placeholder="Type custom reason here..."
                  required
                />
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700">
              {loading && <FaSpinner className="animate-spin" />}
              Confirm Rejection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
