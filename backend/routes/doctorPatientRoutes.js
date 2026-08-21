import express from 'express';
import { 
  getMyPatients, 
  getPatientDetails, 
  updateHealthDetails, 
  addPatientNote, 
  updatePatientNote 
} from '../controllers/doctorPatientController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply middleware to all routes in this file
router.use(protect);
router.use(authorize('doctor'));

// GET /api/doctor/patients
router.route('/')
  .get(getMyPatients);

// GET /api/doctor/patients/:id
// PUT /api/doctor/patients/:id/health-details
router.route('/:id')
  .get(getPatientDetails);

router.route('/:id/health-details')
  .put(updateHealthDetails);

// POST /api/doctor/patients/:id/notes
router.route('/:id/notes')
  .post(addPatientNote);

// PUT /api/doctor/patients/:id/notes/:noteId
router.route('/:id/notes/:noteId')
  .put(updatePatientNote);

export default router;
