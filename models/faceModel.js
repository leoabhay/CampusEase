const mongoose = require('mongoose');

const faceSchema = new mongoose.Schema({
  rollno: { type: Number, required: true },
  subjectName: { type: String, required: true },
  faceId: { type: String },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Face', faceSchema);