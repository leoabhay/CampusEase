const mongoose = require('mongoose');

const classScheduleSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'register',
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'depatmentList',
    required: true
  },
  day: {
    type: String,
    required: true
  },
  block: {
    type: String
  },
  date:{
    type: Date,
    required: true
  },
  timeFrom: {
    type: String,
    required: true
  },
  timeTo: {
    type: String,
    required: true
  },
  roomNo: {
    type: String
  },
  semester: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ClassSchedule', classScheduleSchema);