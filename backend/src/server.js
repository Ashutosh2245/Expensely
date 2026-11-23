import http from 'http';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { initSocketIO } from './sockets/socketHandler.js';
import { config } from './config/env.js';

async function bootstrap() {
  try {
    // Connect to database
    await connectDB();

    const app = createApp();
    const server = http.createServer(app);

    // Initialize Socket.io
    initSocketIO(server, config.CLIENT_URL);

    server.listen(config.PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 EXPENSELY Backend Server running on port ${config.PORT}`);
      console.log(`📡 Socket.io initialized for real-time events`);
      console.log(`🌐 API endpoint: http://localhost:${config.PORT}/api/health`);
      console.log(`===============================================`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('Shutting down server...');
      server.close(() => process.exit(0));
    });
  } catch (error) {
    console.error('Fatal initialization error:', error);
    process.exit(1);
  }
}

bootstrap();
