const userRegister = require('./models/signupModel');
const Message = require('./models/messageModel');
const mongoose = require('mongoose');

const userSocketMap = {};

function setupSocket(io) {
  io.on('connection', (socket) => {
    // console.log('Client connected:', socket.id);

    socket.on('register', (userId) => {
      userSocketMap[userId] = socket.id;
      // console.log(` User ${userId} registered`);

      // Broadcast current online users
      io.emit('online-users', Object.keys(userSocketMap));
    });

    socket.on('private-message', async ({ senderId, receiverId, message }) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
          return socket.emit('error', { message: 'Invalid user IDs' });
        }

        const sender = await userRegister.findById(senderId);
        const receiver = await userRegister.findById(receiverId);

        if (!sender || !receiver) return;

        // Role check
        if (
          (sender.role === 'student' && receiver.role === 'faculty') ||
          (sender.role === 'faculty' && receiver.role === 'student')
        ) {
          const newMessage = await Message.create({
            sender: senderId,
            receiver: receiverId,
            message,
            isRead: false
          });

          const receiverSocketId = userSocketMap[receiverId];

          const msgPayload = {
            _id: newMessage._id,
            senderId,
            receiverId,
            message,
            timestamp: newMessage.timestamp,
            isRead: false
          };

          if (receiverSocketId) {
            io.to(receiverSocketId).emit('private-message', msgPayload);
          }

          socket.emit('private-message', msgPayload); // echo back to sender
        } else {
          socket.emit('error', { message: 'Only students and faculty can chat' });
        }
      } catch (err) {
        console.error(' Message Error:', err);
        socket.emit('error', { message: 'Server error' });
      }
    });

    // Message read receipt
    socket.on('message-read', async ({ messageId }) => {
      try {
        const updated = await Message.findByIdAndUpdate(messageId, { isRead: true }, { new: true });

        if (updated) {
          const senderSocketId = userSocketMap[updated.sender.toString()];
          if (senderSocketId) {
            io.to(senderSocketId).emit('message-read', {
              messageId: updated._id,
              readerId: updated.receiver,
            });
          }
        }
      } catch (err) {
        console.error(' Error in message-read:', err);
      }
    });

    socket.on('disconnect', () => {
      for (const [userId, sockId] of Object.entries(userSocketMap)) {
        if (sockId === socket.id) {
          delete userSocketMap[userId];
          console.log(` User ${userId} disconnected`);
          break;
        }
      }

      io.emit('online-users', Object.keys(userSocketMap));
    });
  });
}

module.exports = setupSocket;