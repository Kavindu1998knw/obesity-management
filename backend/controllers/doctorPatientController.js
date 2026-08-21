import mongoose from 'mongoose';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import Assessment from '../models/Assessment.js';
import MealPlan from '../models/MealPlan.js';
import ProgressRecord from '../models/ProgressRecord.js';
import DoctorNote from '../models/DoctorNote.js';
import Appointment from '../models/Appointment.js';

// ==========================================
// ==========================================
// AGE CALCULATION HELPER
// ==========================================
function calculateAge(dob) {
  if (!dob) return 'N/A';
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return 'N/A';
  
  const now = new Date();
  // Future DOB
  if (birthDate > now) return 'N/A';

  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }
  return age < 0 ? 'N/A' : age;
}

// ==========================================
// HEALTH DETAILS ALLOWLIST & VALIDATION
// ==========================================
const HEALTH_DETAIL_ENUMS = {
  familyHistoryOverweight: ['yes', 'no', ''],
  highCalorieFoodConsumption: ['yes', 'no', ''],
  foodBetweenMeals: ['no', 'Sometimes', 'Frequently', 'Always', ''],
  calorieMonitoring: ['yes', 'no', ''],
  smokingStatus: ['yes', 'no', ''],
  alcoholConsumption: ['no', 'Sometimes', 'Frequently', 'Always', ''],
  transportationMethod: ['Automobile', 'Motorbike', 'Bike', 'Public_Transportation', 'Walking', ''],
  dietaryPreference: ['None', 'No Special Preference', 'Vegetarian', 'Vegan', '']
};

const HEALTH_DETAIL_NUMERIC_RANGES = {
  vegetableConsumption: { min: 1, max: 3 },
  mainMealsPerDay: { min: 1, max: 4 },
  waterConsumption: { min: 1, max: 3 },
  physicalActivity: { min: 0, max: 3 },
  technologyUsage: { min: 0, max: 24 }
};

const HEALTH_DETAIL_ARRAYS = ['foodAllergies', 'medicalConditions', 'dislikedFoods'];
const MAX_ARRAY_LENGTH = 20;
const MAX_ARRAY_ITEM_LENGTH = 100;

function validateAndSanitizeHealthDetails(body) {
  const sanitized = {};
  const errors = [];

  // Enum fields
  for (const [field, allowedValues] of Object.entries(HEALTH_DETAIL_ENUMS)) {
    if (body[field] !== undefined) {
      const val = typeof body[field] === 'string' ? body[field].trim() : body[field];
      if (!allowedValues.includes(val)) {
        errors.push(`Invalid value for ${field}`);
      } else {
        sanitized[field] = val;
      }
    }
  }

  // Numeric fields
  for (const [field, range] of Object.entries(HEALTH_DETAIL_NUMERIC_RANGES)) {
    if (body[field] !== undefined && body[field] !== '' && body[field] !== null) {
      const val = parseFloat(body[field]);
      if (isNaN(val) || val < range.min || val > range.max) {
        errors.push(`${field} must be between ${range.min} and ${range.max}`);
      } else {
        sanitized[field] = val;
      }
    }
  }

  // Array fields
  for (const field of HEALTH_DETAIL_ARRAYS) {
    if (body[field] !== undefined) {
      if (!Array.isArray(body[field])) {
        errors.push(`${field} must be an array`);
        continue;
      }
      if (body[field].length > MAX_ARRAY_LENGTH) {
        errors.push(`${field} cannot have more than ${MAX_ARRAY_LENGTH} items`);
        continue;
      }
      // Trim, deduplicate, validate length
      const seen = new Set();
      const cleaned = [];
      for (const item of body[field]) {
        const trimmed = typeof item === 'string' ? item.trim() : String(item);
        if (trimmed.length > MAX_ARRAY_ITEM_LENGTH) {
          errors.push(`${field} item "${trimmed.substring(0, 20)}..." exceeds ${MAX_ARRAY_ITEM_LENGTH} characters`);
          continue;
        }
        if (trimmed && !seen.has(trimmed.toLowerCase())) {
          seen.add(trimmed.toLowerCase());
          cleaned.push(trimmed);
        }
      }
      // "None" normalization: if "None" is in the array with other values, keep only "None"
      if (cleaned.some(v => v.toLowerCase() === 'none') && cleaned.length > 1) {
        sanitized[field] = ['None'];
      } else {
        sanitized[field] = cleaned;
      }
    }
  }

  return { sanitized, errors };
}

// ==========================================
// PATIENT LIST
// ==========================================

