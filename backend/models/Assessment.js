import mongoose from 'mongoose';

const AssessmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Basic metrics saved at time of assessment
  height: { type: Number, required: true }, // in metres
  weight: { type: Number, required: true }, // in kg
  bmi: { type: Number, required: true },
  
  // The exact payload sent to ML model
  inputs: {
    type: Object,
    required: true
  },
  
  // Dietary/Meal Plan parameters captured during assessment
  mealPlanRequirements: {
    dietaryPreference: { type: String, default: 'No Special Preference' },
    foodAllergies: [{ type: String }],
    medicalConditions: [{ type: String }],
    dislikedFoods: [{ type: String }]
  },

  // ML Output
  obesityClass: {
    type: String,
    required: true,
    enum: [
      'Insufficient_Weight', 
      'Normal_Weight', 
      'Overweight_Level_I', 
      'Overweight_Level_II', 
      'Obesity_Type_I', 
      'Obesity_Type_II', 
      'Obesity_Type_III'
    ]
  },
  confidenceScore: {
    type: Number,
    required: true
  },
  topProbabilities: [{
    class: { type: String },
    probability: { type: Number }
  }],
  
  doctorNote: {
    type: String,
    trim: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Assessment = mongoose.model('Assessment', AssessmentSchema);
export default Assessment;
