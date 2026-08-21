import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { 
  getMyAppointments, 
  getActiveDoctors, 
  requestAppointment, 
  cancelAppointment 
} from '../controllers/patientAppointmentController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('patient'));

router.get('/', getMyAppointments);
router.get('/doctors', getActiveDoctors);
router.post('/', requestAppointment);
router.put('/:id/cancel', cancelAppointment);

export default router;
