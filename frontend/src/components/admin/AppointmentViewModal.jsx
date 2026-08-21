import React from 'react';
import { FaXmark, FaCalendarDay, FaUserDoctor, FaUser, FaCircleExclamation, FaClock } from 'react-icons/fa6';

export default function AppointmentViewModal({ isOpen, onClose, appointment }) {
  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60" onClick={onClose}></div>
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">Appointment Details</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 focus:outline-none">
            <FaXmark className="text-xl" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-slate-50">
          <div className="space-y-6">
            
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><FaCalendarDay /></div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Date</p>
                  <p className="font-bold text-slate-900">{new Date(appointment.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg"><FaCalendarDay /></div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Created Date</p>
                  <p className="font-bold text-slate-900">{new Date(appointment.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><FaClock /></div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Time</p>
                  <p className="font-bold text-slate-900">{appointment.time}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><FaUser /></div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Patient</p>
                  <p className="font-bold text-slate-900">{appointment.patientId?.fullName}</p>
                  <p className="text-sm text-slate-500">{appointment.patientId?.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-lg"><FaUserDoctor /></div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Assigned Doctor</p>
                  <p className="font-bold text-slate-900">Dr. {appointment.doctorId?.fullName}</p>
                  <p className="text-sm text-slate-500">{appointment.doctorId?.email}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-1">Reason for Appointment</h4>
                <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {appointment.reason || 'No reason provided by the patient.'}
                </p>
              </div>

              {appointment.patientNote && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 mb-1">Patient Note</h4>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {appointment.patientNote}
                  </p>
                </div>
              )}

              {appointment.status === 'rejected' && appointment.rejectionReason && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-rose-800 flex items-center gap-2 mb-1">
                    <FaCircleExclamation /> Rejection Reason
                  </h4>
                  <p className="text-rose-600 text-sm">{appointment.rejectionReason}</p>
                </div>
              )}

              {appointment.status === 'cancelled' && appointment.cancellationReason && (
                <div className="bg-slate-100 border border-slate-300 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-1">
                    <FaCircleExclamation /> Cancellation Reason
                  </h4>
                  <p className="text-slate-700 text-sm">{appointment.cancellationReason}</p>
                </div>
              )}

              {appointment.rescheduleNote && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-amber-800 mb-1">Reschedule Note</h4>
                  <p className="text-amber-700 text-sm">{appointment.rescheduleNote}</p>
                </div>
              )}

              {appointment.adminNote && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">Admin Note</h4>
                  <p className="text-blue-700 text-sm">{appointment.adminNote}</p>
                </div>
              )}
            </div>

          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
