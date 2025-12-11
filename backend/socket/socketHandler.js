const Message = require('../models/Message');
const Room = require('../models/Room');

module.exports = (io) => {
  // Store room participants and their socket IDs
  const roomParticipants = new Map(); // roomId -> Set of socket IDs
  const userSocketMap = new Map(); // userId -> socket ID

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // Join a room
    socket.on('join-room', async ({ roomId, userId, username }) => {
      try {
        socket.join(roomId);

        // Store participant info
        if (!roomParticipants.has(roomId)) {
          roomParticipants.set(roomId, new Set());
        }
        roomParticipants.get(roomId).add(socket.id);
        userSocketMap.set(userId, socket.id);

        // Store room and user info on socket
        socket.roomId = roomId;
        socket.userId = userId;
        socket.username = username;

        // Update room participants in database
        await Room.findByIdAndUpdate(roomId, {
          $addToSet: { participants: userId }
        });

        // Notify others in the room
        socket.to(roomId).emit('user-joined', {
          userId,
          username,
          socketId: socket.id
        });

        // Send current participants to the new user
        const participants = Array.from(roomParticipants.get(roomId) || [])
          .filter(id => id !== socket.id)
          .map(id => {
            const participantSocket = io.sockets.sockets.get(id);
            return {
              socketId: id,
              username: participantSocket ? participantSocket.username : 'Unknown'
            };
          });
        socket.emit('existing-participants', participants);

        console.log(`👤 ${username} joined room ${roomId}`);
      } catch (error) {
        console.error('Join room error:', error);
      }
    });

    // Handle request for participants (for late joiners or after media ready)
    socket.on('request-participants', ({ roomId }) => {
      const participants = Array.from(roomParticipants.get(roomId) || [])
        .filter(id => id !== socket.id)
        .map(id => {
          const participantSocket = io.sockets.sockets.get(id);
          return {
            socketId: id,
            username: participantSocket ? participantSocket.username : 'Unknown'
          };
        });
      socket.emit('existing-participants', participants);
    });

    // Handle chat messages
    socket.on('chat-message', async ({ roomId, userId, username, content }) => {
      try {
        // Save message to database
        const message = new Message({
          room: roomId,
          user: userId,
          username,
          content
        });
        await message.save();

        // Broadcast message to all in room
        io.to(roomId).emit('chat-message', {
          id: message._id,
          username,
          content,
          timestamp: message.timestamp
        });

        console.log(`💬 Message in room ${roomId} from ${username}`);
      } catch (error) {
        console.error('Chat message error:', error);
      }
    });

    // WebRTC Signaling - Send offer
    socket.on('video-offer', ({ offer, to }) => {
      socket.to(to).emit('video-offer', {
        offer,
        from: socket.id,
        username: socket.username
      });
    });

    // WebRTC Signaling - Send answer
    socket.on('video-answer', ({ answer, to }) => {
      socket.to(to).emit('video-answer', {
        answer,
        from: socket.id,
        username: socket.username
      });
    });

    // WebRTC Signaling - ICE candidate
    socket.on('ice-candidate', ({ candidate, to }) => {
      socket.to(to).emit('ice-candidate', {
        candidate,
        from: socket.id,
        username: socket.username
      });
    });

    // Document collaboration - Update
    socket.on('document-update', ({ roomId, content }) => {
      // Broadcast to others in room
      socket.to(roomId).emit('document-update', { content });
    });

    // Document collaboration - Save to DB
    socket.on('document-save', async ({ roomId, content }) => {
      try {
        await Room.findByIdAndUpdate(roomId, {
          documentContent: content
        });
        console.log(`📄 Document saved for room ${roomId}`);
      } catch (error) {
        console.error('Document save error:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const roomId = socket.roomId;
      const username = socket.username;

      if (roomId && roomParticipants.has(roomId)) {
        roomParticipants.get(roomId).delete(socket.id);

        // Notify others that user left
        socket.to(roomId).emit('user-left', {
          socketId: socket.id,
          username
        });

        console.log(`👋 ${username || 'User'} left room ${roomId}`);
      }

      // Clean up
      if (socket.userId) {
        userSocketMap.delete(socket.userId);
      }

      console.log(`❌ User disconnected: ${socket.id}`);
    });

    // Leave room explicitly
    socket.on('leave-room', ({ roomId }) => {
      socket.leave(roomId);

      if (roomParticipants.has(roomId)) {
        roomParticipants.get(roomId).delete(socket.id);
      }

      socket.to(roomId).emit('user-left', {
        socketId: socket.id,
        username: socket.username
      });
    });
  });
};
