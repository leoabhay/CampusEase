const mongoose = require('mongoose');

const FeeSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'register',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  method: {
    type: String,
    enum: ['Cash', 'Card', 'Online', 'QR'],
    required: true
  },
  status: {
    type: String,
    enum: ['Paid', 'Pending', 'Unpaid', 'Rejected'],
    default: 'Unpaid'
  },
  receiptNumber: {
    type: String,
    required: true,
    unique: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Fee', FeeSchema);