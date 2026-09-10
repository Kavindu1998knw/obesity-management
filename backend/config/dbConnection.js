import mongoose from 'mongoose';

let isConnecting = false;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  if (isConnecting) {
    return;
  }
  isConnecting = true;

  const primaryUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const localFallbackUri = 'mongodb://127.0.0.1:27017/obesity_management_db';

  if (!primaryUri) {
    isConnecting = false;
    throw new Error('MONGODB_URI environment variable is missing');
  }

  try {
    await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log('MongoDB connected successfully');
    return;
  } catch (err) {
    try {
      await mongoose.connect(localFallbackUri, {
        serverSelectionTimeoutMS: 3000,
      });
      console.log('MongoDB connected successfully (Local)');
    } catch (localErr) {
      console.error('MongoDB connection error:', err.message);
      throw err;
    }
  } finally {
    isConnecting = false;
  }
};

export default connectDB;
