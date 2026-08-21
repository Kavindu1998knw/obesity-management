import User from '../models/User.js';
import Patient from '../models/Patient.js';
import jwt from 'jsonwebtoken';

export const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, dob, gender } = req.body;

    if (!fullName || !email || !password || !dob || !gender) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const dobDate = new Date(dob);
    const today = new Date();
    if (dobDate > today) {
      return res.status(400).json({ success: false, message: 'Date of birth cannot be in the future.' });
    }

    const allowedGenders = ['Male', 'Female', 'Other'];
    if (!allowedGenders.includes(gender)) {
      return res.status(400).json({ success: false, message: 'Invalid gender.' });
    }

    const existing = await User.findOne({ email: new RegExp(`^${trimmedEmail}$`, 'i') });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // Force role to 'patient' regardless of request body
    const user = new User({ 
      fullName: trimmedFullName, 
      email: trimmedEmail, 
      password, 
      role: 'patient' 
    });
    await user.save();

    // Create a Patient profile document if user registered as patient
    // Create a Patient profile document
    try {
      const patientProfile = new Patient({
        userId: user._id,
        phoneNumber: '',
        dob: dobDate,
        gender: gender,
        medicalHistory: ''
      });
      await patientProfile.save();
    } catch (profileErr) {
      // Rollback user creation to avoid orphaned users
      await User.findByIdAndDelete(user._id);
      console.error('Error creating patient profile:', profileErr);
      return res.status(500).json({ success: false, message: 'Registration failed during profile creation.' });
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

    const trimmedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: trimmedEmail });
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

    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn }
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

// POST /api/auth/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset link is invalid or has expired. Please contact the administrator.',
      });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been changed successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};
