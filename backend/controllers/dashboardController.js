import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Assessment from '../models/Assessment.js';
import MealPlan from '../models/MealPlan.js';
import ProgressRecord from '../models/ProgressRecord.js';

// GET /api/dashboard/admin
export const getAdminDashboard = async (req, res) => {
  try {
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    const totalPatients = await User.countDocuments({ role: 'patient' });
    
    // Active patients defined as patients who are not deactivated/inactive
    const activePatients = await User.countDocuments({ role: 'patient', status: { $ne: 'inactive' } });

    // Appointments metrics
    const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });
    const approvedAppointments = await Appointment.countDocuments({ status: 'approved' });
    const completedAppointments = await Appointment.countDocuments({ status: 'completed' });

    // Obesity Category Distribution
    const latestAssessments = await Assessment.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$patientId', latestClass: { $first: '$obesityClass' } } },
      { $group: { _id: '$latestClass', count: { $sum: 1 } } }
    ]);
    
    const dbToLabelMap = {
      'Insufficient_Weight': 'Insufficient Weight',
      'Normal_Weight': 'Normal Weight',
      'Overweight_Level_I': 'Overweight Level I',
      'Overweight_Level_II': 'Overweight Level II',
      'Obesity_Type_I': 'Obesity Type I',
      'Obesity_Type_II': 'Obesity Type II',
      'Obesity_Type_III': 'Obesity Type III'
    };
    
    const colors = {
      'Insufficient_Weight': '#3B82F6',       // Blue
      'Normal_Weight': '#10B981',             // Green
      'Overweight_Level_I': '#F59E0B',        // Amber
      'Overweight_Level_II': '#D97706',       // Darker Amber
      'Obesity_Type_I': '#EF4444',            // Red
      'Obesity_Type_II': '#B91C1C',           // Dark Red
      'Obesity_Type_III': '#7F1D1D'           // Very Dark Red
    };

    const countsMap = {};
    latestAssessments.forEach(item => { countsMap[item._id] = item.count; });
    
    const obesityDistribution = Object.keys(dbToLabelMap).map(dbKey => ({
      dbValue: dbKey,
      name: dbToLabelMap[dbKey],
      value: countsMap[dbKey] || 0,
      color: colors[dbKey]
    }));

    // Monthly Trends (Last 6 calendar months)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const getLast6MonthsKeys = () => {
      const months = [];
      const d = new Date();
      d.setDate(1);
      d.setHours(0,0,0,0);
      for(let i = 5; i >= 0; i--) {
        const past = new Date(d);
        past.setMonth(past.getMonth() - i);
        const year = past.getFullYear();
        const month = past.getMonth() + 1; // 1-12
        months.push({ 
          key: `${year}-${month.toString().padStart(2, '0')}`,
          label: `${monthNames[past.getMonth()]} ${year}`,
          year, month 
        });
      }
      return months;
    };
    
    const last6Months = getLast6MonthsKeys();
    const startDate = new Date(last6Months[0].year, last6Months[0].month - 1, 1);

    const monthlyTrendAgg = await Appointment.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { 
        $group: { 
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, 
          count: { $sum: 1 } 
        } 
      }
    ]);

    const apptMap = {};
    monthlyTrendAgg.forEach(item => {
      const k = `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`;
      apptMap[k] = item.count;
    });

    const monthlyAppointmentTrend = last6Months.map(m => ({
      key: m.key,
      name: m.label,
      appointments: apptMap[m.key] || 0
    }));

    const patientTrendAgg = await User.aggregate([
      { $match: { role: 'patient', createdAt: { $gte: startDate } } },
      { 
        $group: { 
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, 
          count: { $sum: 1 } 
        } 
      }
    ]);

    const regMap = {};
    patientTrendAgg.forEach(item => {
      const k = `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`;
      regMap[k] = item.count;
    });

    const patientRegistrationTrend = last6Months.map(m => ({
      key: m.key,
      name: m.label,
      registrations: regMap[m.key] || 0
    }));

    // Recent registrations (limit to 5)
    const recentRegistrations = await User.find({ role: 'patient' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fullName role createdAt status');

    // Recent Appointments (limit to 5)
    const recentApptsRaw = await Appointment.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('patientId', 'fullName')
      .populate('doctorId', 'fullName');
      
    // Safely handle missing patient/doctor
    const recentAppointments = recentApptsRaw.map(appt => ({
      _id: appt._id,
      status: appt.status,
      date: appt.date,
      time: appt.time,
      createdAt: appt.createdAt,
      patientId: appt.patientId || { fullName: 'Unavailable' },
      doctorId: appt.doctorId || { fullName: 'Unavailable' }
    }));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalDoctors,
          totalPatients,
          activePatients,
          pendingAppointments,
          approvedAppointments,
          completedAppointments
        },
        obesityDistribution,
        monthlyAppointmentTrend,
        patientRegistrationTrend,
        recentRegistrations,
        recentAppointments
      }
    });
  } catch (error) {
    console.error('Admin Dashboard Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// GET /api/dashboard/doctor
export const getDoctorDashboard = async (req, res) => {
  try {
    const doctorId = req.user._id;
    
    // Get all patients assigned to this doctor and valid users
    const rawAssignedPatients = await Patient.find({ assignedDoctor: doctorId }).populate('userId', 'fullName status');
    
    // Safely filter out patients where userId is null or user is deleted
    const assignedPatientsList = rawAssignedPatients.filter(p => p.userId && p.userId._id);
    const assignedPatientIds = assignedPatientsList.map(p => p.userId._id);
    const assignedPatientsCount = assignedPatientsList.length;

    // Today's boundaries
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Appointments for today
    const todayAppointmentsRaw = await Appointment.find({
      doctorId: doctorId,
      status: 'approved',
      date: { $gte: startOfToday, $lte: endOfToday }
    }).sort({ time: 1 }).populate('patientId', 'fullName');

    // Completed Assessments by this doctor
    const completedAssessmentsCount = await Assessment.countDocuments({ doctorId: doctorId });

    // Patients Awaiting Assessment (Assigned but no assessment by THIS doctor)
    const assessmentsByDoctor = await Assessment.find({ doctorId: doctorId }).distinct('patientId');
    const awaitingPatientIds = assignedPatientIds.filter(pid => !assessmentsByDoctor.some(apid => apid.equals(pid)));
    
    const patientsAwaitingAssessment = assignedPatientsList
      .filter(p => awaitingPatientIds.some(apid => apid.equals(p.userId._id)))
      .map(p => ({
        name: p.userId.fullName,
        assignedDate: p.createdAt
      }));

    // High-Risk Patients & Recent Predictions
    let highRiskCount = 0;
    const recentPredictions = [];
    
    for (const p of assignedPatientsList) {
      const latestAssessment = await Assessment.findOne({ patientId: p.userId._id, doctorId: doctorId })
        .sort({ createdAt: -1 });
        
      if (latestAssessment) {
        if (latestAssessment.obesityClass === 'Obesity_Type_II' || latestAssessment.obesityClass === 'Obesity_Type_III') {
          highRiskCount++;
        }
        recentPredictions.push({
          patientName: p.userId.fullName,
          obesityLevel: latestAssessment.obesityClass,
          confidence: latestAssessment.confidenceScore,
          date: latestAssessment.createdAt
        });
      }
    }
    
    recentPredictions.sort((a, b) => b.date - a.date);

    // Approved Meal Plans
    const approvedMealPlansCount = await MealPlan.countDocuments({
      doctorId: doctorId,
      status: "Approved"
    });

    // Follow-up Required
    const followUpRequired = [];
    const followUpAppointments = await Appointment.find({
      doctorId: doctorId,
      status: 'completed',
      followUpRequired: true
    }).sort({ date: -1 }).populate('patientId', 'fullName');

    const addedFollowUpPatients = new Set();
    
    // We want the LATEST relevant follow-up record per patient
    for (const appt of followUpAppointments) {
      if (appt.patientId && !addedFollowUpPatients.has(appt.patientId._id.toString())) {
        addedFollowUpPatients.add(appt.patientId._id.toString());
        
        const latestProgress = await ProgressRecord.findOne({ patientId: appt.patientId._id }).sort({ date: -1 });
        
        followUpRequired.push({
          patientName: appt.patientId.fullName,
          latestBmi: latestProgress ? latestProgress.bmi : 'N/A',
          lastUpdate: appt.date,
          suggestedFollowUpDate: appt.suggestedFollowUpDate
        });
      }
    }
    
    followUpRequired.sort((a, b) => {
      const dateA = a.suggestedFollowUpDate || a.lastUpdate;
      const dateB = b.suggestedFollowUpDate || b.lastUpdate;
      return new Date(dateA) - new Date(dateB);
    });

    const todaySchedule = todayAppointmentsRaw.map(appt => ({
      patientName: appt.patientId?.fullName || 'Unavailable',
      time: appt.time,
      reason: appt.reason || 'General Follow-up',
      status: appt.status
    }));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          assignedPatients: assignedPatientsCount,
          todayAppointmentsCount: todayAppointmentsRaw.length,
          pendingAssessments: patientsAwaitingAssessment.length,
          completedAssessments: completedAssessmentsCount,
          highRiskPatients: highRiskCount,
          approvedMealPlans: approvedMealPlansCount
        },
        todayAppointments: todaySchedule,
        patientsAwaitingAssessment,
        recentPredictions: recentPredictions.slice(0, 10),
        followUpRequired: followUpRequired.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Doctor Dashboard Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// GET /api/dashboard/patient
export const getPatientDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const patientProfile = await Patient.findOne({ userId });
    
    if (!patientProfile) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    // Latest Assessment
    const latestAssessment = await Assessment.findOne({ patientId: userId }).sort({ createdAt: -1 });

    // Next Appointment
    const now = new Date();
    // Start of today so we get today's appointments, then we filter by time if they are today.
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const upcomingAppointments = await Appointment.find({
      patientId: userId,
      status: 'approved',
      date: { $gte: startOfToday }
    }).sort({ date: 1, time: 1 }).populate('doctorId', 'fullName');

    let nextAppointment = null;
    for (const appt of upcomingAppointments) {
      const isToday = new Date(appt.date).toDateString() === now.toDateString();
      if (!isToday) {
        nextAppointment = appt;
        break;
      }
      
      if (appt.time) {
        const [hours, minutes] = appt.time.split(':').map(Number);
        const apptDateTime = new Date(appt.date);
        apptDateTime.setHours(hours, minutes, 0, 0);
        if (apptDateTime >= now) {
          nextAppointment = appt;
          break;
        }
      }
    }

    // Latest Meal Plan
    const latestMealPlan = await MealPlan.findOne({
      patientId: userId,
      status: 'Approved'
    }).sort({ approvedAt: -1, createdAt: -1 });

    // Weight and BMI calculations
    const allAssessments = await Assessment.find({ patientId: userId }).sort({ createdAt: 1 });
    const allProgress = await ProgressRecord.find({ patientId: userId }).sort({ date: 1 });

    // Build history timeline for charts and weight change
    const history = [];

    allAssessments.forEach(a => {
      history.push({
        date: a.createdAt,
        weight: a.weight,
        bmi: a.bmi,
        source: 'Assessment'
      });
    });

    allProgress.forEach(p => {
      // Avoid inserting a duplicate if there's already an assessment on the exact same date
      const pDate = p.date || p.createdAt;
      const existing = history.find(h => new Date(h.date).toDateString() === new Date(pDate).toDateString());
      if (existing) {
        if (p.weight && !existing.weight) existing.weight = p.weight;
      } else {
        history.push({
          date: pDate,
          weight: p.weight, // Now uses actual progress weight
          bmi: p.bmi,
          source: 'Progress'
        });
      }
    });

    history.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate weight change
    const weightsOnly = history.filter(h => h.weight !== null && h.weight !== undefined);
    let weightChange = 'Not Enough Data';
    if (weightsOnly.length >= 2) {
      const w1 = weightsOnly[0].weight;
      const w2 = weightsOnly[weightsOnly.length - 1].weight;
      const diff = w2 - w1;
      if (diff === 0) weightChange = 'No Change';
      else weightChange = diff > 0 ? `+${diff.toFixed(1)} kg` : `${diff.toFixed(1)} kg`;
    }

    const currentWeight = weightsOnly.length > 0 ? weightsOnly[weightsOnly.length - 1].weight : 'Not Available';
    const currentBmi = history.length > 0 ? history[history.length - 1].bmi : 'Not Available';

    // Generate pseudo-notifications
    const notifications = [];
    const recentAppointments = await Appointment.find({ patientId: userId }).sort({ createdAt: -1 }).limit(3);
    recentAppointments.forEach(appt => {
      if (appt.status === 'approved') notifications.push({ id: `appt-a-${appt._id}`, message: 'Appointment approved', date: appt.createdAt });
      if (appt.status === 'rejected') notifications.push({ id: `appt-r-${appt._id}`, message: 'Appointment rejected', date: appt.createdAt });
      if (appt.status === 'cancelled') notifications.push({ id: `appt-c-${appt._id}`, message: 'Appointment cancelled', date: appt.createdAt });
      if (appt.rescheduleNote) notifications.push({ id: `appt-rs-${appt._id}`, message: 'Appointment rescheduled', date: appt.createdAt });
    });

    if (latestAssessment) {
      notifications.push({ id: `assess-${latestAssessment._id}`, message: 'New assessment available', date: latestAssessment.createdAt });
    }
    if (latestMealPlan) {
      notifications.push({ id: `meal-${latestMealPlan._id}`, message: 'New meal plan approved', date: latestMealPlan.approvedAt || latestMealPlan.createdAt });
    }

    // Sort notifications by date
    notifications.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          currentBmi,
          latestClassification: latestAssessment ? latestAssessment.obesityClass : 'Not Assessed',
          currentWeight,
          weightChange
        },
        nextAppointment: nextAppointment ? {
          doctorName: nextAppointment.doctorId?.fullName || 'Unknown',
          date: nextAppointment.date,
          time: nextAppointment.time,
          reason: nextAppointment.reason,
          status: nextAppointment.status
        } : null,
        latestAssessment: latestAssessment ? {
          date: latestAssessment.createdAt,
          bmi: latestAssessment.bmi,
          obesityClass: latestAssessment.obesityClass,
          confidence: latestAssessment.confidenceScore
        } : null,
        latestMealPlan: latestMealPlan ? {
          status: latestMealPlan.status,
          dailyCalorieTarget: latestMealPlan.dailyCalorieTarget,
          approvedDate: latestMealPlan.approvedAt,
          meals: latestMealPlan.meals // to show Breakfast, Lunch, Dinner, Snack
        } : null,
        progressOverview: history,
        recentNotifications: notifications.slice(0, 5) // Send top 5
      }
    });
  } catch (error) {
    console.error('Patient Dashboard Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
