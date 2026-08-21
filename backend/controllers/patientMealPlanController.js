import MealPlan from '../models/MealPlan.js';
import MealTemplate from '../models/MealTemplate.js';

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

// GET /api/patient/meal-plans
// Get all approved meal plans for the logged-in patient with alternative options for variety
export const getMyMealPlans = async (req, res) => {
  try {
    const patientId = req.user._id;

    // Fetch only Approved meal plans
    const mealPlans = await MealPlan.find({ 
      patientId, 
      status: 'Approved' 
    })
      .populate('doctorId', 'fullName')
      .populate('assessmentId', 'obesityClass createdAt bmi')
      .sort({ approvedAt: -1, createdAt: -1 });

    const enrichedPlans = await Promise.all(mealPlans.map(async (plan) => {
      const planObj = plan.toObject();

      // Find all suitable active templates for this patient's obesity class & dietary preference
      let query = { 
        isActive: true, 
        suitableFor: plan.obesityClass 
      };

      if (plan.dietaryPreference === 'Vegan') {
        query.dietaryTypes = 'Vegan';
      } else if (plan.dietaryPreference === 'Vegetarian') {
        query.dietaryTypes = { $in: ['Vegetarian', 'Vegan'] };
      }

      const templates = await MealTemplate.find(query);

      const suitableTemplates = templates.filter(t => {
        if (checkAllergyConflict(t.allergens, plan.allergies)) return false;
        if (checkDislikeConflict(t.ingredients, plan.dislikedFoods)) return false;
        return true;
      });

      const buildSnapshot = (t) => ({
        templateId: t._id,
        mealType: t.mealType,
        name: t.name,
        description: t.description || '',
        portionSize: t.portionSize || '1 serving',
        calories: t.calories,
        protein: t.protein,
        carbohydrates: t.carbohydrates,
        fat: t.fat,
        fiber: t.fiber,
        ingredients: t.ingredients || [],
        allergens: t.allergens || []
      });

      planObj.alternatives = {
        Breakfast: suitableTemplates.filter(t => t.mealType === 'Breakfast').map(buildSnapshot),
        Lunch: suitableTemplates.filter(t => t.mealType === 'Lunch').map(buildSnapshot),
        Dinner: suitableTemplates.filter(t => t.mealType === 'Dinner').map(buildSnapshot),
        Snack: suitableTemplates.filter(t => t.mealType === 'Snack').map(buildSnapshot)
      };

      return planObj;
    }));

    res.status(200).json({
      success: true,
      data: enrichedPlans
    });
  } catch (error) {
    console.error('Error fetching patient meal plans:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
