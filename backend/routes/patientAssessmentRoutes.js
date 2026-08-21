import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getMyAssessments } from '../controllers/patientAssessmentController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('patient'));

router.get('/', getMyAssessments);

export default router;
