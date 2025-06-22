const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: String,
  email: String,
  otp: String,
  otpExpiration: Date,
  date: String,
  present: { type: Boolean, default: false },
  latitude: Number,
  longitude: Number
});

const Students = mongoose.model('student', studentSchema);
module.exports = Students;
