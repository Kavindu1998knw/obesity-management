import Patient from '../models/Patient.js';
import Assessment from '../models/Assessment.js';
import MealPlan from '../models/MealPlan.js';
import Appointment from '../models/Appointment.js';
import ProgressRecord from '../models/ProgressRecord.js';
import DoctorNote from '../models/DoctorNote.js';
import mongoose from 'mongoose';

// Fetch assigned patients for the dropdown filter
export const getAssignedPatients = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const patients = await Patient.find({ assignedDoctor: doctorId }).populate('userId', 'fullName email');
    res.status(200).json({ success: true, data: patients });
  } catch (error) {
    console.error('Error fetching assigned patients:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const verifyPatientOwnership = async (patientId, doctorId) => {
  const patient = await Patient.findOne({
    $or: [{ userId: patientId }, { _id: patientId }]
  }).populate('userId', 'fullName email');

  if (!patient || !patient.userId) return null;

  const isAssigned = patient.assignedDoctor && patient.assignedDoctor.toString() === doctorId.toString();
  const hasAppointment = await Appointment.exists({
    patientId: patient.userId._id,
    doctorId: doctorId,
    status: { $in: ['approved', 'completed'] }
  });

  if (!isAssigned && !hasAppointment) return null;

  return patient;
};

// Generate Report
export const generateReport = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const doctorName = req.user.fullName;
    const { reportType, patientId, fromDate, toDate, obesityClass, mealPlanStatus, appointmentStatus } = req.query;

    if (!patientId) {
      return res.status(400).json({ success: false, message: 'Patient selection is required.' });
    }

    const patient = await verifyPatientOwnership(patientId, doctorId);
    if (!patient) {
      return res.status(403).json({ success: false, message: 'Unauthorized. Patient not assigned to you.' });
    }

    let dateFilter = {};
    if (fromDate || toDate) {
      dateFilter.createdAt = {};
      if (fromDate) dateFilter.createdAt.$gte = new Date(`${fromDate}T00:00:00.000Z`);
      if (toDate) dateFilter.createdAt.$lte = new Date(`${toDate}T23:59:59.999Z`);
    }

    const patientDetails = {
      patientId: patient.userId._id,
      fullName: patient.userId.fullName,
      email: patient.userId.email,
      phone: patient.phoneNumber || 'Not Available',
      age: patient.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : 'Not Available',
      gender: patient.gender || 'Not Available',
      height: patient.height || 'Not Available',
      weight: patient.weight || 'Not Available',
      bmi: patient.currentBmi || 'Not Available',
      assignedDoctor: doctorName
    };

    let reportData = { patientDetails, generatedDate: new Date(), doctorName, reportType };

    if (reportType === 'Patient Health Report') {
      const assessments = await Assessment.find({ patientId, doctorId, ...dateFilter }).sort({ createdAt: -1 });
      const latestAssessment = assessments[0];
      
      let apptFilter = { patientId, doctorId, ...dateFilter };
      if (appointmentStatus) apptFilter.status = appointmentStatus;
      const appointments = await Appointment.find(apptFilter).sort({ date: -1 });
      
      const notes = await DoctorNote.find({ patientId, doctorId, ...dateFilter }).sort({ createdAt: -1 });

      reportData.healthInfo = {
        latestObesityClass: latestAssessment ? latestAssessment.obesityClass : 'Not Assessed',
        dietaryPreference: patient.healthDetails?.dietaryPreference || 'Not Available',
        allergies: patient.healthDetails?.foodAllergies || [],
        medicalConditions: patient.healthDetails?.medicalConditions || [],
        dislikedFoods: patient.healthDetails?.dislikedFoods || [],
        lastHealthUpdate: latestAssessment ? latestAssessment.createdAt : patient.createdAt
      };
      reportData.assessments = assessments;
      reportData.appointments = appointments;
      reportData.doctorNotes = notes;

    } else if (reportType === 'Obesity Assessment Report') {
      let filter = { patientId, doctorId, ...dateFilter };
      if (obesityClass) filter.obesityClass = obesityClass;
      
      const assessments = await Assessment.find(filter).sort({ createdAt: -1 });
      
      if (assessments.length === 0) {
        return res.status(404).json({ success: false, message: 'No assessments found for the selected filters.' });
      }

      reportData.assessments = assessments.map(a => ({
        assessmentId: a._id,
        date: a.createdAt,
        height: a.height,
        weight: a.weight,
        bmi: a.bmi,
        predictedObesityLevel: a.obesityClass,
        confidence: a.confidenceScore,
        topProbabilities: a.topProbabilities || [],
        doctorNote: a.doctorNote || 'Not Available',
        inputs: a.inputs
      }));

    } else if (reportType === 'Meal Plan Report') {
      let filter = { patientId, doctorId, ...dateFilter };
      if (mealPlanStatus) filter.status = mealPlanStatus;

      const plans = await MealPlan.find(filter).sort({ createdAt: -1 });

      if (plans.length === 0) {
        return res.status(404).json({ success: false, message: 'No meal plans found for the selected filters.' });
      }

      reportData.plans = plans;

    } else if (reportType === 'Patient Progress Report') {
      const assessments = await Assessment.find({ patientId, doctorId, ...dateFilter }).sort({ createdAt: 1 });
      const specificProgress = await ProgressRecord.find({ patientId, ...dateFilter }).sort({ createdAt: 1 });
      const notes = await DoctorNote.find({ patientId, doctorId, ...dateFilter }).sort({ createdAt: 1 });

      // Combine BMI and Weight history from Assessments
      const history = assessments.map(a => ({
        date: a.createdAt,
        weight: a.weight,
        bmi: a.bmi,
        source: 'Assessment'
      }));

      // Add ProgressRecord BMI and weight updates
      specificProgress.forEach(p => {
        history.push({
          date: p.date || p.createdAt,
          weight: p.weight,
          bmi: p.bmi,
          source: 'Progress Record'
        });
      });

      history.sort((a, b) => new Date(a.date) - new Date(b.date));

      const weights = history.filter(h => h.weight !== null);
      const bmis = history;

      const latestWeight = weights.length > 0 ? weights[weights.length - 1].weight : 'Not Available';
      const firstWeight = weights.length > 0 ? weights[0].weight : null;
      const weightChange = latestWeight !== 'Not Available' && firstWeight ? (latestWeight - firstWeight).toFixed(2) : 'Not Available';

      const latestBmi = bmis.length > 0 ? bmis[bmis.length - 1].bmi : 'Not Available';
      const firstBmi = bmis.length > 0 ? bmis[0].bmi : null;
      const bmiChange = latestBmi !== 'Not Available' && firstBmi ? (latestBmi - firstBmi).toFixed(2) : 'Not Available';

      reportData.progress = {
        history,
        latestWeight,
        weightChange,
        latestBmi,
        bmiChange,
        doctorNotes: notes
      };
    } else {
      return res.status(400).json({ success: false, message: 'Invalid Report Type' });
    }

    res.status(200).json({ success: true, data: reportData });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
