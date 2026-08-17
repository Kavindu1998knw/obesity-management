import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getPatientAppointments,
  createPatientAppointment,
  reschedulePatientAppointment,
  cancelPatientAppointment
} from '../controllers/appointmentController.js';

const router = express.Router();

// Apply JWT authentication and patient authorization to all these routes
router.use(protect);
router.use(authorize('patient'));

router.get('/', getPatientAppointments);
router.post('/', createPatientAppointment);
router.put('/:id/reschedule', reschedulePatientAppointment);
router.patch('/:id/cancel', cancelPatientAppointment);

export default router;
