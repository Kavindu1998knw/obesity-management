import Patient from '../models/Patient.js';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';

// Helper to generate mock health stats for new patients
const generateMockHealthStats = () => {
  const weight = Math.round(55 + Math.random() * 65); // 55-120 kg
  const height = Math.round(150 + Math.random() * 35); // 150-185 cm
  const bmi = parseFloat((weight / ((height / 100) ** 2)).toFixed(1));
  
  let latestPrediction = 'Normal Weight';
  let riskScore = Math.round(10 + Math.random() * 40); // 10-50%
  
  if (bmi >= 40) {
    latestPrediction = 'Obesity Class III';
    riskScore = Math.round(80 + Math.random() * 15);
  } else if (bmi >= 35) {
    latestPrediction = 'Obesity Class II';
    riskScore = Math.round(65 + Math.random() * 15);
  } else if (bmi >= 30) {
    latestPrediction = 'Obesity Class I';
    riskScore = Math.round(45 + Math.random() * 20);
  } else if (bmi >= 25) {
    latestPrediction = 'Overweight';
    riskScore = Math.round(25 + Math.random() * 20);
  } else if (bmi < 18.5) {
    latestPrediction = 'Underweight';
    riskScore = Math.round(15 + Math.random() * 15);
  }
  
  const mealPlans = [
    'Low-Carb Ketogenic Diet',
    'Calorie-Restricted Balanced Diet',
    'High-Protein/Low-Glycemic Diet',
    'Mediterranean Heart-Healthy Diet',
    'Intermittent Fasting Protocol'
  ];
  
  const latestMealPlan = bmi >= 25 
    ? mealPlans[Math.floor(Math.random() * 3)] // Weight management plans
    : mealPlans[3 + Math.floor(Math.random() * 2)]; // Standard plans
    
  return {
    latestWeight: weight,
    latestHeight: height,
    latestBmi: bmi,
    latestPrediction,
    riskScore,
    latestMealPlan
  };
};

// @desc    Create Patient
// @route   POST /api/patients
// @access  Private/Admin
export const createPatient = async (req, res) => {
  try {
    const { fullName, email, phone, dob, gender, medicalHistory, password, assignedDoctorId } = req.body;

    if (!fullName || !email || !dob || !gender || !password) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    // Check if email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email address is already registered.' });
    }

    // Validate assigned doctor if provided
    if (assignedDoctorId) {
      const doctorExists = await Doctor.findById(assignedDoctorId);
      if (!doctorExists) {
        return res.status(400).json({ success: false, message: 'Assigned doctor not found.' });
      }
    }

    // Create User record
    const user = new User({
      fullName,
      email,
      password,
      role: 'patient',
      status: 'active'
    });
    await user.save();

    // Generate baseline stats
    const stats = generateMockHealthStats();

    // Create Patient Profile
    const patientProfile = new Patient({
      userId: user._id,
      phoneNumber: phone || '',
      dob,
      gender,
      medicalHistory: medicalHistory || '',
      assignedDoctorId: assignedDoctorId || null,
      ...stats
    });
    await patientProfile.save();

    // Fetch populated result to send back
    const populated = await Patient.findById(patientProfile._id)
      .populate('userId')
      .populate({
        path: 'assignedDoctorId',
        populate: { path: 'userId' }
      });

    return res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: {
        _id: populated._id,
        userId: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: populated.phoneNumber,
        dob: populated.dob,
        gender: populated.gender,
        medicalHistory: populated.medicalHistory,
        assignedDoctorId: populated.assignedDoctorId?._id || null,
        assignedDoctorName: populated.assignedDoctorId?.userId?.fullName || 'Unassigned',
        status: user.status,
        latestBmi: populated.latestBmi,
        latestWeight: populated.latestWeight,
        latestHeight: populated.latestHeight,
        latestPrediction: populated.latestPrediction,
        riskScore: populated.riskScore,
        latestMealPlan: populated.latestMealPlan
      }
    });
  } catch (err) {
    console.error('Error in createPatient:', err);
    return res.status(500).json({ success: false, message: 'Failed to provision patient account.' });
  }
};

// @desc    Get All Patients
// @route   GET /api/patients
// @access  Private/Admin
export const getPatients = async (req, res) => {
  try {
    const profiles = await Patient.find()
      .populate('userId')
      .populate({
        path: 'assignedDoctorId',
        populate: { path: 'userId' }
      })
      .sort({ createdAt: -1 });

    const patients = profiles
      .filter(p => p.userId !== null) // Filter out orphaned profiles
      .map(p => ({
        _id: p._id,
        userId: p.userId._id,
        fullName: p.userId.fullName,
        email: p.userId.email,
        phone: p.phoneNumber,
        dob: p.dob,
        gender: p.gender,
        medicalHistory: p.medicalHistory,
        assignedDoctorId: p.assignedDoctorId?._id || null,
        assignedDoctorName: p.assignedDoctorId?.userId?.fullName || 'Unassigned',
        status: p.userId.status,
        latestBmi: p.latestBmi,
        latestWeight: p.latestWeight,
        latestHeight: p.latestHeight,
        latestPrediction: p.latestPrediction,
        riskScore: p.riskScore,
        latestMealPlan: p.latestMealPlan
      }));

    return res.status(200).json({
      success: true,
      data: patients
    });
  } catch (err) {
    console.error('Error in getPatients:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch patient records.' });
  }
};

