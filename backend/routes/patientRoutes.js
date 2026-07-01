import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  activatePatient,
  deactivatePatient
} from '../controllers/patientController.js';

const router = express.Router();

// Apply JWT authentication to all patient routes
router.use(protect);

router.get('/', getPatients);
router.get('/:id', getPatientById);

router.post('/', authorize('admin'), createPatient);
router.put('/:id', authorize('admin'), updatePatient);
router.delete('/:id', authorize('admin'), deletePatient);
router.patch('/:id/activate', authorize('admin'), activatePatient);
router.patch('/:id/deactivate', authorize('admin'), deactivatePatient);

export default router;
