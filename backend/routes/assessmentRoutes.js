import express from 'express';
import { getAssessments, getAssessmentById, predictObesity, saveAssessment } from '../controllers/assessmentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply middleware to all routes in this file
router.use(protect);
router.use(authorize('doctor'));

// GET /api/doctor/assessments
router.route('/')
  .get(getAssessments);

// POST /api/doctor/assessments/predict
router.route('/predict')
  .post(predictObesity);

// POST /api/doctor/assessments/save
router.route('/save')
  .post(saveAssessment);

// GET /api/doctor/assessments/:id
router.route('/:id')
  .get(getAssessmentById);

export default router;
