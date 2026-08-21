import express from 'express';
import { getAdminDashboard, getDoctorDashboard, getPatientDashboard } from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/admin', protect, authorize('admin'), getAdminDashboard);
router.get('/doctor', protect, authorize('doctor'), getDoctorDashboard);
router.get('/patient', protect, authorize('patient'), getPatientDashboard);

export default router;
