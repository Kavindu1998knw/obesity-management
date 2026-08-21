import mongoose from 'mongoose';

const MealSnapshotSchema = new mongoose.Schema({
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'MealTemplate', required: true },
  mealType: { 
    type: String, 
    required: true,
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack']
  },
  name: { type: String, required: true },
  description: { type: String },
  portionSize: { type: String, required: true },
  calories: { type: Number, required: true, min: 0 },
  protein: { type: Number, required: true, min: 0 },
  carbohydrates: { type: Number, required: true, min: 0 },
  fat: { type: Number, required: true, min: 0 },
  fiber: { type: Number, required: true, min: 0 },
  ingredients: { type: [String], default: [] },
  allergens: { type: [String], default: [] }
}, { _id: false });

const MealPlanSchema = new mongoose.Schema({
  // Relations
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  
  // Calculation Snapshots
  obesityClass: { type: String, required: true },
  bmi: { type: Number, required: true, min: 0 },
  bmr: { type: Number, required: true, min: 0 },
  activityFactor: { type: Number, required: true, min: 1 },
  tdee: { type: Number, required: true, min: 0 },
  calorieAdjustment: { type: Number, required: true },
  dailyCalorieTarget: { type: Number, required: true, min: 0 },
  
  // Totals Snapshot
  totalMealCalories: { type: Number, required: true, min: 0 },
  calorieDifference: { type: Number, required: true },
  totalProtein: { type: Number, required: true, min: 0 },
  totalCarbohydrates: { type: Number, required: true, min: 0 },
  totalFat: { type: Number, required: true, min: 0 },
  totalFiber: { type: Number, required: true, min: 0 },
  
  // Preference Snapshots
  dietaryPreference: { type: String, default: 'No Special Preference' },
  allergies: { type: [String], default: [] },
  medicalConditions: { type: [String], default: [] },
  dislikedFoods: { type: [String], default: [] },

  // Meals
  meals: {
    type: [MealSnapshotSchema],
    default: [],
    validate: [
      {
        validator: function(val) {
          if (this.status === 'Approved') {
            const hasBreakfast = val.some(m => m.mealType === 'Breakfast');
            const hasLunch = val.some(m => m.mealType === 'Lunch');
            const hasDinner = val.some(m => m.mealType === 'Dinner');
            const snacksCount = val.filter(m => m.mealType === 'Snack').length;
            return hasBreakfast && hasLunch && hasDinner && (snacksCount === 1 || snacksCount === 2);
          }
          return true;
        },
        message: 'Approved plans must have exactly 1 Breakfast, 1 Lunch, 1 Dinner, and 1 or 2 Snacks.'
      }
    ]
  },

  // Doctor Editable Fields
  waterTarget: { type: String, trim: true },
  foodsToAvoid: { type: [String], default: [] },
  exerciseRecommendation: { type: String, trim: true },
  doctorInstructions: { type: String, trim: true },
  medicalConditionWarningAcknowledged: { type: Boolean, default: false },

  // Status and Tracking
  status: { 
    type: String, 
    enum: ['Draft', 'Approved'], 
    default: 'Draft' 
  },
  approvedAt: { type: Date }

}, { timestamps: true });

// Indexes for performance
MealPlanSchema.index({ doctorId: 1, status: 1 });
MealPlanSchema.index({ patientId: 1, createdAt: -1 });
MealPlanSchema.index({ assessmentId: 1 });

const MealPlan = mongoose.model('MealPlan', MealPlanSchema);
export default MealPlan;
