const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String},
  email: { type: String, required: true, unique: true },
  otp: { type: String, required: true },
  otpExpiration: { type: Date},
  date: { type: String, default: new Date().toLocaleDateString() },
  present: { type: Boolean, default: false },
  latitude: { type: Number },
  longitude: { type: Number }
});

const Students = mongoose.model('student', studentSchema);

module.exports = Students;