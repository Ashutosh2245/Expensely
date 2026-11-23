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

    // If running in production or connecting to a remote MongoDB Atlas cluster, connect directly
    const isRemoteUri = Boolean(uri && (uri.startsWith('mongodb+srv://') || (!uri.includes('127.0.0.1') && !uri.includes('localhost'))));

    if (isProduction || isRemoteUri) {
      console.log('[Database] Connecting to MongoDB Atlas...');
      await mongoose.connect(uri, connectionOptions);
      console.log('[Database] Successfully connected to MongoDB Atlas');
      return mongoose.connection;
    }

    // Local development mode: Try provided URI, fallback to MongoMemoryServer if installed
    try {
      await mongoose.connect(uri, connectionOptions);
      console.log(`[Database] Connected to local MongoDB at ${uri}`);
      return mongoose.connection;
    } catch (connErr) {
      console.warn(`[Database] Local MongoDB unavailable (${connErr.message}). Attempting in-memory database...`);
      
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memServer = await MongoMemoryServer.create();
        uri = memServer.getUri();
        
        await mongoose.connect(uri);
        console.log(`[Database] Connected to in-memory MongoDB at ${uri}`);
        return mongoose.connection;
      } catch (importErr) {
        throw new Error(`Failed to connect to local MongoDB (${connErr.message}) and mongodb-memory-server is not available (${importErr.message}).`);
      }
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
