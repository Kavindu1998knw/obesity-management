import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';

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

function isValidTimeFormat(timeStr) {
  if (typeof timeStr !== 'string') return false;
  const match = timeStr.match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

function getNormalizedMidnight(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
}



// Get patient's appointments
export const getMyAppointments = async (req, res) => {
  try {
    const patientId = req.user._id;
    const appointments = await Appointment.find({ patientId })
      .populate('doctorId', 'fullName email')
      .sort({ date: -1, time: -1 });

    // Fetch Doctor details (specialisation) for each
    const result = await Promise.all(appointments.map(async (appt) => {
      const doctorDetails = await Doctor.findOne({ userId: appt.doctorId?._id });
      return {
        ...appt.toObject(),
        doctorSpecialisation: doctorDetails ? doctorDetails.specialisation : 'Not Specified'
      };
    }));

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get active doctors for request dropdown
// Only returns doctors with an existing Doctor profile
export const getActiveDoctors = async (req, res) => {
  try {
    const activeUsers = await User.find({ role: 'doctor', status: 'active' }).select('fullName email status');
    
    const activeDoctors = [];
    for (const user of activeUsers) {
      const docDetails = await Doctor.findOne({ userId: user._id });
      if (!docDetails) continue; // Skip doctors without a profile
      activeDoctors.push({
        _id: user._id,
        fullName: user.fullName,
        specialisation: docDetails.specialisation || 'General'
      });
    }

    res.status(200).json({ success: true, data: activeDoctors });
  } catch (error) {
    console.error('Error fetching active doctors:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Request new appointment
export const requestAppointment = async (req, res) => {
  try {
    const patientId = req.user._id;
    const { doctorId, date, time, reason, additionalNote } = req.body;

    if (!doctorId || !date || !time || !reason) {
      return res.status(400).json({ success: false, message: 'Doctor, date, time and reason are required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ success: false, message: 'Invalid doctor ID.' });
    }

    // Validate time format
    if (!isValidTimeFormat(time)) {
      return res.status(400).json({ success: false, message: 'Invalid time format. Use HH:mm (e.g. 09:30).' });
    }

    // Validate reason length
    if (reason.trim().length > 500) {
      return res.status(400).json({ success: false, message: 'Reason cannot exceed 500 characters.' });
    }

    // Validate note length
    if (additionalNote && additionalNote.trim().length > 1000) {
      return res.status(400).json({ success: false, message: 'Patient note cannot exceed 1000 characters.' });
    }

    if (!isValidDateStr(date)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment date' });
    }
    const today = new Date().toISOString().slice(0, 10);
    if (date < today) {
      return res.status(400).json({ success: false, message: 'Past appointment dates are not allowed.' });
    }
    
    const requestedDate = getNormalizedMidnight(date);

    // Validate doctor
    const doctorUser = await User.findOne({ _id: doctorId, role: 'doctor', status: 'active' });
    if (!doctorUser) {
      return res.status(400).json({ success: false, message: 'Selected doctor is invalid or inactive.' });
    }

    // Check doctor profile exists
    const doctorProfile = await Doctor.findOne({ userId: doctorId });
    if (!doctorProfile) {
      return res.status(400).json({ success: false, message: 'Selected doctor profile not found.' });
    }

    // Check for duplicates (any doctor, same patient/date/time)
    const duplicate = await Appointment.findOne({
      patientId,
      date: requestedDate,
      time,
      status: { $in: ['pending', 'approved'] }
    });

    if (duplicate) {
      return res.status(400).json({ success: false, message: 'You already have a pending or approved appointment at this date and time.' });
    }

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      date: requestedDate,
      time,
      reason: reason.trim(),
      patientNote: additionalNote ? additionalNote.trim() : '',
      status: 'pending'
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    console.error('Error requesting appointment:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Cancel Appointment
export const cancelAppointment = async (req, res) => {
  try {
    const patientId = req.user._id;
    const { id } = req.params;
    const { cancellationReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID.' });
    }

    if (!cancellationReason || !cancellationReason.trim()) {
      return res.status(400).json({ success: false, message: 'Cancellation reason is required.' });
    }

    if (cancellationReason.trim().length > 1000) {
      return res.status(400).json({ success: false, message: 'Cancellation reason cannot exceed 1000 characters.' });
    }

    const appointment = await Appointment.findOne({ _id: id, patientId });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    if (appointment.status !== 'pending' && appointment.status !== 'approved') {
      return res.status(400).json({ success: false, message: `Cannot cancel a ${appointment.status} appointment.` });
    }

    // If approved, validate date is today or later
    if (appointment.status === 'approved') {
      const dateStr = appointment.date.toISOString().split('T')[0];
      const today = new Date().toISOString().slice(0, 10);
      if (dateStr < today) {
        return res.status(400).json({ success: false, message: 'Cannot cancel past approved appointments.' });
      }
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = cancellationReason.trim();
    await appointment.save();

    res.status(200).json({ success: true, data: appointment });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
