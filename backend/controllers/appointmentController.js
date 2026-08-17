import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';

// @desc    Get All Appointments
// @route   GET /api/appointments
// @access  Private/Admin
export const getAppointments = async (req, res) => {
  try {
    const list = await Appointment.find()
      .populate({
        path: 'patientId',
        populate: { path: 'userId' }
      })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId' }
      })
      .sort({ createdAt: -1 });

    const formatted = list
      .filter(item => item.patientId && item.patientId.userId && item.doctorId && item.doctorId.userId)
      .map(item => ({
        _id: item._id,
        patientId: item.patientId._id,
        patientName: item.patientId.userId.fullName,
        patientEmail: item.patientId.userId.email,
        patientPhone: item.patientId.phoneNumber,
        patientGender: item.patientId.gender,
        patientDob: item.patientId.dob,
        latestBmi: item.patientId.latestBmi,
        latestWeight: item.patientId.latestWeight,
        latestHeight: item.patientId.latestHeight,
        latestPrediction: item.patientId.latestPrediction,
        latestMealPlan: item.patientId.latestMealPlan,
        doctorId: item.doctorId._id,
        doctorName: item.doctorId.userId.fullName,
        doctorEmail: item.doctorId.userId.email,
        department: item.department,
        appointmentDate: item.appointmentDate,
        appointmentTime: item.appointmentTime,
        reasonForVisit: item.reasonForVisit,
        status: item.status,
        notes: item.notes,
        createdAt: item.createdAt
      }));

    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    console.error('Error fetching appointments:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve appointments.' });
  }
};

// @desc    Create Appointment
// @route   POST /api/appointments
// @access  Private/Admin
export const createAppointment = async (req, res) => {
  try {
    const { patientId, doctorId, department, appointmentDate, appointmentTime, reasonForVisit, notes } = req.body;

    if (!patientId || !doctorId || !department || !appointmentDate || !appointmentTime || !reasonForVisit) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }

    const patientExists = await Patient.findById(patientId);
    if (!patientExists) {
      return res.status(400).json({ success: false, message: 'Patient not found.' });
    }

    const doctorExists = await Doctor.findById(doctorId);
    if (!doctorExists) {
      return res.status(400).json({ success: false, message: 'Doctor not found.' });
    }

    const appointment = new Appointment({
      patientId,
      doctorId,
      department,
      appointmentDate,
      appointmentTime,
      reasonForVisit,
      notes: notes || '',
      status: 'Pending'
    });

    await appointment.save();

    return res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: appointment
    });
  } catch (err) {
    console.error('Error creating appointment:', err);
    return res.status(500).json({ success: false, message: 'Failed to create appointment.' });
  }
};

// @desc    Update Appointment
// @route   PUT /api/appointments/:id
// @access  Private/Admin
export const updateAppointment = async (req, res) => {
  try {
    const { doctorId, department, appointmentDate, appointmentTime, status, notes } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    if (doctorId) {
      const doctorExists = await Doctor.findById(doctorId);
      if (!doctorExists) {
        return res.status(400).json({ success: false, message: 'Doctor not found.' });
      }
      appointment.doctorId = doctorId;
    }

    if (department) appointment.department = department;
    if (appointmentDate) appointment.appointmentDate = appointmentDate;
    if (appointmentTime) appointment.appointmentTime = appointmentTime;
    if (status) appointment.status = status;
    if (notes !== undefined) appointment.notes = notes;

    await appointment.save();

    return res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: appointment
    });
  } catch (err) {
    console.error('Error updating appointment:', err);
    return res.status(500).json({ success: false, message: 'Failed to update appointment.' });
  }
};

// @desc    Delete Appointment
// @route   DELETE /api/appointments/:id
// @access  Private/Admin
export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting appointment:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete appointment.' });
  }
};

// @desc    Approve Appointment
// @route   PATCH /api/appointments/:id/approve
// @access  Private/Admin
export const approveAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    appointment.status = 'Confirmed';
    await appointment.save();

    return res.status(200).json({
      success: true,
      message: 'Appointment approved successfully',
      data: appointment
    });
  } catch (err) {
    console.error('Error approving appointment:', err);
    return res.status(500).json({ success: false, message: 'Failed to approve appointment.' });
  }
};

