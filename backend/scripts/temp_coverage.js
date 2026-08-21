import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const MealTemplateSchema = new mongoose.Schema({
  name: String,
  mealType: String,
  suitableFor: [String],
  isActive: Boolean
});
const MealTemplate = mongoose.model('MealTemplate', MealTemplateSchema);

async function checkCoverage() {
  await mongoose.connect(process.env.MONGO_URI);
  const classes = [
    'Insufficient_Weight',
    'Normal_Weight',
    'Overweight_Level_I',
    'Overweight_Level_II',
    'Obesity_Type_I',
    'Obesity_Type_II',
    'Obesity_Type_III'
  ];
  const types = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  
  const matrix = {};
  for (const cls of classes) {
    matrix[cls] = {};
    for (const type of types) {
      const count = await MealTemplate.countDocuments({
        isActive: true,
        mealType: type,
        suitableFor: cls
      });
      matrix[cls][type] = count;
    }
  }
  
  console.table(matrix);
  mongoose.disconnect();
}

checkCoverage();
