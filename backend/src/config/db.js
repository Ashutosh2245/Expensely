import mongoose from 'mongoose';
import { config } from './env.js';

let memServer = null;

export const connectDB = async () => {
  try {
    // If explicit URI provided and not default, or let's try connecting with a short timeout
    mongoose.set('strictQuery', false);
    
    // Check if we can connect to provided MONGODB_URI
    let uri = config.MONGODB_URI;
    
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 2000
      });
      console.log(`[Database] Connected to MongoDB at ${uri}`);
      return mongoose.connection;
    } catch (connErr) {
      console.warn(`[Database] Direct MongoDB connection failed (${connErr.message}). Starting embedded in-memory MongoDB...`);
      
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memServer = await MongoMemoryServer.create();
      uri = memServer.getUri();
      
      await mongoose.connect(uri);
      console.log(`[Database] Connected to in-memory MongoDB at ${uri}`);
      return mongoose.connection;
    }
  } catch (error) {
    console.error('[Database] Critical DB connection error:', error);
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
