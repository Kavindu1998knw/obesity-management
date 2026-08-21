import mongoose from 'mongoose';
import crypto from 'crypto';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Assessment from '../models/Assessment.js';
import MealPlan from '../models/MealPlan.js';
import DoctorNote from '../models/DoctorNote.js';
import ProgressRecord from '../models/ProgressRecord.js';
import bcrypt from 'bcryptjs';
import { sendDoctorWelcomeEmail } from '../services/emailService.js';

// @desc    Get all doctors
// @route   GET /api/admin/doctors
// @access  Private/Admin
export const getDoctors = async (req, res) => {
  try {
    const { search, status, specialisation } = req.query;
    
    const matchQuery = { role: 'doctor' };
    
    if (status && ['active', 'inactive'].includes(status.toLowerCase())) {
      matchQuery.status = status.toLowerCase();
    }
    
    if (search) {
      matchQuery.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const pipeline = [
      { $match: matchQuery },
      { 
        $lookup: {
          from: 'doctors',
          localField: '_id',
          foreignField: 'userId',
          as: 'profile'
        }
      },
      { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } }
    ];

    if (specialisation) {
      pipeline.push({
        $match: { 'profile.specialisation': { $regex: new RegExp(`^${specialisation}$`, 'i') } }
      });
    }

    pipeline.push(
      {
        $lookup: {
          from: 'patients',
          localField: '_id',
          foreignField: 'assignedDoctor',
          as: 'assignedPatients'
        }
      },
      {
        $lookup: {
          from: 'appointments',
          localField: '_id',
          foreignField: 'doctorId',
          as: 'allAppointments'
        }
      },
      {
        $addFields: {
          assignedPatientsCount: { $size: '$assignedPatients' },
          upcomingAppointments: {
            $size: {
              $filter: {
                input: '$allAppointments',
                as: 'appt',
                cond: { $in: ['$$appt.status', ['pending', 'approved']] }
              }
            }
          },
          completedAppointments: {
            $size: {
              $filter: {
                input: '$allAppointments',
                as: 'appt',
                cond: { $eq: ['$$appt.status', 'completed'] }
              }
            }
          }
        }
      },
      { $sort: { createdAt: -1 } },
      { $project: { password: 0, assignedPatients: 0, allAppointments: 0 } }
    );

    const doctors = await User.aggregate(pipeline);
    res.status(200).json({ success: true, count: doctors.length, data: doctors });
  } catch (error) {
    console.error('Get Doctors Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create a new doctor
// @route   POST /api/admin/doctors
// @access  Private/Admin
export const createDoctor = async (req, res) => {
  try {
    let { fullName, email, password, phoneNumber, specialisation, qualification, status } = req.body;

    fullName = fullName?.trim();
    email = email?.trim().toLowerCase();
    
    if (!fullName || !email || !password || !specialisation || !qualification || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields (Name, Email, Phone, Specialisation, Qualification, Password)' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
    }

    const phoneRegex = /^(?:\+94|0)\d{9}$|^\+?[1-9]\d{7,14}$/;
    if (phoneNumber && !phoneRegex.test(phoneNumber.replace(/\s+/g, ''))) {
      return res.status(400).json({ success: false, message: 'Invalid phone number format' });
    }

    status = status?.toLowerCase() === 'inactive' ? 'inactive' : 'active';

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ success: false, message: 'User with this email already exists' });
    }

    let doctorUser = null;
    try {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 48 * 3600 * 1000); // 48 hours validity

      doctorUser = await User.create({
        fullName,
        email,
        password, // User pre-save hook handles hashing
        role: 'doctor', // Backend hard-codes the role
        status,
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      });

      const doctorProfile = await Doctor.create({
        userId: doctorUser._id,
        phoneNumber,
        specialisation,
        qualification
      });

      // Dispatch welcome email with credentials & password setup link
      sendDoctorWelcomeEmail({
        fullName,
        email,
        password, // Plain-text password provided by admin before hashing
        specialisation,
        qualification,
        resetToken,
      }).catch(mailErr => console.warn('Non-blocking welcome email error:', mailErr));

      res.status(201).json({
        success: true,
        message: 'Doctor account created and login credentials dispatched to doctor email.',
        data: {
          _id: doctorUser._id,
          fullName: doctorUser.fullName,
          email: doctorUser.email,
          role: doctorUser.role,
          status: doctorUser.status,
          createdAt: doctorUser.createdAt,
          profile: doctorProfile
        }
      });
    } catch (dbError) {
      // Safe rollback if profile creation fails
      if (doctorUser && doctorUser._id) {
        await User.findByIdAndDelete(doctorUser._id);
      }
      throw dbError; // Rethrow to outer catch
    }
  } catch (error) {
    console.error('Create Doctor Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get specific doctor details
// @route   GET /api/admin/doctors/:id
// @access  Private/Admin
export const getDoctorDetails = async (req, res) => {
  try {
    const doctorUser = await User.findById(req.params.id).select('-password');
    if (!doctorUser || doctorUser.role !== 'doctor') {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const profile = await Doctor.findOne({ userId: req.params.id });

    const assignedPatientsCount = await Patient.countDocuments({ assignedDoctor: req.params.id });
    
    const upcomingAppointmentsCount = await Appointment.countDocuments({ 
      doctorId: req.params.id, 
      status: { $in: ['pending', 'approved'] } 
    });
    
    const completedAppointmentsCount = await Appointment.countDocuments({ 
      doctorId: req.params.id, 
      status: 'completed' 
    });

    res.status(200).json({
      success: true,
      data: {
        _id: doctorUser._id,
        fullName: doctorUser.fullName,
        email: doctorUser.email,
        status: doctorUser.status,
        createdAt: doctorUser.createdAt,
        role: doctorUser.role,
        profile: profile || {},
        summary: {
          assignedPatientsCount,
          upcomingAppointmentsCount,
          completedAppointmentsCount
        }
      }
    });
  } catch (error) {
    console.error('Get Doctor Details Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update a doctor
// @route   PUT /api/admin/doctors/:id
// @access  Private/Admin
export const updateDoctor = async (req, res) => {
  try {
    let { fullName, email, password, phoneNumber, specialisation, qualification, status } = req.body;
    
    const doctorUser = await User.findById(req.params.id);

    if (!doctorUser || doctorUser.role !== 'doctor') {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    if (email) {
      email = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email format' });
      }
      if (email !== doctorUser.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          return res.status(409).json({ success: false, message: 'Email is already in use by another account' });
        }
        doctorUser.email = email;
      }
    }

    if (phoneNumber) {
      const phoneRegex = /^(?:\+94|0)\d{9}$|^\+?[1-9]\d{7,14}$/;
      if (!phoneRegex.test(phoneNumber.replace(/\s+/g, ''))) {
        return res.status(400).json({ success: false, message: 'Invalid phone number format' });
      }
    }

    if (fullName && fullName.trim()) doctorUser.fullName = fullName.trim();
    
    if (status && ['active', 'inactive'].includes(status.toLowerCase())) {
      doctorUser.status = status.toLowerCase();
    }
    
    // Let the existing User pre-save hook hash the password
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long' });
      }
      doctorUser.password = password; 
    }

    const updatedDoctorUser = await doctorUser.save();

    // Update Doctor profile
    let profile = await Doctor.findOne({ userId: req.params.id });
    if (!profile) {
      profile = new Doctor({ userId: req.params.id });
    }
    
    if (phoneNumber !== undefined) profile.phoneNumber = phoneNumber;
    if (specialisation !== undefined) profile.specialisation = specialisation;
    if (qualification !== undefined) profile.qualification = qualification;
    
    await profile.save();

    res.status(200).json({
      success: true,
      data: {
        _id: updatedDoctorUser._id,
        fullName: updatedDoctorUser.fullName,
        email: updatedDoctorUser.email,
        role: updatedDoctorUser.role,
        status: updatedDoctorUser.status,
        profile
      }
    });
  } catch (error) {
    console.error('Update Doctor Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Toggle doctor status (Deactivate/Activate)
// @route   PATCH /api/admin/doctors/:id/status
// @access  Private/Admin
export const toggleDoctorStatus = async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id);

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    doctor.status = doctor.status === 'active' ? 'inactive' : 'active';
    await doctor.save();

    res.status(200).json({
      success: true,
      message: `Doctor successfully ${doctor.status}d`,
      data: {
        _id: doctor._id,
        status: doctor.status
      }
    });
  } catch (error) {
    console.error('Toggle Doctor Status Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete a doctor permanently (Hard delete)
// @route   DELETE /api/admin/doctors/:id
// @access  Private/Admin
export const deleteDoctor = async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id);

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // 1. Safe delete policy checks
    const assignedPatientsCount = await Patient.countDocuments({ assignedDoctor: req.params.id });
    const appointmentsCount = await Appointment.countDocuments({ doctorId: req.params.id });
    const assessmentsCount = await Assessment.countDocuments({ doctorId: req.params.id });
    const mealPlansCount = await MealPlan.countDocuments({ doctorId: req.params.id });
    const notesCount = await DoctorNote.countDocuments({ doctorId: req.params.id });

    if (assignedPatientsCount > 0 || appointmentsCount > 0 || assessmentsCount > 0 || mealPlansCount > 0 || notesCount > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Cannot delete doctor: Active records exist (Patients, Appointments, Assessments, or Meal Plans). Please deactivate the doctor instead.' 
      });
    }

    // 2. Perform safe deletion
    await Doctor.findOneAndDelete({ userId: req.params.id });
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Doctor completely deleted from the system'
    });
  } catch (error) {
    console.error('Delete Doctor Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ==========================================
// PATIENT MANAGEMENT
// ==========================================

// @desc    Get all patients
// @route   GET /api/admin/patients
// @access  Private/Admin
export const getPatients = async (req, res) => {
  try {
    const { search, status, doctorId } = req.query;
    
    const matchQuery = { role: 'patient' };
    
    if (status) {
      if (['active', 'inactive'].includes(status.toLowerCase())) {
        matchQuery.status = status.toLowerCase();
      } else {
        return res.status(400).json({ success: false, message: 'Invalid status value' });
      }
    }
    
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      matchQuery.$or = [
        { fullName: { $regex: escapedSearch, $options: 'i' } },
        { email: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    const pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: 'patients',
          localField: '_id',
          foreignField: 'userId',
          as: 'profile'
        }
      },
      { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'profile.assignedDoctor',
          foreignField: '_id',
          as: 'assignedDoctorDetails'
        }
      },
      { $unwind: { path: '$assignedDoctorDetails', preserveNullAndEmptyArrays: true } }
    ];

    if (doctorId && doctorId !== 'all') {
      if (doctorId === 'unassigned') {
         pipeline.push({ $match: { $or: [{ 'profile.assignedDoctor': { $exists: false } }, { 'profile.assignedDoctor': null }] } });
      } else {
         if (!mongoose.Types.ObjectId.isValid(doctorId)) {
           return res.status(400).json({ success: false, message: 'Invalid doctor ID' });
         }
         pipeline.push({ $match: { 'profile.assignedDoctor': new mongoose.Types.ObjectId(doctorId) } });
      }
    }

    pipeline.push(
      {
        $project: {
          password: 0
        }
      },
      { $sort: { createdAt: -1 } }
    );

    let patients = await User.aggregate(pipeline);
    
    // Map to calculate age accurately
    patients = patients.map(p => {
       let age = 'N/A';
       if (p.profile && p.profile.dob) {
         const dob = new Date(p.profile.dob);
         if (!isNaN(dob.getTime()) && dob <= new Date()) {
           const today = new Date();
           let calcAge = today.getFullYear() - dob.getFullYear();
           const m = today.getMonth() - dob.getMonth();
           if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
             calcAge--;
           }
           age = calcAge;
         }
       }
       return {
         _id: p._id,
         fullName: p.fullName,
         email: p.email,
         status: p.status,
         createdAt: p.createdAt,
         profile: {
           phoneNumber: p.profile?.phoneNumber,
           dob: p.profile?.dob,
           gender: p.profile?.gender,
           currentBmi: p.profile?.currentBmi,
           height: p.profile?.height,
           weight: p.profile?.weight
         },
         age: age,
         assignedDoctor: p.assignedDoctorDetails ? {
            _id: p.assignedDoctorDetails._id,
            fullName: p.assignedDoctorDetails.fullName
         } : null
       };
    });

    res.status(200).json({ success: true, count: patients.length, data: patients });
  } catch (error) {
    console.error('Get Patients Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
// @desc    Get complete patient details for View Modal
// @route   GET /api/admin/patients/:id
// @access  Private/Admin
export const getPatientDetails = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid patient ID' });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user || user.role !== 'patient') {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const profile = await Patient.findOne({ userId: req.params.id }).populate('assignedDoctor', 'fullName email status');
    const appointments = await Appointment.find({ patientId: req.params.id }).sort({ date: -1, time: -1 }).populate('doctorId', 'fullName');
    const assessments = await Assessment.find({ patientId: req.params.id }).sort({ createdAt: -1 }).populate('doctorId', 'fullName');
    const mealPlan = await MealPlan.findOne({ patientId: req.params.id, status: 'Approved' }).sort({ createdAt: -1 });
    const progressRecords = await ProgressRecord.find({ patientId: req.params.id }).sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: {
        user,
        profile,
        appointments,
        assessments,
        mealPlan: mealPlan || null,
        progressRecords
      }
    });
  } catch (error) {
    console.error('Get Patient Details Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// General update patient route removed as per requirements
// Edit patient action is not allowed for Admin.

// @desc    Toggle patient status
// @route   PATCH /api/admin/patients/:id/status
// @access  Private/Admin
export const togglePatientStatus = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid patient ID' });
    }
    
    const patient = await User.findById(req.params.id);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    patient.status = patient.status === 'active' ? 'inactive' : 'active';
    await patient.save();

    res.status(200).json({ success: true, message: `Patient successfully ${patient.status}d` });
  } catch (error) {
    console.error('Toggle Patient Status Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Assign Doctor to Patient
// @route   PATCH /api/admin/patients/:id/assign-doctor
// @access  Private/Admin
export const assignDoctorToPatient = async (req, res) => {
  try {
    const { doctorId } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid patient ID' });
    }
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ success: false, message: 'Invalid doctor ID' });
    }

    const patientUser = await User.findById(req.params.id);
    if (!patientUser || patientUser.role !== 'patient') {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    
    let profile = await Patient.findOne({ userId: req.params.id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Patient profile not found' });
    }

    const doctorUser = await User.findById(doctorId);
    if (!doctorUser || doctorUser.role !== 'doctor') {
      return res.status(404).json({ success: false, message: 'Selected doctor not found' });
    }
    
    if (doctorUser.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Cannot assign to an inactive doctor' });
    }

    const doctorProfile = await Doctor.findOne({ userId: doctorId });
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }
    
    if (profile.assignedDoctor && profile.assignedDoctor.toString() === doctorId) {
      return res.status(200).json({ success: true, message: 'Doctor is already assigned to this patient' });
    }

    profile.assignedDoctor = doctorId;
    profile.assignedDoctorAt = new Date();
    await profile.save();

    res.status(200).json({ success: true, message: 'Doctor assigned successfully', data: profile });
  } catch (error) {
    console.error('Assign Doctor Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete a patient permanently
// @route   DELETE /api/admin/patients/:id
// @access  Private/Admin
export const deletePatient = async (req, res) => {
  let session;
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid patient ID' });
    }

    const patient = await User.findById(req.params.id);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const appointmentsCount = await Appointment.countDocuments({ patientId: req.params.id });
    const assessmentsCount = await Assessment.countDocuments({ patientId: req.params.id });
    const mealPlansCount = await MealPlan.countDocuments({ patientId: req.params.id });
    const notesCount = await DoctorNote.countDocuments({ patientId: req.params.id });
    const progressCount = await ProgressRecord.countDocuments({ patientId: req.params.id });

    if (appointmentsCount > 0 || assessmentsCount > 0 || mealPlansCount > 0 || notesCount > 0 || progressCount > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Cannot delete patient: Clinical records or appointments exist. Please deactivate the patient instead.' 
      });
    }

    session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await Patient.findOneAndDelete(
          { userId: req.params.id },
          { session }
        );

        await User.findOneAndDelete(
          { _id: req.params.id, role: 'patient' },
          { session }
        );
      });
    } catch (transactionError) {
      console.error('Transaction Failed:', transactionError);
      const isTopologyError = transactionError.message && (transactionError.message.toLowerCase().includes('replica set') || transactionError.message.toLowerCase().includes('transaction'));
      const statusCode = isTopologyError ? 503 : 500;
      return res.status(statusCode).json({ 
        success: false, 
        message: 'Patient deletion could not be completed safely. No records were deleted.' 
      });
    } finally {
      await session.endSession();
    }

    res.status(200).json({ success: true, message: 'Patient completely deleted' });
  } catch (error) {
    console.error('Delete Patient Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
// ==========================================
// APPOINTMENT MANAGEMENT HELPERS
// ==========================================

const TERMINAL_STATUSES = ['rejected', 'completed', 'cancelled'];

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



/**
 * Validate a doctor: exists, role=doctor, active, has Doctor profile.
 * Returns { valid, error, statusCode } or { valid: true, doctorUser, doctorProfile }.
 */
async function validateActiveDoctor(doctorId) {
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    return { valid: false, statusCode: 400, error: 'Invalid doctor ID' };
  }
  const doctorUser = await User.findById(doctorId);
  if (!doctorUser || doctorUser.role !== 'doctor') {
    return { valid: false, statusCode: 404, error: 'Doctor not found' };
  }
  if (doctorUser.status !== 'active') {
    return { valid: false, statusCode: 400, error: 'Cannot use an inactive doctor' };
  }
  const doctorProfile = await Doctor.findOne({ userId: doctorId });
  if (!doctorProfile) {
    return { valid: false, statusCode: 404, error: 'Doctor profile not found' };
  }
  return { valid: true, doctorUser, doctorProfile };
}

// ==========================================
// APPOINTMENT MANAGEMENT
// ==========================================

// @desc    Get all appointments
// @route   GET /api/admin/appointments
// @access  Private/Admin
export const getAppointments = async (req, res) => {
  try {
    const { search, status, doctorId, fromDate, toDate } = req.query;

    const query = {};

    if (status) {
      if (!['pending', 'approved', 'rejected', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status filter' });
      }
      query.status = status;
    }

    if (doctorId) {
      if (!mongoose.Types.ObjectId.isValid(doctorId)) {
        return res.status(400).json({ success: false, message: 'Invalid doctor ID filter' });
      }
      query.doctorId = doctorId;
    }

    if (fromDate || toDate) {
      query.date = {};
      if (fromDate && isValidDateStr(fromDate)) {
        query.date.$gte = getNormalizedMidnight(fromDate);
      }
      if (toDate && isValidDateStr(toDate)) {
        query.date.$lte = getNormalizedMidnight(toDate);
      }
    }

    let appointments = await Appointment.find(query)
      .populate('patientId', 'fullName email')
      .populate('doctorId', 'fullName email')
      .sort({ date: -1, time: 1 });

    // Apply search filter on populated fields (client-safe regex)
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(escapedSearch, 'i');
      appointments = appointments.filter(a =>
        (a.patientId?.fullName && re.test(a.patientId.fullName)) ||
        (a.doctorId?.fullName && re.test(a.doctorId.fullName)) ||
        re.test(a._id.toString())
      );
    }

    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    console.error('Get Appointments Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update appointment status (approve, reject, cancel)
// @route   PATCH /api/admin/appointments/:id/status
// @access  Private/Admin
export const updateAppointmentStatus = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID' });
    }

    const { status, rejectionReason, cancellationReason, adminNote } = req.body;

    // Admin cannot set completed
    if (status === 'completed') {
      return res.status(403).json({ success: false, message: 'Only the assigned doctor can mark an appointment as completed.' });
    }

    if (!['approved', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Admin can set: approved, rejected, cancelled.' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // State-transition validation
    if (TERMINAL_STATUSES.includes(appointment.status)) {
      return res.status(400).json({ success: false, message: `Cannot change status of a ${appointment.status} appointment.` });
    }

    // Allowed transitions
    const allowed = {
      pending: ['approved', 'rejected', 'cancelled'],
      approved: ['cancelled']
    };

    if (!allowed[appointment.status]?.includes(status)) {
      return res.status(400).json({ success: false, message: `Cannot transition from '${appointment.status}' to '${status}'.` });
    }

    // Rejection requires reason
    if (status === 'rejected') {
      if (!rejectionReason || !rejectionReason.trim()) {
        return res.status(400).json({ success: false, message: 'Rejection reason is required' });
      }
    }

    // Cancellation requires reason
    if (status === 'cancelled') {
      if (!cancellationReason || !cancellationReason.trim()) {
        return res.status(400).json({ success: false, message: 'Cancellation reason is required' });
      }
    }

    // Approval validations
    if (status === 'approved') {
      // Validate doctor
      const docResult = await validateActiveDoctor(appointment.doctorId);
      if (!docResult.valid) {
        return res.status(docResult.statusCode).json({ success: false, message: docResult.error });
      }

      // Validate future date/time
      if (!isValidTimeFormat(appointment.time)) {
        return res.status(400).json({ success: false, message: 'Invalid appointment time' });
      }
      const dateStr = appointment.date.toISOString().split('T')[0];
      if (!isValidDateStr(dateStr)) {
        return res.status(400).json({ success: false, message: 'Invalid appointment date' });
      }
      const today = new Date().toISOString().slice(0, 10);
      if (dateStr < today) {
        return res.status(400).json({ success: false, message: 'Past appointment dates are not allowed.' });
      }

      // Doctor double-booking check
      const doctorConflict = await Appointment.findOne({
        _id: { $ne: appointment._id },
        doctorId: appointment.doctorId,
        date: appointment.date,
        time: appointment.time,
        status: 'approved'
      });
      if (doctorConflict) {
        return res.status(409).json({ success: false, message: 'Doctor already has an approved appointment at this date and time.' });
      }

      // Patient slot conflict check
      const patientConflict = await Appointment.findOne({
        _id: { $ne: appointment._id },
        patientId: appointment.patientId,
        date: appointment.date,
        time: appointment.time,
        status: { $in: ['pending', 'approved'] }
      });
      if (patientConflict) {
        return res.status(409).json({ success: false, message: 'Patient already has a pending or approved appointment at this date and time.' });
      }

      // Clear obsolete rejection/cancellation data
      appointment.rejectionReason = undefined;
      appointment.cancellationReason = undefined;
    }

    appointment.status = status;
    if (status === 'rejected') {
      appointment.rejectionReason = rejectionReason.trim();
    }
    if (status === 'cancelled') {
      appointment.cancellationReason = cancellationReason.trim();
    }
    if (adminNote !== undefined && adminNote !== null) {
      appointment.adminNote = adminNote.trim();
    }

    await appointment.save();

    if (status === 'approved') {
      const patientProfile = await Patient.findOne({ userId: appointment.patientId });
      if (patientProfile && !patientProfile.assignedDoctor) {
        patientProfile.assignedDoctor = appointment.doctorId;
        patientProfile.assignedDoctorAt = new Date();
        await patientProfile.save();
      }
    }

    res.status(200).json({ success: true, message: `Appointment ${status}`, data: appointment });
  } catch (error) {
    console.error('Update Appointment Status Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Reschedule appointment
// @route   PUT /api/admin/appointments/:id/reschedule
// @access  Private/Admin
export const rescheduleAppointment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment ID' });
    }

    const { date, time, doctorId, rescheduleNote } = req.body;

    if (!date || !time || !doctorId) {
      return res.status(400).json({ success: false, message: 'Date, time, and doctor are required' });
    }

    if (!rescheduleNote || !rescheduleNote.trim()) {
      return res.status(400).json({ success: false, message: 'Reschedule note is required' });
    }

    if (!isValidTimeFormat(time)) {
      return res.status(400).json({ success: false, message: 'Invalid time format. Use HH:mm.' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Only pending or approved can be rescheduled
    if (!['pending', 'approved'].includes(appointment.status)) {
      return res.status(400).json({ success: false, message: `Cannot reschedule a ${appointment.status} appointment.` });
    }

    // Validate doctor
    const docResult = await validateActiveDoctor(doctorId);
    if (!docResult.valid) {
      return res.status(docResult.statusCode).json({ success: false, message: docResult.error });
    }

    // Validate future date/time
    if (!isValidDateStr(date)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment date' });
    }
    if (!isValidTimeFormat(time)) {
      return res.status(400).json({ success: false, message: 'Invalid appointment time' });
    }
    const today = new Date().toISOString().slice(0, 10);
    if (date < today) {
      return res.status(400).json({ success: false, message: 'Past appointment dates are not allowed.' });
    }

    // Normalize date to midnight for consistent storage
    const requestedDate = getNormalizedMidnight(date);

    // Doctor double-booking check
    const doctorConflict = await Appointment.findOne({
      _id: { $ne: appointment._id },
      doctorId: doctorId,
      date: requestedDate,
      time: time,
      status: 'approved'
    });
    if (doctorConflict) {
      return res.status(409).json({ success: false, message: 'Doctor already has an approved appointment at this date and time.' });
    }

    // Patient slot conflict check
    const patientConflict = await Appointment.findOne({
      _id: { $ne: appointment._id },
      patientId: appointment.patientId,
      date: requestedDate,
      time: time,
      status: { $in: ['pending', 'approved'] }
    });
    if (patientConflict) {
      return res.status(409).json({ success: false, message: 'Patient already has a pending or approved appointment at this date and time.' });
    }

    appointment.date = requestedDate;
    appointment.time = time;
    appointment.doctorId = doctorId;
    appointment.rescheduleNote = rescheduleNote.trim();
    appointment.status = 'approved';
    // Clear obsolete rejection/cancellation data
    appointment.rejectionReason = undefined;
    appointment.cancellationReason = undefined;

    await appointment.save();

    res.status(200).json({ success: true, message: 'Appointment rescheduled successfully', data: appointment });
  } catch (error) {
    console.error('Reschedule Appointment Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ==========================================
// REPORTS MANAGEMENT
// ==========================================

// @desc    Generate system reports
// @route   POST /api/admin/reports/generate
// @access  Private/Admin
export const generateReport = async (req, res) => {
  try {
    const { reportType, filters } = req.body;
    const { fromDate, toDate, doctorId, status, obesityCategory } = filters || {};

    let dateQuery = {};
    if (fromDate || toDate) {
      dateQuery.createdAt = {};
      if (fromDate) dateQuery.createdAt.$gte = new Date(fromDate);
      if (toDate) {
        let end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        dateQuery.createdAt.$lte = end;
      }
    }

    let reportData = null;

    switch (reportType) {
      case 'patient':
        const patientMatch = { role: 'patient', ...dateQuery };
        if (filters?.patientStatus && filters.patientStatus !== 'all') {
          patientMatch.status = filters.patientStatus;
        }
        reportData = await User.aggregate([
          { $match: patientMatch },
          {
            $lookup: {
              from: 'patients',
              localField: '_id',
              foreignField: 'userId',
              as: 'profile'
            }
          },
          { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
          {
            $project: {
              fullName: 1,
              email: 1,
              status: 1,
              createdAt: 1,
              gender: '$profile.gender',
              currentBmi: '$profile.currentBmi'
            }
          },
          { $sort: { createdAt: -1 } }
        ]);
        break;

      case 'doctor':
        const doctorMatch = { role: 'doctor', ...dateQuery };
        reportData = await User.aggregate([
          { $match: doctorMatch },
          {
            $lookup: {
              from: 'doctors',
              localField: '_id',
              foreignField: 'userId',
              as: 'profile'
            }
          },
          { $unwind: { path: '$profile', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'appointments',
              localField: '_id',
              foreignField: 'doctorId',
              as: 'appointments'
            }
          },
          {
            $project: {
              fullName: 1,
              email: 1,
              status: 1,
              createdAt: 1,
              specialisation: '$profile.specialisation',
              totalAppointments: { $size: '$appointments' }
            }
          },
          { $sort: { createdAt: -1 } }
        ]);
        break;

      case 'appointment':
        const appQuery = { ...dateQuery };
        if (doctorId && doctorId !== 'all') appQuery.doctorId = doctorId;
        if (status && status !== 'all') appQuery.status = status;

        reportData = await Appointment.find(appQuery)
          .populate('patientId', 'fullName')
          .populate('doctorId', 'fullName')
          .sort({ date: -1, time: -1 });
        break;

      case 'obesity_classification':
        const assessmentQuery = { ...dateQuery };
        if (doctorId && doctorId !== 'all') assessmentQuery.doctorId = doctorId;
        if (obesityCategory && obesityCategory !== 'all') assessmentQuery.obesityClass = obesityCategory;

        reportData = await Assessment.find(assessmentQuery)
          .populate('patientId', 'fullName')
          .sort({ createdAt: -1 });
        break;

      case 'patient_progress':
        // Get all assessments sorted by date
        const progQuery = { ...dateQuery };
        const assessments = await Assessment.find(progQuery)
          .populate('patientId', 'fullName')
          .sort({ createdAt: 1 });

        // Group by patient to find first and last BMI
        const patientMap = {};
        assessments.forEach(a => {
          if (!a.patientId) return;
          const pid = a.patientId._id.toString();
          if (!patientMap[pid]) {
            patientMap[pid] = {
              patientName: a.patientId.fullName,
              firstAssessmentDate: a.createdAt,
              firstBmi: a.bmi,
              latestAssessmentDate: a.createdAt,
              latestBmi: a.bmi
            };
          } else {
            patientMap[pid].latestAssessmentDate = a.createdAt;
            patientMap[pid].latestBmi = a.bmi;
          }
        });

        reportData = Object.values(patientMap).map(p => ({
          ...p,
          bmiChange: parseFloat((p.latestBmi - p.firstBmi).toFixed(1))
        }));
        break;

      default:
        return res.status(400).json({ success: false, message: 'Invalid report type' });
    }

    res.status(200).json({ success: true, data: reportData });
  } catch (error) {
    console.error('Generate Report Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
