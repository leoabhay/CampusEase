const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'register' },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'register' },
  message: String,
  isRead: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);