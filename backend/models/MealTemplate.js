import mongoose from 'mongoose';

const MealTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    mealType: {
      type: String,
      required: true,
      enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack']
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    portionSize: {
      type: String,
      required: true,
      trim: true
    },
    calories: {
      type: Number,
      required: true,
      min: 0
    },
    protein: {
      type: Number,
      required: true,
      min: 0
    },
    carbohydrates: {
      type: Number,
      required: true,
      min: 0
    },
    fat: {
      type: Number,
      required: true,
      min: 0
    },
    fiber: {
      type: Number,
      required: true,
      min: 0
    },
    ingredients: {
      type: [String],
      required: true,
      validate: {
        validator: (ingredients) => ingredients.length > 0,
        message: 'At least one ingredient is required'
      }
    },
    dietaryTypes: [
      {
        type: String,
        enum: ['No Special Preference', 'Vegetarian', 'Vegan']
      }
    ],
    allergens: [
      {
        type: String,
        enum: [
          'Seafood / Shellfish',
          'Strong Fish Types & Maldive Fish',
          'Red Meats',
          'Acidic Fruits',
          'Certain Vegetables',
          'Milk & Dairy',
          'Egg',
          'Peanuts, Tree Nuts & Soy',
          'Gluten'
        ]
      }
    ],
    suitableFor: [
      {
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
      }
    ],
    medicalWarnings: {
      type: [String],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const MealTemplate = mongoose.model('MealTemplate', MealTemplateSchema);

export default MealTemplate;
