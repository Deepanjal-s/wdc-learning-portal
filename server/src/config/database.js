import mongoose from 'mongoose';

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('MONGODB_URI is not set; starting API without a database connection.');
    return false;
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    autoIndex: process.env.NODE_ENV !== 'production',
  });
  console.log(`MongoDB connected (${mongoose.connection.host})`);
  return true;
}

export function getDatabaseStatus() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] || 'unknown';
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
