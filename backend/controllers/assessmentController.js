import Assessment from '../models/Assessment.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';

// GET /api/doctor/assessments
// Get all assessments made by the logged-in doctor
export const getAssessments = async (req, res) => {
  try {
    const doctorId = req.user._id;

    // Optional patient filter
    const filter = { doctorId };
    if (req.query.patientId) {
      filter.patientId = req.query.patientId;
    }

    const assessments = await Assessment.find(filter)
      .populate('patientId', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: assessments
    });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// GET /api/doctor/assessments/:id
// Get a specific assessment
export const getAssessmentById = async (req, res) => {
  try {
    const assessmentId = req.params.id;
    const doctorId = req.user._id;

    const assessment = await Assessment.findOne({ _id: assessmentId, doctorId })
      .populate('patientId', 'fullName email');

    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found.' });
    }

    res.status(200).json({
      success: true,
      data: assessment
    });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// POST /api/doctor/assessments/predict
// Calculates BMI, formats payload, and gets prediction from ML Service
export const predictObesity = async (req, res) => {
  try {
    const {
      patientId,
      Age,
      Gender,
      Height, // assumed to be in metres as sent by frontend
      Weight,
      FAVC,
      FCVC,
      NCP,
      CAEC,
      CH2O,
      SCC,
      CALC,
      family_history_with_overweight,
      SMOKE,
      FAF,
      TUE,
      MTRANS,
      mealPlanRequirements // Not sent to ML, just passed through
    } = req.body;

    // Validate required fields
    if (!patientId || !Age || !Gender || !Height || !Weight) {
      return res.status(400).json({ success: false, message: 'Missing required basic measurements.' });
    }

    // Verify patient is assigned to this doctor or has an approved appointment
    const patientProfile = await Patient.findOne({
      $or: [{ userId: patientId }, { _id: patientId }]
    });
    if (!patientProfile) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    const actualPatientUserId = patientProfile.userId;
    const isAssigned = patientProfile.assignedDoctor && patientProfile.assignedDoctor.toString() === req.user._id.toString();
    const hasAppointment = await Appointment.exists({
      patientId: actualPatientUserId,
      doctorId: req.user._id,
      status: { $in: ['approved', 'completed'] }
    });

    if (!isAssigned && !hasAppointment) {
      return res.status(403).json({ success: false, message: 'Patient not assigned to you or no approved appointment exists.' });
    }

    // Calculate Physical_Activity_Score (FAF - TUE)
    const faf = parseFloat(FAF || 0);
    const tue = parseFloat(TUE || 0);
    const Physical_Activity_Score = faf - tue;

    // Calculate BMI
    const bmi = parseFloat((Weight / (Height * Height)).toFixed(2));

    // Construct ML Payload exactly as required
    const mlPayload = {
      Age: parseFloat(Age),
      Gender,
      Height: parseFloat(Height),
      Weight: parseFloat(Weight),
      CALC,
      FAVC,
      FCVC: parseFloat(FCVC),
      NCP: parseFloat(NCP),
      SCC,
      SMOKE,
      CH2O: parseFloat(CH2O),
      family_history_with_overweight,
      FAF: faf,
      TUE: tue,
      CAEC,
      MTRANS,
      Physical_Activity_Score
    };

    // Attempt to call ML Service (Flask)
    let predictionResult;
    try {
      // If ML_SERVICE_URL is defined, call it
      if (process.env.ML_SERVICE_URL) {
        const response = await fetch(`${process.env.ML_SERVICE_URL}/predict`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(mlPayload)
        });
        if (!response.ok) {
          throw new Error(`ML Service responded with status: ${response.status}`);
        }
        predictionResult = await response.json();
      } else {
        // MOCK RESPONSE for UI Testing
        // Simulating the Random Forest output structure
        const classes = [
          'Insufficient_Weight', 'Normal_Weight', 'Overweight_Level_I', 
          'Overweight_Level_II', 'Obesity_Type_I', 'Obesity_Type_II', 'Obesity_Type_III'
        ];
        
        // Mock a realistic-looking prediction based roughly on BMI
        let mockClass = 'Normal_Weight';
        if (bmi < 18.5) mockClass = 'Insufficient_Weight';
        else if (bmi >= 25 && bmi < 27) mockClass = 'Overweight_Level_I';
        else if (bmi >= 27 && bmi < 30) mockClass = 'Overweight_Level_II';
        else if (bmi >= 30 && bmi < 35) mockClass = 'Obesity_Type_I';
        else if (bmi >= 35 && bmi < 40) mockClass = 'Obesity_Type_II';
        else if (bmi >= 40) mockClass = 'Obesity_Type_III';
        
        const confidence = (Math.random() * (98 - 75) + 75).toFixed(2);
        
        predictionResult = {
          predicted_class: mockClass,
          confidence: parseFloat(confidence),
          probabilities: [
            { class: mockClass, probability: parseFloat(confidence) },
            { class: classes[(classes.indexOf(mockClass) + 1) % classes.length], probability: (100 - confidence) / 2 },
            { class: classes[(classes.indexOf(mockClass) + 2) % classes.length], probability: (100 - confidence) / 2 }
          ]
        };
        console.log('Using Mock ML Service Response');
      }
    } catch (mlError) {
      console.error('ML Service Error:', mlError.message);
      return res.status(503).json({ 
        success: false, 
        message: 'ML Prediction Service is currently unavailable.',
        error: mlError.message
      });
    }

    // Return the calculated data and prediction back to frontend (Not saved yet)
    res.status(200).json({
      success: true,
      data: {
        inputs: mlPayload,
        patientId,
        bmi,
        height: Height,
        weight: Weight,
        mealPlanRequirements: mealPlanRequirements || {},
        prediction: {
          obesityClass: predictionResult.predicted_class,
          confidenceScore: predictionResult.confidence,
          topProbabilities: predictionResult.probabilities
        }
      }
    });

  } catch (error) {
    console.error('Error during prediction:', error);
    res.status(500).json({ success: false, message: 'Server Error during prediction' });
  }
};

// POST /api/doctor/assessments/save
// Save a verified assessment to the database
// Re-computes BMI and prediction server-side to prevent frontend spoofing
export const saveAssessment = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const {
      patientId,
      inputs,
      height,
      weight,
      mealPlanRequirements,
      doctorNote
    } = req.body;

    if (!patientId || !inputs || !height || !weight) {
      return res.status(400).json({ success: false, message: 'Incomplete assessment data provided for saving.' });
    }

    // Verify patient belongs to doctor via direct assignment or approved appointment
    const patientProfile = await Patient.findOne({
      $or: [{ userId: patientId }, { _id: patientId }]
    });
    if (!patientProfile) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    const actualPatientUserId = patientProfile.userId;
    const isAssigned = patientProfile.assignedDoctor && patientProfile.assignedDoctor.toString() === doctorId.toString();
    const hasAppointment = await Appointment.exists({
      patientId: actualPatientUserId,
      doctorId: doctorId,
      status: { $in: ['approved', 'completed'] }
    });

    if (!isAssigned && !hasAppointment) {
      return res.status(403).json({ success: false, message: 'Patient not assigned to you or no approved appointment exists.' });
    }

    // Server-side BMI calculation (height in metres)
    const h = parseFloat(height);
    const w = parseFloat(weight);
    const bmi = parseFloat((w / (h * h)).toFixed(2));

    // Re-compute Physical_Activity_Score
    const faf = parseFloat(inputs.FAF || 0);
    const tue = parseFloat(inputs.TUE || 0);
    const serverInputs = { ...inputs, Physical_Activity_Score: faf - tue };

    // Re-call ML service server-side to get authentic prediction
    let predictionResult;
    try {
      if (process.env.ML_SERVICE_URL) {
        const response = await fetch(`${process.env.ML_SERVICE_URL}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serverInputs)
        });
        if (!response.ok) {
          throw new Error(`ML Service responded with status: ${response.status}`);
        }
        predictionResult = await response.json();
      } else {
        // Fallback mock if ML service is not configured
        const classes = [
          'Insufficient_Weight', 'Normal_Weight', 'Overweight_Level_I',
          'Overweight_Level_II', 'Obesity_Type_I', 'Obesity_Type_II', 'Obesity_Type_III'
        ];
        let mockClass = 'Normal_Weight';
        if (bmi < 18.5) mockClass = 'Insufficient_Weight';
        else if (bmi >= 25 && bmi < 27) mockClass = 'Overweight_Level_I';
        else if (bmi >= 27 && bmi < 30) mockClass = 'Overweight_Level_II';
        else if (bmi >= 30 && bmi < 35) mockClass = 'Obesity_Type_I';
        else if (bmi >= 35 && bmi < 40) mockClass = 'Obesity_Type_II';
        else if (bmi >= 40) mockClass = 'Obesity_Type_III';
        const confidence = (Math.random() * (98 - 75) + 75).toFixed(2);
        predictionResult = {
          predicted_class: mockClass,
          confidence: parseFloat(confidence),
          probabilities: [
            { class: mockClass, probability: parseFloat(confidence) },
            { class: classes[(classes.indexOf(mockClass) + 1) % classes.length], probability: (100 - confidence) / 2 },
            { class: classes[(classes.indexOf(mockClass) + 2) % classes.length], probability: (100 - confidence) / 2 }
          ]
        };
        console.log('Using Mock ML Service Response for save');
      }
    } catch (mlError) {
      console.error('ML Service Error during save:', mlError.message);
      return res.status(503).json({
        success: false,
        message: 'ML Prediction Service is currently unavailable. Cannot save assessment.',
        error: mlError.message
      });
    }

    // Create the assessment record with server-computed values
    const newAssessment = new Assessment({
      patientId: actualPatientUserId,
      doctorId,
      height: h,
      weight: w,
      bmi,
      inputs: serverInputs,
      mealPlanRequirements,
      obesityClass: predictionResult.predicted_class,
      confidenceScore: predictionResult.confidence,
      topProbabilities: predictionResult.probabilities,
      doctorNote,
      isApproved: true // Saved by doctor, so it is approved
    });

    await newAssessment.save();

    // Update the Patient's profile with latest BMI, height, weight
    patientProfile.currentBmi = bmi;
    patientProfile.height = h * 100; // Convert back to cm for profile
    patientProfile.weight = w;
    
    // Also save the inputs and meal plan requirements to healthDetails so they prefill next time
    if (!patientProfile.healthDetails) patientProfile.healthDetails = {};
    patientProfile.healthDetails.familyHistoryOverweight = inputs.family_history_with_overweight || '';
    patientProfile.healthDetails.highCalorieFoodConsumption = inputs.FAVC || '';
    patientProfile.healthDetails.vegetableConsumption = Number(inputs.FCVC) || 2;
    patientProfile.healthDetails.mainMealsPerDay = Number(inputs.NCP) || 3;
    patientProfile.healthDetails.foodBetweenMeals = inputs.CAEC || '';
    patientProfile.healthDetails.waterConsumption = Number(inputs.CH2O) || 2;
    patientProfile.healthDetails.calorieMonitoring = inputs.SCC || '';
    patientProfile.healthDetails.smokingStatus = inputs.SMOKE || '';
    patientProfile.healthDetails.alcoholConsumption = inputs.CALC || '';
    patientProfile.healthDetails.physicalActivity = Number(inputs.FAF) || 1;
    patientProfile.healthDetails.technologyUsage = Number(inputs.TUE) || 1;
    patientProfile.healthDetails.transportationMethod = inputs.MTRANS || '';
    
    if (mealPlanRequirements) {
      if (mealPlanRequirements.dietaryPreference) {
        patientProfile.healthDetails.dietaryPreference = mealPlanRequirements.dietaryPreference;
      }
      if (Array.isArray(mealPlanRequirements.foodAllergies)) {
        patientProfile.healthDetails.foodAllergies = mealPlanRequirements.foodAllergies;
      }
      if (Array.isArray(mealPlanRequirements.medicalConditions)) {
        patientProfile.healthDetails.medicalConditions = mealPlanRequirements.medicalConditions;
      }
      if (Array.isArray(mealPlanRequirements.dislikedFoods)) {
        patientProfile.healthDetails.dislikedFoods = mealPlanRequirements.dislikedFoods;
      }
    }
    
    await patientProfile.save();

    res.status(201).json({
      success: true,
      message: 'Assessment saved successfully.',
      data: newAssessment
    });
  } catch (error) {
    console.error('Error saving assessment:', error);
    res.status(500).json({ success: false, message: 'Server Error saving assessment' });
  }
};
