import Assessment from '../models/Assessment.js';

// GET /api/patient/assessments
// Get all assessments for the logged-in patient
export const getMyAssessments = async (req, res) => {
  try {
    const patientId = req.user._id;

    const assessments = await Assessment.find({ patientId })
      .populate('doctorId', 'fullName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: assessments
    });
  } catch (error) {
    console.error('Error fetching patient assessments:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
