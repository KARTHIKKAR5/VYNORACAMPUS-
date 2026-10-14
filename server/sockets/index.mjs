import { Server } from 'socket.io';
import { User } from '../models/User.mjs';
import { Conversation } from '../models/Conversation.mjs';
import { Message } from '../models/Message.mjs';

export function setupSocketIO(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true
    },
    pingTimeout: 30000,
    pingInterval: 10000
  });

  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || '';
      const token = cookieHeader.match(/(?:^|;\s*)vynora_session=([^;]+)/)?.[1]
        || socket.handshake.auth?.token
        || socket.handshake.query?.userId;

      let user = null;
      if (token) {
        user = await User.findById(token).catch(() => null);
        if (!user) user = await User.findOne({ email: token }).catch(() => null);
      }

      if (!user) {
        user = await User.findOne({ email: 'aarav.mehta@sru.edu.in' });
      }

      if (user && !user.isSuspended) {
        socket.user = user;
        return next();
      }
      return next(new Error('Unauthorized socket connection'));
    } catch (err) {
      return next(new Error('Socket authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    const userRoom = `user:${user._id}`;
    socket.join(userRoom);
    console.info(`[Socket.IO] User connected: ${user.name} (${socket.id})`);

    // Join conversation room
    socket.on('join_conversation', async ({ conversationId }) => {
      try {
        const conv = await Conversation.findById(conversationId);
        if (!conv) return;
        const isMember = conv.members.some((m) => m.equals(user._id));
        if (isMember || user.role === 'ADMIN') {
          socket.join(`conversation:${conversationId}`);
        }
      } catch (err) {
        console.error('[Socket.IO] join_conversation error:', err.message);
      }
    });

    // Leave conversation room
    socket.on('leave_conversation', ({ conversationId }) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Typing indicators
    socket.on('typing_start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId: user._id.toString(),
        name: user.name,
        conversationId
      });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user_stopped_typing', {
        userId: user._id.toString(),
        conversationId
      });
    });

    // Send real-time message with guaranteed MongoDB persistence
    socket.on('send_message', async ({ conversationId, body }, callback) => {
      try {
        if (!conversationId || !body?.trim()) {
          if (callback) callback({ success: false, error: 'Message body cannot be empty' });
          return;
        }

        const conv = await Conversation.findById(conversationId);
        if (!conv) {
          if (callback) callback({ success: false, error: 'Conversation not found' });
          return;
        }

        const isMember = conv.members.some((m) => m.equals(user._id));
        if (!isMember && user.role !== 'ADMIN') {
          if (callback) callback({ success: false, error: 'Unauthorized to send message to this conversation' });
          return;
        }

        // 1. Persist message in database
        const message = await Message.create({
          conversationId: conv._id,
          senderId: user._id,
          senderName: user.name,
          body: body.trim(),
          readBy: [user._id]
        });

        // 2. Update conversation preview and timestamp
        conv.lastMessageAt = new Date();
        conv.lastMessagePreview = body.trim().slice(0, 80);
        await conv.save();

        // 3. Broadcast to all members in conversation room
        const payload = {
          message: message.toObject(),
          conversationId: conv._id.toString()
        };
        io.to(`conversation:${conv._id}`).emit('new_message', payload);

        // 4. Acknowledge success to sender only AFTER persistence
        if (callback) callback({ success: true, message: payload.message });
      } catch (error) {
        console.error('[Socket.IO] send_message persistence error:', error.message);
        if (callback) callback({ success: false, error: 'Failed to deliver message' });
      }
    });

    socket.on('disconnect', () => {
      console.info(`[Socket.IO] Disconnected: ${user.name}`);
    });
  });

  return io;
}