// @desc    Reject Appointment
// @route   PATCH /api/appointments/:id/reject
// @access  Private/Admin
export const rejectAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    appointment.status = 'Rejected';
    await appointment.save();

    return res.status(200).json({
      success: true,
      message: 'Appointment rejected successfully',
      data: appointment
    });
  } catch (err) {
    console.error('Error rejecting appointment:', err);
    return res.status(500).json({ success: false, message: 'Failed to reject appointment.' });
  }
};

// @desc    Get Patient Appointments
// @route   GET /api/patient/appointments
// @access  Private/Patient
export const getPatientAppointments = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    const list = await Appointment.find({ patientId: patient._id })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId' }
      })
      .sort({ createdAt: -1 });

    const formatted = list
      .filter(item => item.doctorId && item.doctorId.userId)
      .map(item => ({
        _id: item._id,
        doctorId: item.doctorId._id,
        doctorName: item.doctorId.userId.fullName,
        doctorEmail: item.doctorId.userId.email,
        department: item.department,
        appointmentDate: item.appointmentDate,
        appointmentTime: item.appointmentTime,
        reasonForVisit: item.reasonForVisit,
        status: item.status,
        notes: item.notes,
        createdAt: item.createdAt
      }));

    return res.status(200).json({ success: true, data: formatted });
  } catch (err) {
    console.error('Error fetching patient appointments:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve appointments.' });
  }
};

// @desc    Create Patient Appointment Request
// @route   POST /api/patient/appointments
// @access  Private/Patient
export const createPatientAppointment = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    const { doctorId, department, appointmentDate, appointmentTime, reasonForVisit, notes } = req.body;

    if (!doctorId || !department || !appointmentDate || !appointmentTime || !reasonForVisit) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }

    const doctorExists = await Doctor.findById(doctorId);
    if (!doctorExists) {
      return res.status(400).json({ success: false, message: 'Doctor not found.' });
    }

    const appointment = new Appointment({
      patientId: patient._id,
      doctorId,
      department,
      appointmentDate,
      appointmentTime,
      reasonForVisit,
      notes: notes || '',
      status: 'Pending'
    });

    await appointment.save();

    return res.status(201).json({
      success: true,
      message: 'Appointment request submitted successfully',
      data: appointment
    });
  } catch (err) {
    console.error('Error creating patient appointment:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit appointment request.' });
  }
};

// @desc    Reschedule Patient Appointment Request
// @route   PUT /api/patient/appointments/:id/reschedule
// @access  Private/Patient
export const reschedulePatientAppointment = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    const { appointmentDate, appointmentTime, notes } = req.body;

    if (!appointmentDate || !appointmentTime) {
      return res.status(400).json({ success: false, message: 'Date and time are required for rescheduling.' });
    }

    const appointment = await Appointment.findOne({ _id: req.params.id, patientId: patient._id });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    appointment.appointmentDate = appointmentDate;
    appointment.appointmentTime = appointmentTime;
    appointment.status = 'Reschedule Pending';
    if (notes) {
      appointment.notes = `${appointment.notes || ''}\n[Reschedule Reason]: ${notes}`.trim();
    }

    await appointment.save();

    return res.status(200).json({
      success: true,
      message: 'Reschedule request submitted successfully',
      data: appointment
    });
  } catch (err) {
    console.error('Error rescheduling appointment:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit reschedule request.' });
  }
};

// @desc    Cancel Patient Appointment Request
// @route   PATCH /api/patient/appointments/:id/cancel
// @access  Private/Patient
export const cancelPatientAppointment = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    const appointment = await Appointment.findOne({ _id: req.params.id, patientId: patient._id });
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found.' });
    }

    appointment.status = 'Cancelled';
    await appointment.save();

    return res.status(200).json({
      success: true,
      message: 'Appointment request cancelled successfully',
      data: appointment
    });
  } catch (err) {
    console.error('Error cancelling appointment:', err);
    return res.status(500).json({ success: false, message: 'Failed to cancel appointment request.' });
  }
};
