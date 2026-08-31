import mongoose from 'mongoose';
import dns from 'dns';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (dnsErr) {
  console.warn('DNS server configuration warning:', dnsErr.message);
}

let isConnecting = false;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  if (isConnecting) {
    return;
  }
  isConnecting = true;
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is missing in backend/.env');
    }
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
    console.error('👉 MongoDB Atlas IP Whitelist check: Go to MongoDB Atlas (cloud.mongodb.com) -> Security -> Network Access -> Add IP Address -> Allow Access From Anywhere (0.0.0.0/0).');
    throw err;
  } finally {
    isConnecting = false;
  }
};

export default connectDB;
