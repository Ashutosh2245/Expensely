import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import { Group } from '../models/Group.js';

let io = null;

export function initSocketIO(httpServer, clientOrigin) {
  io = new Server(httpServer, {
    cors: {
      origin: clientOrigin || '*',
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      credentials: true
    }
  });

  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication required for socket connection'));
      }

      const decoded = verifyAccessToken(token);
      if (!decoded || !decoded.userId) {
        return next(new Error('Invalid socket authentication token'));
      }

      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Socket authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    // Join private user room for targeted notifications
    socket.join(`user:${userId}`);

    // Join group room with authorization check
    socket.on('join:group', async (groupId) => {
      try {
        if (!groupId) return;
        const group = await Group.findById(groupId);
        if (!group) {
          socket.emit('error', { message: 'Group not found' });
          return;
        }

        const isMember = group.members.some((m) => m.user.toString() === userId);
        if (isMember) {
          socket.join(`group:${groupId}`);
          socket.emit('joined:group', { groupId });
        } else {
          socket.emit('error', { message: 'Unauthorized: Not a member of this group' });
        }
      } catch (err) {
        socket.emit('error', { message: 'Failed to join group room' });
      }
    });

    socket.on('leave:group', (groupId) => {
      if (groupId) {
        socket.leave(`group:${groupId}`);
      }
    });

    socket.on('disconnect', () => {
      // Clean up
    });
  });

  return io;
}

export function getIO() {
  return io;
}

export function emitToGroup(groupId, event, data) {
  if (io && groupId) {
    io.to(`group:${groupId.toString()}`).emit(event, data);
  }
}

export function emitToUser(userId, event, data) {
  if (io && userId) {
    io.to(`user:${userId.toString()}`).emit(event, data);
  }
}
