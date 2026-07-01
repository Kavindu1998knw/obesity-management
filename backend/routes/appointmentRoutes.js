import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  createAppointment,
  getAppointments,
  updateAppointment,
  deleteAppointment,
  approveAppointment,
  rejectAppointment
} from '../controllers/appointmentController.js';

const router = express.Router();

// Apply JWT authentication to all appointment routes
router.use(protect);

router.get('/', getAppointments);
router.post('/', authorize('admin'), createAppointment);
router.put('/:id', authorize('admin'), updateAppointment);
router.delete('/:id', authorize('admin'), deleteAppointment);
router.patch('/:id/approve', authorize('admin'), approveAppointment);
router.patch('/:id/reject', authorize('admin'), rejectAppointment);

export default router;
