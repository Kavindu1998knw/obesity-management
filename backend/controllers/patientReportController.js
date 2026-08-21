import Patient from '../models/Patient.js';
import Assessment from '../models/Assessment.js';
import MealPlan from '../models/MealPlan.js';
import Appointment from '../models/Appointment.js';
import ProgressRecord from '../models/ProgressRecord.js';
import mongoose from 'mongoose';

// GET /api/patient/reports/generate
export const generatePatientReport = async (req, res) => {
  try {
    const patientId = req.user._id;
    const { reportType, fromDate, toDate, obesityClass, mealPlanStatus } = req.query;

    const patient = await Patient.findOne({ userId: patientId })
      .populate('userId', 'fullName email')
      .populate('assignedDoctor', 'fullName');

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    let dateFilter = {};
    if (fromDate || toDate) {
      dateFilter.createdAt = {};
      if (fromDate) dateFilter.createdAt.$gte = new Date(`${fromDate}T00:00:00.000Z`);
      if (toDate) dateFilter.createdAt.$lte = new Date(`${toDate}T23:59:59.999Z`);
    }

    const patientDetails = {
      fullName: patient.userId.fullName,
      email: patient.userId.email,
      phone: patient.phoneNumber || 'Not Available',
      age: patient.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : 'Not Available',
      gender: patient.gender || 'Not Available',
      height: patient.height || 'Not Available',
      weight: patient.weight || 'Not Available',
      bmi: patient.currentBmi || 'Not Available',
      assignedDoctor: patient.assignedDoctor?.fullName || 'Not Assigned'
    };

    let reportData = { patientDetails, generatedDate: new Date(), reportType };

    if (reportType === 'Personal Health Report') {
      const assessments = await Assessment.find({ patientId, ...dateFilter })
        .populate('doctorId', 'fullName')
        .sort({ createdAt: -1 });
      const latestAssessment = assessments[0];
      
      const appointments = await Appointment.find({ patientId, ...dateFilter })
        .populate('doctorId', 'fullName')
        .sort({ date: -1 });
      
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

    } else if (reportType === 'Obesity Assessment Report') {
      let filter = { patientId, ...dateFilter };
      if (obesityClass) filter.obesityClass = obesityClass;
      
      const assessments = await Assessment.find(filter)
        .populate('doctorId', 'fullName')
        .sort({ createdAt: -1 });
      
      if (assessments.length === 0) {
        return res.status(404).json({ success: false, message: 'No assessments found for the selected filters.' });
      }

      reportData.assessments = assessments.map(a => ({
        assessmentId: a._id,
        date: a.createdAt,
        doctorName: a.doctorId?.fullName || 'Unknown',
        height: a.height,
        weight: a.weight,
        bmi: a.bmi,
        predictedObesityLevel: a.obesityClass,
        confidence: a.confidenceScore,
        topProbabilities: a.topProbabilities || []
      }));

    } else if (reportType === 'Meal Plan Report') {
      // Patients can only see approved meal plans in reports
      let filter = { patientId, status: 'Approved', ...dateFilter };
      
      const plans = await MealPlan.find(filter)
        .populate('doctorId', 'fullName')
        .populate('assessmentId', 'obesityClass')
        .sort({ approvedAt: -1, createdAt: -1 });

      if (plans.length === 0) {
        return res.status(404).json({ success: false, message: 'No approved meal plans found for the selected filters.' });
      }

      reportData.plans = plans;

    } else if (reportType === 'Progress Report') {
      // For progress, dateFilter applies to 'date' field in ProgressRecord
      let progDateFilter = {};
      if (fromDate || toDate) {
        progDateFilter.date = {};
        if (fromDate) progDateFilter.date.$gte = new Date(`${fromDate}T00:00:00.000Z`);
        if (toDate) progDateFilter.date.$lte = new Date(`${toDate}T23:59:59.999Z`);
      }

      const specificProgress = await ProgressRecord.find({ patientId, ...progDateFilter }).sort({ date: 1 });

      if (specificProgress.length === 0) {
        return res.status(404).json({ success: false, message: 'No progress records found for the selected filters.' });
      }

      const history = specificProgress.map(p => ({
        date: p.date,
        weight: p.weight,
        bmi: p.bmi,
        mealAdherence: p.mealAdherence,
        physicalActivity: p.physicalActivity,
        note: p.note
      }));

      const latestWeight = history[history.length - 1].weight;
      const firstWeight = history[0].weight;
      const weightChange = (latestWeight - firstWeight).toFixed(1);

      reportData.progress = {
        history,
        startingWeight: firstWeight,
        latestWeight,
        weightChange,
        totalRecords: history.length
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
