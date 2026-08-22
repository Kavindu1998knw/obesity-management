import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/dbConnection.js';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import doctorPatientRoutes from './routes/doctorPatientRoutes.js';
import doctorAppointmentRoutes from './routes/doctorAppointmentRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import mealPlanRoutes from './routes/mealPlanRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import patientAppointmentRoutes from './routes/patientAppointmentRoutes.js';
import patientAssessmentRoutes from './routes/patientAssessmentRoutes.js';
import patientMealPlanRoutes from './routes/patientMealPlanRoutes.js';
import patientProgressRoutes from './routes/patientProgressRoutes.js';
import patientReportRoutes from './routes/patientReportRoutes.js';
import { swaggerUi, swaggerSpec, swaggerUiOptions } from './docs/swagger.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is missing.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Swagger API Documentation UI & Spec
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpec);
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctor/patients', doctorPatientRoutes);
app.use('/api/doctor/appointments', doctorAppointmentRoutes);
app.use('/api/doctor/assessments', assessmentRoutes);
app.use('/api/doctor/meal-plans', mealPlanRoutes);
app.use('/api/doctor/reports', reportRoutes);
app.use('/api/patient/appointments', patientAppointmentRoutes);
app.use('/api/patient/assessments', patientAssessmentRoutes);
app.use('/api/patient/meal-plans', patientMealPlanRoutes);
app.use('/api/patient/progress', patientProgressRoutes);
app.use('/api/patient/reports', patientReportRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
  });
};

start();

