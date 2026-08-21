import React from 'react';
import {
  X,
  CalendarDays,
  Clock,
  User,
  Stethoscope,
  FileText,
  AlertCircle,
  Info,
  CalendarCheck
} from 'lucide-react';

export default function AppointmentViewModal({ isOpen, onClose, appointment }) {
  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Appointment Details</h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-semibold uppercase mt-0.5">
                #{appointment._id?.slice(-6).toUpperCase()}
              </span>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto bg-slate-50/40 space-y-5">
          
          {/* Key Metric Grid */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            
            {/* Consultation Date */}
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl border border-teal-100">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Appointment Date</p>
                <p className="font-bold text-slate-900 mt-0.5">{new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Time */}
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Scheduled Time</p>
                <p className="font-bold text-slate-900 mt-0.5">{appointment.time || '10:00 AM'}</p>
              </div>
            </div>

            {/* Patient */}
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Patient</p>
                <p className="font-bold text-slate-900 truncate mt-0.5">{appointment.patientId?.fullName || 'Unknown'}</p>
                <p className="text-[11px] text-slate-500 truncate">{appointment.patientId?.email}</p>
              </div>
            </div>

            {/* Doctor */}
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Assigned Doctor</p>
                <p className="font-bold text-slate-900 truncate mt-0.5">Dr. {appointment.doctorId?.fullName || 'Unknown'}</p>
                <p className="text-[11px] text-slate-500 truncate">{appointment.doctorId?.email}</p>
              </div>
            </div>

            {/* Booking Date */}
            <div className="col-span-1 sm:col-span-2 pt-2 border-t border-slate-100 flex items-center justify-between text-slate-500">
              <span className="text-[11px]">Request Created:</span>
              <span className="text-[11px] font-semibold text-slate-700">{new Date(appointment.createdAt).toLocaleString()}</span>
            </div>

          </div>

          {/* Notes & Justifications */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 text-xs">
            <div>
              <h4 className="font-semibold text-slate-800 mb-1.5 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                Reason for Appointment
              </h4>
              <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/60 leading-relaxed">
                {appointment.reason || 'No specific clinical reason provided by the patient.'}
              </p>
            </div>

            {appointment.patientNote && (
              <div>
                <h4 className="font-semibold text-slate-800 mb-1.5">Patient Note</h4>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/60 leading-relaxed">
                  {appointment.patientNote}
                </p>
              </div>
            )}

            {appointment.status === 'rejected' && appointment.rejectionReason && (
              <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl">
                <h4 className="font-semibold text-rose-900 flex items-center gap-1.5 mb-1">
                  <AlertCircle className="w-4 h-4 text-rose-600" /> Rejection Justification
                </h4>
                <p className="text-rose-700 leading-relaxed">{appointment.rejectionReason}</p>
              </div>
            )}

            {appointment.status === 'cancelled' && appointment.cancellationReason && (
              <div className="bg-slate-100 border border-slate-200 p-3.5 rounded-xl">
                <h4 className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                  <AlertCircle className="w-4 h-4 text-slate-600" /> Cancellation Justification
                </h4>
                <p className="text-slate-700 leading-relaxed">{appointment.cancellationReason}</p>
              </div>
            )}

            {appointment.rescheduleNote && (
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl">
                <h4 className="font-semibold text-amber-900 flex items-center gap-1.5 mb-1">
                  <Info className="w-4 h-4 text-amber-600" /> Reschedule Explanation
                </h4>
                <p className="text-amber-800 leading-relaxed">{appointment.rescheduleNote}</p>
              </div>
            )}

            {appointment.adminNote && (
              <div className="bg-teal-50/70 border border-teal-200 p-3.5 rounded-xl">
                <h4 className="font-semibold text-teal-950 flex items-center gap-1.5 mb-1">
                  <Info className="w-4 h-4 text-teal-600" /> Administrative Memo
                </h4>
                <p className="text-teal-900 leading-relaxed">{appointment.adminNote}</p>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
