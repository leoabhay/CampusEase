const mongoose = require('mongoose');

const RegisterSchema = new mongoose.Schema({
  name: { type: String },
  photo: { type: String },
  email: { type: String, unique: true, required: true },
  rollno: { type: Number, unique: true, sparse: true },
  address: { type: String },
  password: { type: String },
  confirmPassword: { type: String },
  role: {
    type: String,
    enum: ['student', 'faculty', 'secretary', 'admin'],
    default: 'student'
  },
  registereddate: { type: String },
  isVerified: { type: Boolean, required: true },
  
  //  forceResetPassword: { type: Boolean, default: true }
});

const Register = mongoose.model('register', RegisterSchema);

module.exports = Register;