const mongoose = require('mongoose');

const answerAssignmentSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  assignment: { type: String },
  assignmentFile: { type: String },
  rollno: { type: Number },
  submitteddate: { type: Date },
});

// Check if model already exists before creating it
const Answer_Assignment = mongoose.models.answer_assignment || mongoose.model('answer_assignment', answerAssignmentSchema);

module.exports = Answer_Assignment;
