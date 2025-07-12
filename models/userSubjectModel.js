const mongoose = require('mongoose');

const userSubjectsSchema = new mongoose.Schema({
  userEmail: { type: String },
  subjects: [{ name: String, credit: String, code: String }],
});

module.exports = mongoose.model('UserSubjects', userSubjectsSchema);