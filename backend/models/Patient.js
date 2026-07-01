import mongoose from 'mongoose';

const PatientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  dob: {
    type: Date,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', ''],
  },
  medicalHistory: {
    type: String,
    trim: true,
    default: '',
  },
  assignedDoctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    default: null,
  },
  latestBmi: {
    type: Number,
    default: null
  },
  latestWeight: {
    type: Number, // in kg
    default: null
  },
  latestHeight: {
    type: Number, // in cm
    default: null
  },
  latestPrediction: {
    type: String, // e.g. "Obesity Class I", "Normal Weight", "Overweight"
    default: 'N/A'
  },
  riskScore: {
    type: Number,
    default: null
  },
  latestMealPlan: {
    type: String,
    default: 'N/A'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Patient = mongoose.model('Patient', PatientSchema);
export default Patient;
