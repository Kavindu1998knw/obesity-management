import mongoose from 'mongoose';
import MealPlan from '../models/MealPlan.js';

async function runTests() {
  console.log("=== MealPlan Schema Validation Tests ===\n");
  
  const validDraftData = {
    patientId: new mongoose.Types.ObjectId(),
    doctorId: new mongoose.Types.ObjectId(),
    assessmentId: new mongoose.Types.ObjectId(),
    obesityClass: 'Obesity_Type_I',
    bmi: 31,
    bmr: 1500,
    activityFactor: 1.2,
    tdee: 1800,
    calorieAdjustment: -500,
    dailyCalorieTarget: 1300,
    totalMealCalories: 1250,
    calorieDifference: -50,
    totalProtein: 80,
    totalCarbohydrates: 150,
    totalFat: 40,
    totalFiber: 25,
    meals: [
      {
        templateId: new mongoose.Types.ObjectId(),
        mealType: 'Breakfast',
        name: 'Oats',
        portionSize: '1 bowl',
        calories: 300,
        protein: 10,
        carbohydrates: 40,
        fat: 5,
        fiber: 5
      }
    ],
    status: 'Draft'
  };

  // 1. Valid Draft
  try {
    const draft = new MealPlan(validDraftData);
    await draft.validate();
    console.log("[PASS] Valid Draft validation succeeded.");
  } catch (err) {
    console.error("[FAIL] Valid Draft failed:", err.message);
  }

  // 2. Missing patientId
  try {
    const missingPatient = new MealPlan({ ...validDraftData, patientId: undefined });
    await missingPatient.validate();
    console.error("[FAIL] Missing patientId should have thrown an error.");
  } catch (err) {
    if (err.errors && err.errors.patientId) {
      console.log("[PASS] Missing patientId caught properly.");
    } else {
      console.error("[FAIL] Missing patientId threw unexpected error:", err.message);
    }
  }

  // 3. Invalid status
  try {
    const invalidStatus = new MealPlan({ ...validDraftData, status: 'Completed' });
    await invalidStatus.validate();
    console.error("[FAIL] Invalid status should have thrown an error.");
  } catch (err) {
    if (err.errors && err.errors.status) {
      console.log("[PASS] Invalid status 'Completed' caught properly.");
    } else {
      console.error("[FAIL] Invalid status threw unexpected error:", err.message);
    }
  }

  // 4. Negative calorie value
  try {
    const negativeCalData = JSON.parse(JSON.stringify(validDraftData)); // deep clone
    negativeCalData.totalMealCalories = -100; // invalid!
    const negativeCal = new MealPlan(negativeCalData);
    await negativeCal.validate();
    console.error("[FAIL] Negative calorie value should have thrown an error.");
  } catch (err) {
    if (err.errors && err.errors.totalMealCalories) {
      console.log("[PASS] Negative totalMealCalories caught properly.");
    } else {
      console.error("[FAIL] Negative calorie value threw unexpected error:", err.message);
    }
  }

  // 5. Invalid meal type
  try {
    const invalidMealData = JSON.parse(JSON.stringify(validDraftData));
    invalidMealData.meals[0].mealType = 'Brunch'; // not in enum
    const invalidMeal = new MealPlan(invalidMealData);
    await invalidMeal.validate();
    console.error("[FAIL] Invalid meal type should have thrown an error.");
  } catch (err) {
    if (err.errors && err.errors['meals.0.mealType']) {
      console.log("[PASS] Invalid mealType 'Brunch' caught properly.");
    } else {
      console.error("[FAIL] Invalid meal type threw unexpected error:", err.message);
    }
  }

  console.log("\n=== Test Complete ===");
  process.exit(0);
}

runTests();
