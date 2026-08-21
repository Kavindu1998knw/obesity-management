import MealPlan from '../models/MealPlan.js';
import Assessment from '../models/Assessment.js';
import MealTemplate from '../models/MealTemplate.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import mongoose from 'mongoose';

const ACTIVITY_FACTORS = {
  0: 1.20,
  1: 1.375,
  2: 1.55,
  3: 1.725
};

const getCalorieAdjustment = (tdee, obesityClass) => {
  switch (obesityClass) {
    case 'Insufficient_Weight': return tdee + 300;
    case 'Normal_Weight': return tdee;
    case 'Overweight_Level_I': return tdee - 300;
    case 'Overweight_Level_II': return tdee - 400;
    case 'Obesity_Type_I': return tdee - 500;
    case 'Obesity_Type_II': return tdee - 500;
    case 'Obesity_Type_III': return tdee - 500;
    default: return tdee;
  }
};

const calculateBMRAndTDEE = (weight, heightCm, age, gender, faf, obesityClass) => {
  let bmr;
  if (gender === 'Male') {
    bmr = (10 * weight) + (6.25 * heightCm) - (5 * age) + 5;
  } else {
    bmr = (10 * weight) + (6.25 * heightCm) - (5 * age) - 161;
  }
  
  const factor = ACTIVITY_FACTORS[Math.round(faf)] || 1.2;
  const tdee = Math.round(bmr * factor);
  const target = Math.round(getCalorieAdjustment(tdee, obesityClass));

  return {
    bmi: parseFloat((weight / Math.pow(heightCm / 100, 2)).toFixed(2)),
    bmr: Math.round(bmr),
    activityFactor: factor,
    tdee,
    calorieAdjustment: target - tdee,
    dailyCalorieTarget: target > 1000 ? target : 1200 // Safety minimum
  };
};

const checkAllergyConflict = (mealAllergens, patientAllergies) => {
  if (!patientAllergies || patientAllergies.length === 0) return false;
  return mealAllergens.some(a => patientAllergies.includes(a));
};

const checkDislikeConflict = (mealIngredients, patientDislikes) => {
  if (!patientDislikes || patientDislikes.length === 0) return false;
  const normalizedDislikes = patientDislikes.map(d => d.trim().toLowerCase());
  return mealIngredients.some(i => 
    normalizedDislikes.some(d => i.toLowerCase().includes(d))
  );
};

const filterMeals = async (obesityClass, pref, allergies, dislikes) => {
  // Step 1: Active
  let query = { isActive: true };
  
  // Step 2: Obesity Class
  query.suitableFor = obesityClass;

  // Step 3: Dietary preference via dietaryTypes field
  if (pref === 'Vegan') {
    query.dietaryTypes = 'Vegan';
  } else if (pref === 'Vegetarian') {
    query.dietaryTypes = { $in: ['Vegetarian', 'Vegan'] };
  }
  // 'No Special Preference' -> no dietaryTypes filter

  const candidates = await MealTemplate.find(query);

  // Steps 4-5: Allergies, Dislikes
  return candidates.filter(meal => {
    // Allergies
    if (checkAllergyConflict(meal.allergens, allergies)) return false;

    // Dislikes
    if (checkDislikeConflict(meal.ingredients, dislikes)) return false;

    return true;
  });
};

const buildMealSnapshot = (template) => {
  return {
    templateId: template._id,
    mealType: template.mealType,
    name: template.name,
    description: template.description || '',
    portionSize: template.portionSize || '1 serving',
    calories: template.calories,
    protein: template.protein,
    carbohydrates: template.carbohydrates,
    fat: template.fat,
    fiber: template.fiber,
    ingredients: template.ingredients || [],
    allergens: template.allergens || []
  };
};

