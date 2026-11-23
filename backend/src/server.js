import http from 'http';
import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initSocketIO } from './sockets/socketHandler.js';
import { config } from './config/env.js';

// Top-level unhandled exception / rejection safety
process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process] Unhandled Rejection at:', promise, 'reason:', reason);
});

async function bootstrap() {
  try {
    console.log('[Bootstrap] Initializing database connection...');
    // Ensure DB connection succeeds before accepting any traffic
    await connectDB();

    const app = createApp();
    const server = http.createServer(app);

    // Initialize Socket.io with configured frontend origin
    initSocketIO(server, config.FRONTEND_URL);

    const port = config.PORT;
    const host = '0.0.0.0';

    server.listen(port, host, () => {
      console.log(`=======================================================`);
      console.log(`🚀 EXPENSELY API Server running at http://${host}:${port}`);
      console.log(`📡 WebSocket Gateway ready with authenticated rooms`);
      console.log(`🩺 Health check available at http://${host}:${port}/api/health`);
      console.log(`🔒 Environment: ${config.NODE_ENV}`);
      console.log(`=======================================================`);
    });

    // Graceful Shutdown Handler
    const shutdown = async (signal) => {
      console.log(`\n[Process] ${signal} signal received: closing HTTP server...`);
      server.close(async () => {
        console.log('[Process] HTTP server closed.');
        try {
          await disconnectDB();
          console.log('[Process] Clean shutdown complete.');
          process.exit(0);
        } catch (err) {
          console.error('[Process] Error during database disconnect:', err);
          process.exit(1);
        }
      });

      // Force shutdown if connections do not close in 10s
      setTimeout(() => {
        console.error('[Process] Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('[Bootstrap] Fatal startup error:', error.message);
    process.exit(1);
  }
}

bootstrap();
