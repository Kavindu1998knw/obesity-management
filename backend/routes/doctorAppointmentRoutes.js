import express from 'express';
import { getMyAppointments, completeAppointment } from '../controllers/doctorAppointmentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply middleware to all routes in this file
router.use(protect);
router.use(authorize('doctor'));

// GET /api/doctor/appointments
router.route('/')
  .get(getMyAppointments);

// PUT /api/doctor/appointments/:id/complete
router.route('/:id/complete')
  .put(completeAppointment);

export default router;
