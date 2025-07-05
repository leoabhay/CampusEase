const mongoose = require('mongoose');

const idCardSchema = new mongoose.Schema({
  name: String,
  email: String,
  rollno: String,
  semester: String,
  contactNo: String,
  department: String,
  reason: String,
  photo: String,
  isPaid: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('IdCard', idCardSchema);
