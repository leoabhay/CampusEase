const mongoose = require('mongoose');

const internalMarksSchema = new mongoose.Schema({
  rollno: { type: Number, required: true },
  subject: { type: String, required: true },
  assignmentMarks: { type: Number, default: 0 }, // Marks from assignments
  attendanceMarks: { type: Number, default: 0 }   // Marks from attendance
});

// Check if model exists, else create it
const InternalMarks = mongoose.models.InternalMarks || mongoose.model('InternalMarks', internalMarksSchema);

module.exports = InternalMarks;