import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getMyMealPlans } from '../controllers/patientMealPlanController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('patient'));

router.get('/', getMyMealPlans);

export default router;
