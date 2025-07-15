const mongoose = require('mongoose');

const academicSchema = new mongoose.Schema({
  rollno: {
    type: String,
    required: true
  },
  semester: {
    type: String,
    required: true
  },
  subjects: [{
    subjectName: String,
    grade: String,
    internalMarks: Number
  }],
  GPA: {
    type: Number
  },
}, { timestamps: true });

const Academic = mongoose.model('Academic', academicSchema);

module.exports = Academic;