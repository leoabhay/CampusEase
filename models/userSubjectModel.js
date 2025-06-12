const mongoose = require('mongoose');

const userSubjectsSchema = new mongoose.Schema({
  userEmail: { type: String },
  subjects: [{
    name: { type: String, required: true },
    credit: { type: String, required: true },
    subjectCode: { type: String, required: true }
  }]
});

const userSubjects = mongoose.model('userSubjects', userSubjectsSchema);

module.exports = userSubjects;