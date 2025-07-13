const { io } = require('socket.io-client');

const socket = io('http://localhost:3200', {
  path: '/socket.io',
  forceNew: true,
  reconnectionAttempts: 3,
  timeout: 2000,
});

socket.on('connect', () => {
  console.log('Connected to server:', socket.id);

  // Register the user (use a real user ID from your DB)
  socket.emit('register', '685509e7435017a1f16dfdf7');

  // Test sending a message
  socket.emit('private-message', {
    senderId: '685509e7435017a1f16dfdf7',
    receiverId: '685509a3435017a1f16dfdee',
    message: 'Hello from student!'
  });
});

socket.on('private-message', (data) => {
  console.log('New message:', data);
});

socket.on('error', (err) => {
  console.log('Error:', err);
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});