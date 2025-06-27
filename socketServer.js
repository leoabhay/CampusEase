// socketServer.js
const userRegister = require('./models/signupModel');
const Message = require('./models/messageModel');
const mongoose = require('mongoose');

const userSocketMap = {};

function setupSocket(io) {
  io.on('connection', (socket) => {
    // console.log(`Socket connected: ${socket.id}`);
    console.log('A client connected with socket id:', socket.id);

    socket.on('register', (userId) => {
      userSocketMap[userId] = socket.id;
      console.log(`User ${userId} registered with socket ${socket.id}`);
    });

    socket.on('private-message', async ({ senderId, receiverId, message }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
      socket.emit('error', { message: 'Invalid user IDs' });
      return;
    }
        const sender = await userRegister.findById(senderId);
        const receiver = await userRegister.findById(receiverId);

        if (!sender || !receiver) return;

        // Allow only student <-> faculty communication
        if (
          (sender.role === 'student' && receiver.role === 'faculty') ||
          (sender.role === 'faculty' && receiver.role === 'student')
        ) {
          const newMessage = await Message.create({ sender: senderId, receiver: receiverId, message });

          const receiverSocketId = userSocketMap[receiverId];
          if (receiverSocketId) {
            io.to(receiverSocketId).emit('private-message', {
              senderId,
              message,
              timestamp: newMessage.timestamp,
            });
          }

          // Echo message back to sender
          socket.emit('private-message', {
            senderId,
            message,
            timestamp: newMessage.timestamp,
          });
        } else {
          socket.emit('error', { message: 'Only students and faculty can chat' });
        }
      } catch (err) {
        console.error(err);
        socket.emit('error', { message: 'Server error' });
      }
    });

    socket.on('disconnect', () => {
      for (const [userId, sockId] of Object.entries(userSocketMap)) {
        if (sockId === socket.id) {
          delete userSocketMap[userId];
          break;
        }
      }
    //   console.log(`Socket disconnected: ${socket.id}`);
    console.log('Client disconnected:', socket.id);
    });
  });
}

module.exports = setupSocket;