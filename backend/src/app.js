import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import friendRoutes from './routes/friendRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import invitationRoutes from './routes/invitationRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import balanceRoutes from './routes/balanceRoutes.js';
import settlementRoutes from './routes/settlementRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

export function createApp() {
  const app = express();

  // Trust proxy for Render / Vercel reverse proxy headers
  app.set('trust proxy', 1);

  // Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows cross-origin asset loading & Vite dev
      crossOriginEmbedderPolicy: false
    })
  );

  // Ensure uploads directory exists for local fallback
  const uploadDir = path.resolve('uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Production CORS Configuration: Explicit origin matching
  const allowedOrigins = [
    config.FRONTEND_URL,
    config.CLIENT_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000'
  ].filter(Boolean);

  app.use(
    cors({
      origin: function (origin, callback) {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);

        // Allow configured origins or Vercel preview deployments
        const isAllowed =
          allowedOrigins.includes(origin) ||
          origin.endsWith('.vercel.app') ||
          origin.startsWith('http://localhost:');

        if (isAllowed) {
          callback(null, true);
        } else {
          callback(new Error(`CORS blocked for origin: ${origin}`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    })
  );

  // Request body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Basic request logger in development & production
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (req.originalUrl !== '/api/health') {
        console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
      }
    });
    next();
  });

  // Auth Rate Limiter
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many authentication attempts, please try again later.' }
  });

  // Static uploads directory (for local file fallback)
  app.use('/uploads', express.static(uploadDir));

  // Health check endpoint (Strictly formatted as required)
  app.get('/api/health', (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    res.status(isDbConnected ? 200 : 503).json({
      status: isDbConnected ? 'ok' : 'degraded',
      service: 'expensely-api',
      database: isDbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  });

  // API Routes
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/friends', friendRoutes);
  app.use('/api/groups', groupRoutes);
  app.use('/api/invitations', invitationRoutes);
  app.use('/api/expenses', expenseRoutes);
  app.use('/api/balances', balanceRoutes);
  app.use('/api/settlements', settlementRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/activities', activityRoutes);
  app.use('/api/uploads', uploadRoutes);

  // Serve Frontend Production Build if present
  const frontendDist = path.resolve('../frontend/dist');
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
        return next();
      }
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  } else {
    // 404 Route handler for API
    app.use('/api/*', (req, res) => {
      res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
    });
  }

  // Centralized Global error handler
  app.use((err, req, res, next) => {
    console.error('[App Error]', err.stack || err.message || err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal Server Error'
    });
  });

  return app;
}