// GET /api/doctor/patients
// Get list of patients assigned to the logged-in doctor
export const getMyPatients = async (req, res) => {
  try {
    const doctorId = req.user._id;

    // Find all patients assigned to this doctor, populate User
    const patients = await Patient.find({ assignedDoctor: doctorId })
      .populate('userId', 'fullName email status');

    // Batch fetch latest assessments for all patient user IDs
    const patientUserIds = [];
    const validPatients = [];
    for (const patient of patients) {
      // Skip orphan profiles whose User no longer exists
      if (!patient.userId) continue;
      patientUserIds.push(patient.userId._id);
      validPatients.push(patient);
    }

    // Batch query: latest assessment per patient
    const latestAssessments = await Assessment.aggregate([
      { $match: { patientId: { $in: patientUserIds } } },
      { $sort: { createdAt: -1 } },
      { $group: {
        _id: '$patientId',
        obesityClass: { $first: '$obesityClass' },
        createdAt: { $first: '$createdAt' }
      }}
    ]);

    const assessmentMap = {};
    for (const a of latestAssessments) {
      assessmentMap[a._id.toString()] = a;
    }

    const patientData = validPatients.map(patient => {
      const userId = patient.userId._id.toString();
      const latestAssessment = assessmentMap[userId];

      return {
        _id: patient.userId._id,
        patientProfileId: patient._id,
        name: patient.userId.fullName,
        email: patient.userId.email,
        accountStatus: patient.userId.status,
        age: calculateAge(patient.dob),
        gender: patient.gender || 'N/A',
        currentBmi: patient.currentBmi || 'Not Available',
        latestObesityLevel: latestAssessment ? latestAssessment.obesityClass : 'Not Assessed',
        lastAssessmentDate: latestAssessment ? latestAssessment.createdAt : null,
        assignedDoctorAt: patient.assignedDoctorAt || null
      };
    });

    res.status(200).json({
      success: true,
      data: patientData
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ==========================================
// PATIENT DETAIL
// ==========================================

// GET /api/doctor/patients/:id
// Get comprehensive details of a single patient (must be assigned to this doctor)
export const getPatientDetails = async (req, res) => {
  try {
    const patientUserId = req.params.id;
    const doctorId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(patientUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid patient ID.' });
    }

    const patient = await Patient.findOne({
      $or: [{ userId: patientUserId }, { _id: patientUserId }]
    })
      .populate('userId', 'fullName email status')
      .populate('assignedDoctor', 'fullName');

    if (!patient || !patient.userId) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    const actualPatientUserId = patient.userId._id;

    // Check authorization: assigned directly OR has an approved/completed appointment
    const isAssigned = patient.assignedDoctor && patient.assignedDoctor._id.toString() === doctorId.toString();
    const hasAppointment = await Appointment.exists({
      patientId: actualPatientUserId,
      doctorId: doctorId,
      status: { $in: ['approved', 'completed'] }
    });

    if (!isAssigned && !hasAppointment) {
      return res.status(403).json({ success: false, message: 'Patient not assigned to you or no approved appointment exists.' });
    }

    // Next Appointment – Get approved appointments today or later
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayMidnight = new Date(Date.UTC(
      parseInt(todayStr.substring(0, 4), 10),
      parseInt(todayStr.substring(5, 7), 10) - 1,
      parseInt(todayStr.substring(8, 10), 10)
    ));

    const upcomingAppointments = await Appointment.find({
      patientId: patientUserId,
      doctorId: doctorId,
      status: 'approved',
      date: { $gte: todayMidnight }
    }).sort({ date: 1, time: 1 });

    const nextAppointment = upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;

    // Assessments – all historical for clinical continuity
    const assessments = await Assessment.find({ patientId: patientUserId })
      .populate('doctorId', 'fullName')
      .sort({ createdAt: -1 });

    // Meal Plans – Approved from any doctor, Draft only from this doctor
    const mealPlans = await MealPlan.find({
      patientId: patientUserId,
      $or: [
        { status: 'Approved' },
        { status: 'Draft', doctorId: doctorId }
      ]
    }).sort({ createdAt: -1 });

    // Progress Records
    const progressRecords = await ProgressRecord.find({ patientId: patientUserId })
      .sort({ date: -1 });

    // Doctor Notes – all for clinical continuity (with author name)
    const notes = await DoctorNote.find({ patientId: patientUserId })
      .populate('doctorId', 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        profile: {
          id: patient.userId._id,
          fullName: patient.userId.fullName,
          email: patient.userId.email,
          accountStatus: patient.userId.status,
          phoneNumber: patient.phoneNumber,
          assignedDoctorName: patient.assignedDoctor ? patient.assignedDoctor.fullName : 'N/A',
          dob: patient.dob,
          age: calculateAge(patient.dob),
          gender: patient.gender,
          height: patient.height,
          weight: patient.weight,
          currentBmi: patient.currentBmi,
          latestObesityClassification: assessments.length > 0 ? assessments[0].obesityClass : 'Not Assessed',
          nextAppointmentDate: nextAppointment ? nextAppointment.date : null,
          nextAppointmentTime: nextAppointment ? nextAppointment.time : null
        },
        healthDetails: patient.healthDetails || {},
        assessments,
        mealPlans,
        progressRecords,
        notes
      }
    });
  } catch (error) {
    console.error('Error fetching patient details:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ==========================================
// HEALTH DETAILS UPDATE
// ==========================================

// PUT /api/doctor/patients/:id/health-details
// Update ONLY the healthDetails of a patient using explicit allowlist
export const updateHealthDetails = async (req, res) => {
  try {
    const patientUserId = req.params.id;
    const doctorId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(patientUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid patient ID.' });
    }

    const patient = await Patient.findOne({
      $or: [{ userId: patientUserId }, { _id: patientUserId }]
    });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    const actualPatientUserId = patient.userId;
    const isAssigned = patient.assignedDoctor && patient.assignedDoctor.toString() === doctorId.toString();
    const hasAppointment = await Appointment.exists({
      patientId: actualPatientUserId,
      doctorId: doctorId,
      status: { $in: ['approved', 'completed'] }
    });

    if (!isAssigned && !hasAppointment) {
      return res.status(403).json({ success: false, message: 'Patient not assigned to you or no approved appointment exists.' });
    }

    const { sanitized, errors } = validateAndSanitizeHealthDetails(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join('; ') });
    }

    // Apply only allowlisted fields
    if (!patient.healthDetails) {
      patient.healthDetails = {};
    }
    for (const [key, value] of Object.entries(sanitized)) {
      patient.healthDetails[key] = value;
    }
    patient.markModified('healthDetails');
    
    await patient.save();

    res.status(200).json({
      success: true,
      message: 'Health details updated successfully.',
      data: patient.healthDetails
    });
  } catch (error) {
    console.error('Error updating health details:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ==========================================
// DOCTOR NOTES
// ==========================================

// POST /api/doctor/patients/:id/notes
// Add a new doctor note
export const addPatientNote = async (req, res) => {
  try {
    const patientUserId = req.params.id;
    const doctorId = req.user._id;
    const { note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(patientUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid patient ID.' });
    }

    if (!note || note.trim() === '') {
      return res.status(400).json({ success: false, message: 'Note content is required.' });
    }

    if (note.trim().length > 5000) {
      return res.status(400).json({ success: false, message: 'Note cannot exceed 5000 characters.' });
    }

    const patient = await Patient.findOne({
      $or: [{ userId: patientUserId }, { _id: patientUserId }]
    });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    const actualPatientUserId = patient.userId;
    const isAssigned = patient.assignedDoctor && patient.assignedDoctor.toString() === doctorId.toString();
    const hasAppointment = await Appointment.exists({
      patientId: actualPatientUserId,
      doctorId: doctorId,
      status: { $in: ['approved', 'completed'] }
    });

    if (!isAssigned && !hasAppointment) {
      return res.status(403).json({ success: false, message: 'Patient not assigned to you or no approved appointment exists.' });
    }

    const newNote = new DoctorNote({
      patientId: actualPatientUserId,
      doctorId: doctorId,
      note: note.trim()
    });

    await newNote.save();
    
    const populatedNote = await DoctorNote.findById(newNote._id).populate('doctorId', 'fullName');

    res.status(201).json({
      success: true,
      message: 'Note added successfully.',
      data: populatedNote
    });
  } catch (error) {
    console.error('Error adding patient note:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// PUT /api/doctor/patients/:id/notes/:noteId
// Update an existing doctor note
export const updatePatientNote = async (req, res) => {
  try {
    const { id: patientUserId, noteId } = req.params;
    const doctorId = req.user._id;
    const { note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(patientUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid patient ID.' });
    }
    if (!mongoose.Types.ObjectId.isValid(noteId)) {
      return res.status(400).json({ success: false, message: 'Invalid note ID.' });
    }

    if (!note || note.trim() === '') {
      return res.status(400).json({ success: false, message: 'Note content is required.' });
    }

    if (note.trim().length > 5000) {
      return res.status(400).json({ success: false, message: 'Note cannot exceed 5000 characters.' });
    }

    // Verify patient is assigned or has appointment
    const patient = await Patient.findOne({
      $or: [{ userId: patientUserId }, { _id: patientUserId }]
    });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    const actualPatientUserId = patient.userId;
    const isAssigned = patient.assignedDoctor && patient.assignedDoctor.toString() === doctorId.toString();
    const hasAppointment = await Appointment.exists({
      patientId: actualPatientUserId,
      doctorId: doctorId,
      status: { $in: ['approved', 'completed'] }
    });

    if (!isAssigned && !hasAppointment) {
      return res.status(403).json({ success: false, message: 'Patient is not currently assigned to you or no appointment exists.' });
    }

    // Verify ownership of the note
    const existingNote = await DoctorNote.findById(noteId);
    if (!existingNote) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    if (existingNote.doctorId.toString() !== doctorId.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You can only edit your own notes.' });
    }
    
    // Also verify note belongs to the specified patient
    if (existingNote.patientId.toString() !== actualPatientUserId.toString()) {
      return res.status(400).json({ success: false, message: 'Note does not belong to the specified patient.' });
    }

    existingNote.note = note.trim();
    await existingNote.save();
    
    const populatedNote = await DoctorNote.findById(existingNote._id).populate('doctorId', 'fullName');

    res.status(200).json({
      success: true,
      message: 'Note updated successfully.',
      data: populatedNote
    });
  } catch (error) {
    console.error('Error updating patient note:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
