import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Auth routes
app.use('/api/auth', authRoutes);

// Basic test route
app.get('/', (req, res) => {
  res.json({ message: 'Backend Running Successfully' });
});

const PORT = process.env.PORT || 5000;

// Connect to Database first, then start server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server Running on Port ${PORT}`);
  });
};

startServer();
