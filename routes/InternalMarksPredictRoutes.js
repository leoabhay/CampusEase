const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Assignment = require('../models/giveAssignmentModel');
const AnswerAssignment = require('../models/answerAssignmentModel');

const internalMarksSchema = new mongoose.Schema({
  rollno: { type: Number, required: true },
  subject: { type: String, required: true },
  assignmentMarks: { type: Number, default: 0 },
  attendanceMarks: { type: Number, default: 10 } // default static 10
});

const InternalMarks = mongoose.model('InternalMarks', internalMarksSchema);

async function calculateAndUpdateInternalMarks() {
  try {
    const totalAssignments = await Assignment.countDocuments();
    if (totalAssignments === 0) {
      console.log('No assignments found. Skipping calculation.');
      return;
    }

    const allAnswers = await AnswerAssignment.find();

    // Clear old internal marks
    await InternalMarks.deleteMany({});

    const groupedAssignments = {}; // { "rollno-subject": count }

    for (const ans of allAnswers) {
      const key = `${ans.rollno}-${ans.subject}`;
      if (!groupedAssignments[key]) groupedAssignments[key] = 0;
      groupedAssignments[key]++;
    }

    const FULL_MARKS = 50;
    const MAX_ATTENDANCE_MARKS = 10;
    const MAX_ASSIGNMENT_MARKS = FULL_MARKS - MAX_ATTENDANCE_MARKS;
    const MARKS_PER_ASSIGNMENT = MAX_ASSIGNMENT_MARKS / totalAssignments;

    for (const key of Object.keys(groupedAssignments)) {
      const [rollnoRaw, subject] = key.split('-');
      const rollno = parseInt(rollnoRaw);

      const submissionCount = groupedAssignments[key] || 0;
      const assignmentMarks = Math.min(submissionCount * MARKS_PER_ASSIGNMENT, MAX_ASSIGNMENT_MARKS);

      // Static attendance marks
      const attendanceMarks = MAX_ATTENDANCE_MARKS;

      // console.log(`Rollno: ${rollno}, Subject: ${subject}`);
      // console.log(`Assignments submitted: ${submissionCount}`);
      // console.log(`Marks - Assignments: ${assignmentMarks.toFixed(2)}, Attendance (static): ${attendanceMarks}`);

      await InternalMarks.findOneAndUpdate(
        { rollno, subject },
        {
          rollno,
          subject,
          assignmentMarks: Math.round(assignmentMarks),
          attendanceMarks
        },
        { upsert: true, new: true }
      );
    }

    // console.log('Internal marks calculation completed.');
  } catch (err) {
    console.error('Error calculating internal marks:', err);
    throw err;
  }
}

// POST to calculate internal marks
router.post('/calculate-internal-marks', async (req, res) => {
  try {
    await calculateAndUpdateInternalMarks();
    res.status(200).json({ message: 'Internal marks updated successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update internal marks.', error: err.message });
  }
});

// GET to fetch internal marks
router.get('/internal-marks', async (req, res) => {
  try {
    const data = await InternalMarks.find();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch internal marks.', error: err.message });
  }
});

module.exports = router;