import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    // 1. Validation for missing fields
    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields (fullName, email, password, role) are required.' 
      });
    }

    // 2. Validate password length
    if (password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 8 characters long.' 
      });
    }

    // 3. Validate role enum
    if (!['patient', 'doctor', 'admin'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role. Role must be patient, doctor, or admin.' 
      });
    }

    // 4. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'A user with this email address already exists.' 
      });
    }

    // 5. Create new user (password is auto-hashed in pre-save hook)
    const user = new User({
      fullName,
      email,
      password,
      role
    });

    await user.save();

    res.status(214).json({
      success: true,
      message: 'User registered successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error occurred during registration.' 
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate inputs
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide both email and password.' 
      });
    }

    // 2. Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password.' 
      });
    }

    // 3. Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password.' 
      });
    }

    // 4. Generate JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5. Respond with token and user details (excluding password)
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error occurred during login.' 
    });
  }
};
