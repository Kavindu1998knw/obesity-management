import express from 'express';
import { 
  getDoctors, getDoctorDetails, createDoctor, updateDoctor, toggleDoctorStatus, deleteDoctor,
  getPatients, getPatientDetails, togglePatientStatus, deletePatient, assignDoctorToPatient,
  getAppointments, updateAppointmentStatus, rescheduleAppointment,
  generateReport
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Doctor Management Routes
router.route('/doctors')
  .get(getDoctors)
  .post(createDoctor);

router.route('/doctors/:id')
  .get(getDoctorDetails)
  .put(updateDoctor)
  .delete(deleteDoctor);

router.route('/doctors/:id/status')
  .patch(toggleDoctorStatus);

// =======================
// PATIENTS
// =======================
router.route('/patients')
  .get(getPatients);

router.route('/patients/:id')
  .get(getPatientDetails)
  .delete(deletePatient);

router.route('/patients/:id/status')
  .patch(togglePatientStatus);

router.route('/patients/:id/assign-doctor')
  .patch(assignDoctorToPatient);

// =======================
// APPOINTMENTS
// =======================
router.route('/appointments')
  .get(getAppointments);

router.route('/appointments/:id/status')
  .patch(updateAppointmentStatus);

router.route('/appointments/:id/reschedule')
  .put(rescheduleAppointment);

// =======================
// REPORTS
// =======================
router.route('/reports/generate')
  .post(generateReport);

export default router;
