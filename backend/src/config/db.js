import mongoose from 'mongoose';
import { config } from './env.js';

let memServer = null;

// Event listeners for connection monitoring
mongoose.connection.on('connected', () => {
  console.log('[Database] Mongoose successfully connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('[Database] Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[Database] Mongoose disconnected from MongoDB');
});

export const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    const isProduction = config.NODE_ENV === 'production';
    let uri = config.MONGODB_URI;

    const connectionOptions = {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    };

    if (isProduction) {
      if (!uri || uri.includes('127.0.0.1') || uri.includes('localhost')) {
        console.warn('[Database] Production mode requires a valid remote MongoDB Atlas URI in MONGODB_URI.');
      }
      console.log('[Database] Connecting to MongoDB Atlas in production mode...');
      await mongoose.connect(uri, connectionOptions);
      return mongoose.connection;
    }

    // Development / Test mode: Try provided URI, fallback to MongoMemoryServer
    try {
      await mongoose.connect(uri, connectionOptions);
      console.log(`[Database] Connected to MongoDB at ${uri}`);
      return mongoose.connection;
    } catch (connErr) {
      console.warn(`[Database] Local MongoDB unavailable (${connErr.message}). Starting embedded in-memory MongoDB...`);
      
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memServer = await MongoMemoryServer.create();
      uri = memServer.getUri();
      
      await mongoose.connect(uri);
      console.log(`[Database] Connected to in-memory MongoDB at ${uri}`);
      return mongoose.connection;
    }
  } catch (error) {
    console.error('[Database] Critical DB connection error:', error.message);
    throw error;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memServer) {
      await memServer.stop();
      memServer = null;
    }
    console.log('[Database] Disconnected cleanly');
  } catch (err) {
    console.error('[Database] Disconnect error:', err);
  }
};
