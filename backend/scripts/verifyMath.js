import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Assessment from '../models/Assessment.js';
import { generateSuggestedPayload } from '../controllers/mealPlanController.js';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function verifyLogic() {
  await mongoose.connect(process.env.MONGO_URI);
  
  // Find an assessment with inputs
  const assessment = await Assessment.findOne({ prediction: { $exists: true } });
  if (!assessment) {
    console.log("No assessment found to test");
    process.exit(0);
  }

  // We can mock req, res for the controller
  const req = {
    user: { _id: assessment.doctorId },
    body: { assessmentId: assessment._id }
  };

  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      console.log("Status:", this.statusCode);
      if (this.statusCode === 200) {
         console.log("=== CALCULATIONS ===");
         console.log("BMI:", data.data.bmi);
         console.log("BMR:", data.data.bmr);
         console.log("Activity Factor:", data.data.activityFactor);
         console.log("TDEE:", data.data.tdee);
         console.log("Calorie Adjustment:", data.data.calorieAdjustment);
         console.log("Target:", data.data.dailyCalorieTarget);
         console.log("=== MEALS ===");
         data.data.meals.forEach(m => {
            console.log(`[${m.mealType}] ${m.name} - ${m.calories}kcal - P:${m.protein} C:${m.carbohydrates} F:${m.fat} Fib:${m.fiber}`);
         });
         console.log("=== TOTALS ===");
         console.log("Meal Calories:", data.data.totalMealCalories);
         console.log("Difference:", data.data.calorieDifference);
         console.log("Warnings:", data.data.warnings);
      } else {
         console.log("Error:", data);
      }
      mongoose.disconnect();
    }
  };

  await generateSuggestedPayload(req, res);
}

verifyLogic();
