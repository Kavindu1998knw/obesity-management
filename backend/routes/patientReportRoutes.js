import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { generatePatientReport } from '../controllers/patientReportController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('patient'));

router.get('/generate', generatePatientReport);

export default router;
