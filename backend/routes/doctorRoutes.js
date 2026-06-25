import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
  activateDoctor,
  deactivateDoctor
} from '../controllers/doctorController.js';

const router = express.Router();

// Apply JWT authentication to all doctor routes
router.use(protect);

// Allow read access to authenticated users
router.get('/', getDoctors);
router.get('/:id', getDoctorById);

// Restrict write access and status changes to Admin accounts
router.post('/', authorize('admin'), createDoctor);
router.put('/:id', authorize('admin'), updateDoctor);
router.delete('/:id', authorize('admin'), deleteDoctor);
router.patch('/:id/activate', authorize('admin'), activateDoctor);
router.patch('/:id/deactivate', authorize('admin'), deactivateDoctor);

export default router;