// GET /api/doctor/meal-plans
export const getMealPlans = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const filter = { doctorId };
    
    if (req.query.status) filter.status = req.query.status;
    if (req.query.obesityClass) filter.obesityClass = req.query.obesityClass;
    if (req.query.patientId) filter.patientId = req.query.patientId;

    const plans = await MealPlan.find(filter)
      .populate('patientId', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    console.error('Error fetching meal plans:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// GET /api/doctor/meal-plans/:id
export const getMealPlanById = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const plan = await MealPlan.findOne({ _id: req.params.id, doctorId })
      .populate('patientId', 'fullName email')
      .populate('assessmentId', 'createdAt inputs');

    if (!plan) return res.status(404).json({ success: false, message: 'Meal Plan not found' });
    
    const planObj = plan.toObject();
    const filteredMeals = await filterMeals(plan.obesityClass, plan.dietaryPreference, plan.allergies, plan.dislikedFoods);
    planObj.alternatives = {
      Breakfast: filteredMeals.filter(t => t.mealType === 'Breakfast').map(buildMealSnapshot),
      Lunch: filteredMeals.filter(t => t.mealType === 'Lunch').map(buildMealSnapshot),
      Dinner: filteredMeals.filter(t => t.mealType === 'Dinner').map(buildMealSnapshot),
      Snack: filteredMeals.filter(t => t.mealType === 'Snack').map(buildMealSnapshot)
    };

    res.status(200).json({ success: true, data: planObj });
  } catch (error) {
    console.error('Error fetching meal plan:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// POST /api/doctor/meal-plans/generate
export const generateSuggestedPayload = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { assessmentId } = req.body;

    const assessment = await Assessment.findOne({ _id: assessmentId, doctorId });
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found or unauthorized.' });
    
    // Check patient assigned
    const patientProfile = await Patient.findOne({ userId: assessment.patientId, assignedDoctor: doctorId });
    if (!patientProfile) return res.status(403).json({ success: false, message: 'Patient not assigned to you.' });

    // Ensure all required inputs are present
    const inputs = assessment.inputs;
    if (!inputs || inputs.Age === undefined || !inputs.Gender || !inputs.Height || !inputs.Weight || inputs.FAF === undefined) {
      return res.status(400).json({ success: false, message: 'Assessment missing basic demographic/activity inputs.' });
    }

    const reqPrefs = assessment.mealPlanRequirements || {};
    const pref = reqPrefs.dietaryPreference || 'No Special Preference';
    const allergies = (reqPrefs.foodAllergies || []).filter(a => a !== 'None');
    const medical = (reqPrefs.medicalConditions || []).filter(c => c !== 'None');
    const dislikes = (reqPrefs.dislikedFoods || []).filter(d => d !== 'None');

    const obesityClass = assessment.obesityClass || assessment.prediction?.obesityClass;
    if (!obesityClass) return res.status(400).json({ success: false, message: 'Assessment is missing the obesity classification result.' });

    // Step 1: Calculate Targets
    const calcs = calculateBMRAndTDEE(
      inputs.Weight, 
      inputs.Height * 100, 
      inputs.Age, 
      inputs.Gender, 
      inputs.FAF, 
      obesityClass
    );

    const alloc = {
      Breakfast: calcs.dailyCalorieTarget * 0.25,
      Lunch: calcs.dailyCalorieTarget * 0.35,
      Dinner: calcs.dailyCalorieTarget * 0.30,
      Snack: calcs.dailyCalorieTarget * 0.10
    };

    // Step 2: Filter Active Meals
    const filteredMeals = await filterMeals(obesityClass, pref, allergies, dislikes);
    
    const suggestedMeals = [];
    let warnings = [];

    ['Breakfast', 'Lunch', 'Dinner', 'Snack'].forEach(type => {
      const typeMeals = filteredMeals.filter(m => m.mealType === type);
      if (typeMeals.length === 0) {
        warnings.push(`No suitable ${type.toLowerCase()} option was found for this patient’s obesity class, dietary preference and allergies. Doctor review is required.`);
      } else {
        // Select closest to allocation
        const target = alloc[type];
        const selected = typeMeals.reduce((prev, curr) => 
          Math.abs(curr.calories - target) < Math.abs(prev.calories - target) ? curr : prev
        );
        suggestedMeals.push(buildMealSnapshot(selected));
      }
    });

    // Calculate initial totals
    const totals = suggestedMeals.reduce((acc, curr) => {
      acc.totalMealCalories += curr.calories;
      acc.totalProtein += curr.protein;
      acc.totalCarbohydrates += curr.carbohydrates;
      acc.totalFat += curr.fat;
      acc.totalFiber += curr.fiber;
      return acc;
    }, { totalMealCalories: 0, totalProtein: 0, totalCarbohydrates: 0, totalFat: 0, totalFiber: 0 });

    totals.calorieDifference = totals.totalMealCalories - calcs.dailyCalorieTarget;

    const payload = {
      patientId: assessment.patientId,
      doctorId,
      assessmentId,
      obesityClass,
      ...calcs,
      ...totals,
      dietaryPreference: pref,
      allergies,
      medicalConditions: medical,
      dislikedFoods: dislikes,
      meals: suggestedMeals,
      alternatives: {
        Breakfast: filteredMeals.filter(t => t.mealType === 'Breakfast').map(buildMealSnapshot),
        Lunch: filteredMeals.filter(t => t.mealType === 'Lunch').map(buildMealSnapshot),
        Dinner: filteredMeals.filter(t => t.mealType === 'Dinner').map(buildMealSnapshot),
        Snack: filteredMeals.filter(t => t.mealType === 'Snack').map(buildMealSnapshot)
      },
      warnings
    };

    res.status(200).json({ success: true, data: payload });
  } catch (error) {
    console.error('Error generating payload:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// POST /api/doctor/meal-plans/alternatives
export const getAlternativeMeals = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { assessmentId, mealPlanId, mealType, excludeTemplateId } = req.body;

    let obesityClass, pref, allergies, dislikes;

    if (mealPlanId) {
      const plan = await MealPlan.findOne({ _id: mealPlanId, doctorId });
      if (!plan) return res.status(404).json({ success: false, message: 'Plan not found.' });
      obesityClass = plan.obesityClass;
      pref = plan.dietaryPreference;
      allergies = plan.allergies;
      dislikes = plan.dislikedFoods;
    } else if (assessmentId) {
      const assessment = await Assessment.findOne({ _id: assessmentId, doctorId });
      if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found.' });
      obesityClass = assessment.obesityClass || assessment.prediction?.obesityClass;
      const reqPrefs = assessment.mealPlanRequirements || {};
      pref = reqPrefs.dietaryPreference || 'No Special Preference';
      allergies = (reqPrefs.foodAllergies || []).filter(a => a !== 'None');
      dislikes = (reqPrefs.dislikedFoods || []).filter(d => d !== 'None');
    } else {
      return res.status(400).json({ success: false, message: 'Requires assessmentId or mealPlanId.' });
    }

    const filteredMeals = await filterMeals(obesityClass, pref, allergies, dislikes);
    
    let typeMeals = filteredMeals.filter(m => m.mealType === mealType);
    if (excludeTemplateId) {
      typeMeals = typeMeals.filter(m => m._id.toString() !== excludeTemplateId.toString());
    }

    res.status(200).json({ success: true, data: typeMeals.map(buildMealSnapshot) });
  } catch (error) {
    console.error('Error fetching alternatives:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Internal Recalculator
const recalculatePlan = async (templateIds, calcs) => {
  const templates = await MealTemplate.find({ _id: { $in: templateIds }, isActive: true });
  
  if (templates.length !== templateIds.length) {
    throw new Error('One or more selected templates are invalid or inactive.');
  }

  const meals = templates.map(buildMealSnapshot);
  
  const totals = meals.reduce((acc, curr) => {
    acc.totalMealCalories += curr.calories;
    acc.totalProtein += curr.protein;
    acc.totalCarbohydrates += curr.carbohydrates;
    acc.totalFat += curr.fat;
    acc.totalFiber += curr.fiber;
    return acc;
  }, { totalMealCalories: 0, totalProtein: 0, totalCarbohydrates: 0, totalFat: 0, totalFiber: 0 });

  totals.calorieDifference = totals.totalMealCalories - calcs.dailyCalorieTarget;
  
  return { meals, totals };
};

// POST /api/doctor/meal-plans
export const saveDraft = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const { 
      assessmentId,
      templateIds, // Array of ObjectIds
      waterTarget, foodsToAvoid, exerciseRecommendation, doctorInstructions, medicalConditionWarningAcknowledged
    } = req.body;

    if (!assessmentId || !templateIds || !Array.isArray(templateIds)) {
      return res.status(400).json({ success: false, message: 'Assessment ID and template IDs are required.' });
    }

    // Verify assessment belongs to this doctor
    const assessment = await Assessment.findOne({ _id: assessmentId, doctorId });
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found or unauthorized.' });
    }

    // Verify patient is assigned to this doctor or has an approved appointment
    const patientProfile = await Patient.findOne({
      $or: [{ userId: assessment.patientId }, { _id: assessment.patientId }]
    });
    if (!patientProfile) {
      return res.status(404).json({ success: false, message: 'Patient not found.' });
    }

    const isAssigned = patientProfile.assignedDoctor && patientProfile.assignedDoctor.toString() === doctorId.toString();
    const hasAppointment = await Appointment.exists({
      patientId: patientProfile.userId,
      doctorId: doctorId,
      status: { $in: ['approved', 'completed'] }
    });

    if (!isAssigned && !hasAppointment) {
      return res.status(403).json({ success: false, message: 'Patient not assigned to you or no approved appointment exists.' });
    }

    // Derive all values server-side from assessment
    const inputs = assessment.inputs;
    if (!inputs || inputs.Age === undefined || !inputs.Gender || !inputs.Height || !inputs.Weight || inputs.FAF === undefined) {
      return res.status(400).json({ success: false, message: 'Assessment missing basic demographic/activity inputs.' });
    }

    const obesityClass = assessment.obesityClass;
    if (!obesityClass) {
      return res.status(400).json({ success: false, message: 'Assessment is missing the obesity classification result.' });
    }

    const reqPrefs = assessment.mealPlanRequirements || {};
    const dietaryPreference = reqPrefs.dietaryPreference || 'No Special Preference';
    const allergies = (reqPrefs.foodAllergies || []).filter(a => a !== 'None');
    const medicalConditions = (reqPrefs.medicalConditions || []).filter(c => c !== 'None');
    const dislikedFoods = (reqPrefs.dislikedFoods || []).filter(d => d !== 'None');

    // Server-side calculation of BMR/TDEE/targets
    const calcs = calculateBMRAndTDEE(
      inputs.Weight, inputs.Height * 100, inputs.Age, inputs.Gender, inputs.FAF, obesityClass
    );

    let mealsData;
    try {
      mealsData = await recalculatePlan(templateIds, { dailyCalorieTarget: calcs.dailyCalorieTarget });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    const plan = new MealPlan({
      patientId: assessment.patientId, doctorId, assessmentId, obesityClass,
      bmi: calcs.bmi, bmr: calcs.bmr, activityFactor: calcs.activityFactor,
      tdee: calcs.tdee, calorieAdjustment: calcs.calorieAdjustment, dailyCalorieTarget: calcs.dailyCalorieTarget,
      ...mealsData.totals,
      dietaryPreference, allergies, medicalConditions, dislikedFoods,
      meals: mealsData.meals,
      waterTarget, foodsToAvoid, exerciseRecommendation, doctorInstructions, medicalConditionWarningAcknowledged,
      status: 'Draft'
    });

    await plan.save();
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// PUT /api/doctor/meal-plans/:id
export const updateDraft = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const plan = await MealPlan.findOne({ _id: req.params.id, doctorId, status: 'Draft' });
    if (!plan) return res.status(404).json({ success: false, message: 'Draft not found or already approved.' });

    const { templateIds, dailyCalorieTarget, waterTarget, foodsToAvoid, exerciseRecommendation, doctorInstructions, medicalConditionWarningAcknowledged } = req.body;

    const calcs = { dailyCalorieTarget: dailyCalorieTarget || plan.dailyCalorieTarget };
    let mealsData;
    try {
      mealsData = await recalculatePlan(templateIds, calcs);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    plan.dailyCalorieTarget = calcs.dailyCalorieTarget;
    Object.assign(plan, mealsData.totals);
    plan.meals = mealsData.meals;
    plan.waterTarget = waterTarget;
    plan.foodsToAvoid = foodsToAvoid;
    plan.exerciseRecommendation = exerciseRecommendation;
    plan.doctorInstructions = doctorInstructions;
    plan.medicalConditionWarningAcknowledged = medicalConditionWarningAcknowledged;

    await plan.save();
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    console.error('Error updating draft:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// POST /api/doctor/meal-plans/:id/approve
export const approveMealPlan = async (req, res) => {
  try {
    const doctorId = req.user._id;
    const plan = await MealPlan.findOne({ _id: req.params.id, doctorId, status: 'Draft' });
    if (!plan) return res.status(404).json({ success: false, message: 'Draft not found or already approved.' });

    // Validate instructions
    if (!plan.doctorInstructions || plan.doctorInstructions.trim() === '') {
      return res.status(400).json({ success: false, message: 'Doctor instructions are required before approval.' });
    }

    // Validate Medical Acknowledgment
    if (plan.medicalConditions && plan.medicalConditions.length > 0 && !plan.medicalConditionWarningAcknowledged) {
      return res.status(400).json({ success: false, message: 'Medical warning must be acknowledged.' });
    }

    // We do one final strict verification pass
    const templateIds = plan.meals.map(m => m.templateId);
    let mealsData;
    try {
      mealsData = await recalculatePlan(templateIds, { dailyCalorieTarget: plan.dailyCalorieTarget });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    // Validation rules
    const breakfast = mealsData.meals.filter(m => m.mealType === 'Breakfast').length;
    const lunch = mealsData.meals.filter(m => m.mealType === 'Lunch').length;
    const dinner = mealsData.meals.filter(m => m.mealType === 'Dinner').length;
    const snacks = mealsData.meals.filter(m => m.mealType === 'Snack').length;

    if (breakfast !== 1 || lunch !== 1 || dinner !== 1 || snacks < 1 || snacks > 2) {
      return res.status(400).json({ success: false, message: 'Invalid meal configuration. Must have exactly 1 Breakfast, 1 Lunch, 1 Dinner, and 1-2 Snacks.' });
    }

    // Verify suitable rules
    for (let meal of mealsData.meals) {
      const template = await MealTemplate.findById(meal.templateId);
      if (!template.suitableFor.includes(plan.obesityClass)) {
        return res.status(400).json({ success: false, message: `Meal ${meal.name} is not suitable for ${plan.obesityClass}.` });
      }
      // Dietary preference re-validation
      if (plan.dietaryPreference === 'Vegan' && (!template.dietaryTypes || !template.dietaryTypes.includes('Vegan'))) {
        return res.status(400).json({ success: false, message: `Meal ${meal.name} is not suitable for Vegan dietary preference.` });
      }
      if (plan.dietaryPreference === 'Vegetarian' && (!template.dietaryTypes || (!template.dietaryTypes.includes('Vegetarian') && !template.dietaryTypes.includes('Vegan')))) {
        return res.status(400).json({ success: false, message: `Meal ${meal.name} is not suitable for Vegetarian dietary preference.` });
      }
      if (checkAllergyConflict(meal.allergens, plan.allergies)) {
        return res.status(400).json({ success: false, message: `Meal ${meal.name} contains allergens conflicting with patient profile.` });
      }
      if (checkDislikeConflict(meal.ingredients, plan.dislikedFoods)) {
        return res.status(400).json({ success: false, message: `Meal ${meal.name} contains disliked ingredients.` });
      }
    }

    Object.assign(plan, mealsData.totals);
    plan.meals = mealsData.meals;
    plan.status = 'Approved';
    plan.approvedAt = new Date();

    await plan.save();

    // Automatically complete the approved appointment(s) for this patient with this doctor
    try {
      const noteText = plan.doctorInstructions
        ? `Meal Plan Approved: ${plan.doctorInstructions.trim()}`
        : 'Dietary Consultation & Meal Plan approved successfully.';

      await Appointment.updateMany(
        {
          patientId: plan.patientId,
          doctorId: doctorId,
          status: 'approved'
        },
        {
          $set: {
            status: 'completed',
            consultationNote: noteText.slice(0, 2000)
          }
        }
      );
    } catch (apptErr) {
      console.warn('Auto-completing appointment on meal plan approval warning:', apptErr);
    }

    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    console.error('Error approving meal plan:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
