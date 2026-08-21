import React, { useState, useEffect } from 'react';
import { FaXmark, FaSpinner } from 'react-icons/fa6';

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
      <div className="fixed inset-0 bg-slate-900/60" onClick={!loading ? onClose : undefined}></div>
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Cancel Appointment</h3>
          <button onClick={onClose} disabled={loading} className="text-slate-400 hover:text-slate-600 focus:outline-none">
            <FaXmark className="text-xl" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-rose-50 border border-rose-100 rounded-lg p-4 mb-4">
            <p className="text-sm text-rose-800 font-medium mb-2">You are about to cancel this appointment:</p>
            <ul className="text-sm text-rose-900 space-y-1">
              <li><strong>Patient:</strong> {appointment.patientId?.fullName || 'Unknown'}</li>
              <li><strong>Doctor:</strong> Dr. {appointment.doctorId?.fullName || 'Unknown'}</li>
              <li><strong>Date:</strong> {new Date(appointment.date).toLocaleDateString()}</li>
              <li><strong>Time:</strong> {appointment.time}</li>
            </ul>
          </div>

          <form id="cancel-form" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cancellation Reason *</label>
              <textarea 
                value={cancellationReason} 
                onChange={(e) => setCancellationReason(e.target.value)} 
                disabled={loading} 
                rows={3} 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-rose-500 text-sm" 
                placeholder="Reason for cancelling the appointment..." 
              />
            </div>
          </form>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
            Close
          </button>
          <button type="submit" form="cancel-form" disabled={loading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700">
            {loading && <FaSpinner className="animate-spin" />}
            Confirm Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
