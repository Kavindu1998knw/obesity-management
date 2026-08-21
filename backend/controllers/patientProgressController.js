import ProgressRecord from '../models/ProgressRecord.js';
import Patient from '../models/Patient.js';
import MealPlan from '../models/MealPlan.js';

// GET /api/patient/progress
export const getMyProgress = async (req, res) => {
  try {
    const patientId = req.user._id;
    const records = await ProgressRecord.find({ patientId }).sort({ date: -1 });
    
    const patientProfile = await Patient.findOne({ userId: patientId });

    // Check if patient has an approved meal plan for defaults
    const activeMealPlan = await MealPlan.findOne({ patientId, status: 'Approved' });

    res.status(200).json({
      success: true,
      data: {
        records,
        hasApprovedMealPlan: !!activeMealPlan,
        patientHeight: patientProfile?.height || null
      }
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// POST /api/patient/progress
export const addProgressRecord = async (req, res) => {
  try {
    const patientId = req.user._id;
    const { date, weight, mealAdherence, physicalActivity, note } = req.body;

    if (!weight || weight <= 0) {
      return res.status(400).json({ success: false, message: 'Valid positive weight is required.' });
    }

    if (weight < 20 || weight > 400) {
      return res.status(400).json({ success: false, message: 'Unrealistic weight value. Please check your entry.' });
    }

    const recordDate = new Date(date || Date.now());
    recordDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (recordDate > today) {
      return res.status(400).json({ success: false, message: 'Future dates are not allowed.' });
    }

    const patientProfile = await Patient.findOne({ userId: patientId });
    if (!patientProfile || !patientProfile.height) {
      return res.status(400).json({ success: false, message: 'Patient height is missing. Cannot calculate BMI.' });
    }

    // Calculate BMI
    const heightInMeters = patientProfile.height / 100;
    const bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));

    // Check for duplicate date
    const existingRecord = await ProgressRecord.findOne({
      patientId,
      date: recordDate
    });

    if (existingRecord) {
      // Return a special error code so frontend can prompt for update
      return res.status(409).json({ 
        success: false, 
        message: 'A progress record already exists for this date. Do you want to update it?',
        existingRecordId: existingRecord._id
      });
    }

    const newRecord = await ProgressRecord.create({
      patientId,
      date: recordDate,
      weight,
      bmi,
      mealAdherence: mealAdherence || 'Not Applicable',
      physicalActivity: physicalActivity || 'None',
      note: note || ''
    });

    // Only update patient profile's current weight/BMI if this is the latest record
    const latestRecord = await ProgressRecord.findOne({ patientId }).sort({ date: -1 });
    if (!latestRecord || recordDate >= latestRecord.date) {
      patientProfile.weight = weight;
      patientProfile.currentBmi = bmi;
      await patientProfile.save();
    }

    res.status(201).json({ success: true, data: newRecord });
  } catch (error) {
    console.error('Error adding progress:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// PUT /api/patient/progress/:id
export const updateProgressRecord = async (req, res) => {
  try {
    const patientId = req.user._id;
    const { id } = req.params;
    const { weight, mealAdherence, physicalActivity, note } = req.body;

    const record = await ProgressRecord.findOne({ _id: id, patientId });
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    if (weight) {
      if (weight <= 0 || weight < 20 || weight > 400) {
        return res.status(400).json({ success: false, message: 'Invalid weight value.' });
      }
      
      const patientProfile = await Patient.findOne({ userId: patientId });
      const heightInMeters = patientProfile.height / 100;
      record.bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
      record.weight = weight;

      // Update patient profile if this is the latest record
      const latestRecord = await ProgressRecord.findOne({ patientId }).sort({ date: -1 });
      if (latestRecord && latestRecord._id.toString() === id) {
        patientProfile.weight = weight;
        patientProfile.currentBmi = record.bmi;
        await patientProfile.save();
      }
    }

    if (mealAdherence) record.mealAdherence = mealAdherence;
    if (physicalActivity) record.physicalActivity = physicalActivity;
    if (note !== undefined) record.note = note;

    await record.save();

    res.status(200).json({ success: true, data: record });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
