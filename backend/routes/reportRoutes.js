import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getAssignedPatients, generateReport } from '../controllers/reportController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('doctor'));

router.get('/patients', getAssignedPatients);
router.get('/generate', generateReport);

export default router;