// @desc    Get Patient By ID
// @route   GET /api/patients/:id
// @access  Private/Admin
export const getPatientById = async (req, res) => {
  try {
    const profile = await Patient.findById(req.params.id)
      .populate('userId')
      .populate({
        path: 'assignedDoctorId',
        populate: { path: 'userId' }
      });

    if (!profile || !profile.userId) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: profile._id,
        userId: profile.userId._id,
        fullName: profile.userId.fullName,
        email: profile.userId.email,
        phone: profile.phoneNumber,
        dob: profile.dob,
        gender: profile.gender,
        medicalHistory: profile.medicalHistory,
        assignedDoctorId: profile.assignedDoctorId?._id || null,
        assignedDoctorName: profile.assignedDoctorId?.userId?.fullName || 'Unassigned',
        status: profile.userId.status,
        latestBmi: profile.latestBmi,
        latestWeight: profile.latestWeight,
        latestHeight: profile.latestHeight,
        latestPrediction: profile.latestPrediction,
        riskScore: profile.riskScore,
        latestMealPlan: profile.latestMealPlan
      }
    });
  } catch (err) {
    console.error('Error in getPatientById:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch patient record.' });
  }
};

// @desc    Update Patient
// @route   PUT /api/patients/:id
// @access  Private/Admin
export const updatePatient = async (req, res) => {
  try {
    const { fullName, email, phone, dob, gender, medicalHistory, assignedDoctorId, status } = req.body;

    if (!fullName || !email || !dob || !gender) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    const profile = await Patient.findById(req.params.id).populate('userId');
    if (!profile || !profile.userId) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    const user = profile.userId;

    // Check email uniqueness if email is changed
    if (email.toLowerCase() !== user.email.toLowerCase()) {
      const emailConflict = await User.findOne({ email });
      if (emailConflict) {
        return res.status(400).json({ success: false, message: 'Email address is already in use.' });
      }
    }

    // Validate assigned doctor if changing
    if (assignedDoctorId) {
      const doctorExists = await Doctor.findById(assignedDoctorId);
      if (!doctorExists) {
        return res.status(400).json({ success: false, message: 'Assigned doctor not found.' });
      }
    }

    // Update patient fields
    profile.phoneNumber = phone;
    profile.dob = dob;
    profile.gender = gender;
    profile.medicalHistory = medicalHistory || '';
    profile.assignedDoctorId = assignedDoctorId || null;
    await profile.save();

    // Update user details
    user.fullName = fullName;
    user.email = email;
    if (status) {
      user.status = status.toLowerCase();
    }
    await user.save();

    // Fetch populated result
    const populated = await Patient.findById(profile._id)
      .populate('userId')
      .populate({
        path: 'assignedDoctorId',
        populate: { path: 'userId' }
      });

    return res.status(200).json({
      success: true,
      message: 'Patient updated successfully',
      data: {
        _id: populated._id,
        userId: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: populated.phoneNumber,
        dob: populated.dob,
        gender: populated.gender,
        medicalHistory: populated.medicalHistory,
        assignedDoctorId: populated.assignedDoctorId?._id || null,
        assignedDoctorName: populated.assignedDoctorId?.userId?.fullName || 'Unassigned',
        status: user.status,
        latestBmi: populated.latestBmi,
        latestWeight: populated.latestWeight,
        latestHeight: populated.latestHeight,
        latestPrediction: populated.latestPrediction,
        riskScore: populated.riskScore,
        latestMealPlan: populated.latestMealPlan
      }
    });
  } catch (err) {
    console.error('Error in updatePatient:', err);
    return res.status(500).json({ success: false, message: 'Failed to update patient details.' });
  }
};

// @desc    Delete Patient
// @route   DELETE /api/patients/:id
// @access  Private/Admin
export const deletePatient = async (req, res) => {
  try {
    const profile = await Patient.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    // Remove User account
    await User.findByIdAndDelete(profile.userId);

    // Remove Patient profile
    await Patient.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Patient deleted successfully'
    });
  } catch (err) {
    console.error('Error in deletePatient:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete patient account.' });
  }
};

// @desc    Deactivate Patient
// @route   PATCH /api/patients/:id/deactivate
// @access  Private/Admin
export const deactivatePatient = async (req, res) => {
  try {
    const profile = await Patient.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    const user = await User.findByIdAndUpdate(
      profile.userId,
      { status: 'inactive' },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Patient deactivated successfully',
      data: {
        _id: profile._id,
        userId: user._id,
        status: user.status
      }
    });
  } catch (err) {
    console.error('Error in deactivatePatient:', err);
    return res.status(500).json({ success: false, message: 'Failed to deactivate patient.' });
  }
};

// @desc    Activate Patient
// @route   PATCH /api/patients/:id/activate
// @access  Private/Admin
export const activatePatient = async (req, res) => {
  try {
    const profile = await Patient.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    const user = await User.findByIdAndUpdate(
      profile.userId,
      { status: 'active' },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Patient activated successfully',
      data: {
        _id: profile._id,
        userId: user._id,
        status: user.status
      }
    });
  } catch (err) {
    console.error('Error in activatePatient:', err);
    return res.status(500).json({ success: false, message: 'Failed to activate patient.' });
  }
};
