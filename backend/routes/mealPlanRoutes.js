import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getMealPlans,
  getMealPlanById,
  generateSuggestedPayload,
  getAlternativeMeals,
  saveDraft,
  updateDraft,
  approveMealPlan
} from '../controllers/mealPlanController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('doctor'));

router.route('/')
  .get(getMealPlans)
  .post(saveDraft);

router.route('/generate')
  .post(generateSuggestedPayload);

router.route('/alternatives')
  .post(getAlternativeMeals);

router.route('/:id')
  .get(getMealPlanById)
  .put(updateDraft);

router.route('/:id/approve')
  .post(approveMealPlan);

export default router;
