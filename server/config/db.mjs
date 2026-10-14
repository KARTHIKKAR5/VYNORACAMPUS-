import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vynora';

let isConnected = false;

export async function connectDB() {
  if (isConnected) return mongoose.connection;
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vynora';
  if (!process.env.MONGODB_URI) {
    console.warn('[MongoDB] MONGODB_URI not set in environment! Defaulting to local: mongodb://127.0.0.1:27017/vynora');
  }
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      autoIndex: true
    });
    isConnected = true;
    console.info(`[MongoDB] Connected to database: ${conn.connection.name} at ${conn.connection.host}`);
    return conn.connection;
  } catch (error) {
    console.error('[MongoDB] Connection error:', error.message);
    // Don't crash process in development if Mongo temporarily disconnects
    return null;
  }
}

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[MongoDB] Connection lost. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  console.info('[MongoDB] Connection restored.');
});
