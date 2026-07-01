import User from '../models/User.js';
import Patient from '../models/Patient.js';
import jwt from 'jsonwebtoken';

export const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, role, dob, gender } = req.body;

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    if (!['patient', 'doctor', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    if (role === 'patient' && (!dob || !gender)) {
      return res.status(400).json({ success: false, message: 'Date of Birth and Gender are required.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const user = new User({ fullName, email, password, role });
    await user.save();

    // Create a Patient profile document if user registered as patient
    if (role === 'patient') {
      const weight = Math.round(55 + Math.random() * 65); // 55-120 kg
      const height = Math.round(150 + Math.random() * 35); // 150-185 cm
      const bmi = parseFloat((weight / ((height / 100) ** 2)).toFixed(1));
      
      let latestPrediction = 'Normal Weight';
      let riskScore = Math.round(10 + Math.random() * 40);
      
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
        ? mealPlans[Math.floor(Math.random() * 3)] 
        : mealPlans[3 + Math.floor(Math.random() * 2)];

      const patientProfile = new Patient({
        userId: user._id,
        phoneNumber: '',
        dob: dob || null,
        gender: gender || '',
        medicalHistory: '',
        assignedDoctorId: null,
        latestWeight: weight,
        latestHeight: height,
        latestBmi: bmi,
        latestPrediction,
        riskScore,
        latestMealPlan
      });
      await patientProfile.save();
    }

    res.status(201).json({ success: true, message: 'Account created successfully.' });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ success: false, message: 'Registration failed.' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Your account is deactivated. Please contact an admin.' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
};
