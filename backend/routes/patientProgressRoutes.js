import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getMyProgress, addProgressRecord, updateProgressRecord } from '../controllers/patientProgressController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('patient'));

router.get('/', getMyProgress);
router.post('/', addProgressRecord);
router.put('/:id', updateProgressRecord);

export default router;
