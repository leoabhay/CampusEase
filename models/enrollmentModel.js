const mongoose = require('mongoose');
const enrollmentSchema = new mongoose.Schema({
    enrollment_key: { type: String, required: true },
    semester: { type: String, required: true },
    department: { type: String, required: true },
    subjects: [{
      name: {
        type: String,
        required: true
      },
      credit: {
        type: String,
        required: true
      },
      code: {
        type: String,
        required: true
      },
      teacher:{
        type: String,
        required: true 
      },
    }],
   
  });
  const EnrollmentSubjects = mongoose.model('EnrollmentSubjects', enrollmentSchema);
  module.exports = EnrollmentSubjects;