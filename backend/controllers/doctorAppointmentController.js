import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';
import User from '../models/User.js';

// ==========================================
// DATE & TIME HELPERS
// ==========================================

function isValidDateStr(dateStr) {
  if (typeof dateStr !== 'string') return false;
  // strict YYYY-MM-DD
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  
  if (month < 1 || month > 12) return false;
  
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > daysInMonth) return false;
  
  return true;
}

function getNormalizedMidnight(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
}

// GET /api/doctor/appointments
// Get all appointments for the logged in doctor (approved, completed, cancelled)
export const getMyAppointments = async (req, res) => {
  try {
    const doctorId = req.user._id;

    const appointments = await Appointment.find({ 
      doctorId,
      status: { $in: ['approved', 'completed', 'cancelled'] }
    })
    .populate('patientId', 'fullName email')
    .sort({ date: 1, time: 1 });

    // Since we also want to provide Patient Profile ID to the frontend to link to the view patient page,
    // we need to get the corresponding Patient document for each User ID.
    const appointmentData = [];
    
    for (const appt of appointments) {
      if (!appt.patientId) continue;
      
      const patientProfile = await Patient.findOne({ userId: appt.patientId._id });
      
      appointmentData.push({
        _id: appt._id,
        date: appt.date,
        time: appt.time,
        reason: appt.reason,
        patientNote: appt.patientNote || '',
        status: appt.status,
        adminNote: appt.adminNote,
        consultationNote: appt.consultationNote,
        followUpRequired: appt.followUpRequired,
        suggestedFollowUpDate: appt.suggestedFollowUpDate,
        createdAt: appt.createdAt,
        patient: {
          userId: appt.patientId._id,
          patientProfileId: patientProfile ? patientProfile._id : null,
          name: appt.patientId.fullName,
          email: appt.patientId.email,
        }
      });
    }

    res.status(200).json({
      success: true,
      data: appointmentData
    });
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// PUT /api/doctor/appointments/:id/complete
// Complete an appointment and add consultation notes
export const completeAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const doctorId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID.' });
    }

    const { consultationNote, followUpRequired, suggestedFollowUpDate } = req.body;

    const appointment = await Appointment.findOne({ _id: appointmentId, doctorId });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found or not assigned to you.' });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({ success: false, message: 'This appointment has already been completed.' });
    }

    if (appointment.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Only approved appointments can be marked as completed.' });
    }

    if (!consultationNote || consultationNote.trim() === '') {
      return res.status(400).json({ success: false, message: 'Consultation note is required to complete an appointment.' });
    }

    if (consultationNote.trim().length > 2000) {
      return res.status(400).json({ success: false, message: 'Consultation note cannot exceed 2000 characters.' });
    }

    appointment.status = 'completed';
    appointment.consultationNote = consultationNote.trim();
    appointment.followUpRequired = Boolean(followUpRequired);
    
    if (appointment.followUpRequired && suggestedFollowUpDate) {
      // Expecting YYYY-MM-DD
      const dateStr = typeof suggestedFollowUpDate === 'string' ? suggestedFollowUpDate.split('T')[0] : '';
      if (!isValidDateStr(dateStr)) {
        return res.status(400).json({ success: false, message: 'Invalid appointment date' });
      }
      
      const followUpNormalized = getNormalizedMidnight(dateStr);
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayNormalized = getNormalizedMidnight(todayStr);
      
      if (followUpNormalized < todayNormalized) {
        return res.status(400).json({ success: false, message: 'Follow-up date cannot be in the past.' });
      }
      appointment.suggestedFollowUpDate = followUpNormalized;
    } else {
      // Clear follow-up date if not required
      appointment.suggestedFollowUpDate = undefined;
    }

    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment marked as completed.',
      data: appointment
    });
  } catch (error) {
    console.error('Error completing appointment:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
