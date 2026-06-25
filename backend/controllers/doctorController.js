import Doctor from '../models/Doctor.js';
import User from '../models/User.js';

// @desc    Create Doctor
// @route   POST /api/doctors
// @access  Private/Admin
export const createDoctor = async (req, res) => {
  try {
    const { fullName, email, phone, licenseNumber, department, specialization, password } = req.body;

    if (!fullName || !email || !licenseNumber || !department || !specialization || !password) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    // Check if email already exists in User collection
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email address is already registered.' });
    }

    // Check if license number already exists in Doctor Profile collection
    const licenseExists = await Doctor.findOne({ licenseNumber });
    if (licenseExists) {
      return res.status(400).json({ success: false, message: 'Medical License Number is already registered.' });
    }

    // Create User record with custom password
    const user = new User({
      fullName: fullName.startsWith('Dr. ') ? fullName : `Dr. ${fullName}`,
      email,
      password,
      role: 'doctor',
      status: 'active'
    });
    await user.save();

    // Create Doctor Profile record linked to User _id
    const doctorProfile = new Doctor({
      userId: user._id,
      phoneNumber: phone || '',
      licenseNumber,
      department,
      specialization
    });
    await doctorProfile.save();

    return res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      data: {
        _id: doctorProfile._id,
        userId: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: doctorProfile.phoneNumber,
        licenseNumber: doctorProfile.licenseNumber,
        department: doctorProfile.department,
        specialization: doctorProfile.specialization,
        status: user.status
      }
    });
  } catch (err) {
    console.error('Error in createDoctor:', err);
    return res.status(500).json({ success: false, message: 'Failed to provision doctor account.' });
  }
};

// @desc    Get All Doctors
// @route   GET /api/doctors
// @access  Private/Admin
export const getDoctors = async (req, res) => {
  try {
    const profiles = await Doctor.find().populate('userId').sort({ createdAt: -1 });
    
    // Map populated data to flat structure expected by frontend
    const doctors = profiles
      .filter(profile => profile.userId !== null) // filter out orphaned profiles
      .map(profile => ({
        _id: profile._id,
        userId: profile.userId._id,
        fullName: profile.userId.fullName,
        email: profile.userId.email,
        phone: profile.phoneNumber,
        licenseNumber: profile.licenseNumber,
        department: profile.department,
        specialization: profile.specialization,
        status: profile.userId.status,
        assignedPatientsCount: 0 // Default value
      }));

    return res.status(200).json({
      success: true,
      data: doctors
    });
  } catch (err) {
    console.error('Error in getDoctors:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch doctor records.' });
  }
};

// @desc    Get Single Doctor
// @route   GET /api/doctors/:id
// @access  Private/Admin
export const getDoctorById = async (req, res) => {
  try {
    const profile = await Doctor.findById(req.params.id).populate('userId');
    if (!profile || !profile.userId) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: profile._id,
        userId: profile.userId._id,
        fullName: profile.userId.fullName,
        email: profile.userId.email,
        phone: profile.phoneNumber,
        licenseNumber: profile.licenseNumber,
        department: profile.department,
        specialization: profile.specialization,
        status: profile.userId.status,
        assignedPatientsCount: 0
      }
    });
  } catch (err) {
    console.error('Error in getDoctorById:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch doctor record.' });
  }
};

// @desc    Update Doctor
// @route   PUT /api/doctors/:id
// @access  Private/Admin
export const updateDoctor = async (req, res) => {
  try {
    const { fullName, email, phone, licenseNumber, department, specialization, status } = req.body;

    if (!fullName || !email || !licenseNumber || !department || !specialization) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }

    const profile = await Doctor.findById(req.params.id).populate('userId');
    if (!profile || !profile.userId) {
      return res.status(404).json({ success: false, message: 'Doctor not found.' });
    }

    const user = profile.userId;

    // Check email uniqueness if email is changed
    if (email.toLowerCase() !== user.email.toLowerCase()) {
      const emailConflict = await User.findOne({ email });
      if (emailConflict) {
        return res.status(400).json({ success: false, message: 'Email address is already in use.' });
      }
    }

    // Check licenseNumber uniqueness if changed
    if (licenseNumber !== profile.licenseNumber) {
      const licenseConflict = await Doctor.findOne({ licenseNumber });
      if (licenseConflict) {
        return res.status(400).json({ success: false, message: 'Medical License Number is already in use.' });
      }
    }

    // Update Doctor Profile
    profile.phoneNumber = phone || '';
    profile.licenseNumber = licenseNumber;
    profile.department = department;
    profile.specialization = specialization;
    await profile.save();

    // Update User credentials
    user.fullName = fullName.startsWith('Dr. ') ? fullName : `Dr. ${fullName}`;
    user.email = email;
    if (status) {
      user.status = status;
    }
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Doctor updated successfully',
      data: {
        _id: profile._id,
        userId: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: profile.phoneNumber,
        licenseNumber: profile.licenseNumber,
        department: profile.department,
        specialization: profile.specialization,
        status: user.status,
        assignedPatientsCount: 0
      }
    });
  } catch (err) {
    console.error('Error in updateDoctor:', err);
    return res.status(500).json({ success: false, message: 'Failed to update doctor details.' });
  }
};

// @desc    Delete Doctor
// @route   DELETE /api/doctors/:id
// @access  Private/Admin
export const deleteDoctor = async (req, res) => {
  try {
    const profile = await Doctor.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    // Remove User account
    await User.findByIdAndDelete(profile.userId);

    // Remove Doctor profile
    await Doctor.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Doctor deleted successfully'
    });
  } catch (err) {
    console.error('Error in deleteDoctor:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete doctor account.' });
  }
};

// @desc    Deactivate Doctor
// @route   PATCH /api/doctors/:id/deactivate
// @access  Private/Admin
export const deactivateDoctor = async (req, res) => {
  try {
    const profile = await Doctor.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    const user = await User.findByIdAndUpdate(
      profile.userId,
      { status: 'inactive' },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Doctor deactivated successfully',
      data: {
        _id: profile._id,
        userId: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: profile.phoneNumber,
        licenseNumber: profile.licenseNumber,
        department: profile.department,
        specialization: profile.specialization,
        status: user.status,
        assignedPatientsCount: 0
      }
    });
  } catch (err) {
    console.error('Error in deactivateDoctor:', err);
    return res.status(500).json({ success: false, message: 'Failed to deactivate doctor.' });
  }
};

// @desc    Activate Doctor
// @route   PATCH /api/doctors/:id/activate
// @access  Private/Admin
export const activateDoctor = async (req, res) => {
  try {
    const profile = await Doctor.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    }

    const user = await User.findByIdAndUpdate(
      profile.userId,
      { status: 'active' },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Doctor activated successfully',
      data: {
        _id: profile._id,
        userId: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: profile.phoneNumber,
        licenseNumber: profile.licenseNumber,
        department: profile.department,
        specialization: profile.specialization,
        status: user.status,
        assignedPatientsCount: 0
      }
    });
  } catch (err) {
    console.error('Error in activateDoctor:', err);
    return res.status(500).json({ success: false, message: 'Failed to activate doctor.' });
  }
};
