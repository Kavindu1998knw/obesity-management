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
  assignedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  assignedDoctorAt: {
    type: Date,
  },
  height: {
    type: Number, // in cm
  },
  weight: {
    type: Number, // in kg
  },
  currentBmi: {
    type: Number,
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
  healthDetails: {
    familyHistoryOverweight: { type: String, enum: ['yes', 'no', ''], default: '' },
    highCalorieFoodConsumption: { type: String, enum: ['yes', 'no', ''], default: '' },
    vegetableConsumption: { type: Number, min: 1, max: 3 }, // 1=Never, 2=Sometimes, 3=Always
    mainMealsPerDay: { type: Number, min: 1, max: 4 },
    foodBetweenMeals: { type: String, enum: ['no', 'Sometimes', 'Frequently', 'Always', ''], default: '' },
    waterConsumption: { type: Number, min: 1, max: 3 }, // liters
    calorieMonitoring: { type: String, enum: ['yes', 'no', ''], default: '' },
    smokingStatus: { type: String, enum: ['yes', 'no', ''], default: '' },
    alcoholConsumption: { type: String, enum: ['no', 'Sometimes', 'Frequently', 'Always', ''], default: '' },
    physicalActivity: { type: Number, min: 0, max: 3 }, // days per week
    technologyUsage: { type: Number, min: 0, max: 24 }, // hours per day
    transportationMethod: { type: String, enum: ['Automobile', 'Motorbike', 'Bike', 'Public_Transportation', 'Walking', ''], default: '' },
    dietaryPreference: { type: String, enum: ['None', 'No Special Preference', 'Vegetarian', 'Vegan', ''], default: 'No Special Preference' },
    foodAllergies: [{ type: String }],
    medicalConditions: [{ type: String }],
    dislikedFoods: [{ type: String }]
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  profileCompleted: {
    type: Boolean,
    default: false,
  },
  onboardingStatus: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started',
  },
});

const Patient = mongoose.model('Patient', PatientSchema);
export default Patient;
