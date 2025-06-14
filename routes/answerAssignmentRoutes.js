const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const verifyToken = require('../middlewares/middleware');
const answerAssignment = require('../models/answerAssignmentModel');
const giveAssignmentModel = require('../models/giveAssignmentModel');
const Signup = require('../models/userModel');
const Enrollment = require('../models/enrollmentModel');
const UserSubjects = require('../models/userSubjectModel');
const Students = require('../models/otpModel');

// Multer Configuration
// Define the upload path
const uploadPath = path.join(__dirname, '../uploads/answerAssignments');

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.mkdir(uploadPath, { recursive: true });
    console.log(`Upload directory ensured at: ${uploadPath}`);
  } catch (err) {
    console.error('Failed to create upload directory:', err);
  }
}
ensureUploadDir();

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Submit a new assignment
router.post('/postAnswerAssignment', verifyToken, upload.single("assignmentFile"), async (req, res) => {
  try {
    const { rollno } = req.user;
    const { subject, assignment } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const existingAssignment = await giveAssignmentModel.findOne({ assignmentName: assignment });
    if (!existingAssignment) return res.status(404).json({ error: 'Assignment not found' });

    const alreadySubmitted = await answerAssignment.findOne({ rollno, subject, assignment });
    if (alreadySubmitted) return res.status(409).json({ error: 'Assignment already submitted' });

    const dueDate = new Date(existingAssignment.dueDate);
    const submittedDate = Date.now();

    const newAssignment = new answerAssignment({
      subject,
      assignment,
      assignmentFile: `http://localhost:3200/uploads/assignments/${file.filename}`,
      rollno,
      submitteddate: submittedDate
    });

    await newAssignment.save();
    const status = submittedDate <= dueDate ? 'Submitted on Time' : 'Submitted Late';

    console.log(`Assignment submitted by rollno ${rollno}`);
    res.status(201).json({ message: 'Assignment submitted successfully.', newAssignment, status });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get all answered assignments
router.get('/getassignments', async (req, res) => {
  try {
    const assignments = await answerAssignment.find();
    res.status(200).json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get a single assignment by ID
router.get('/getassignments/:id', async (req, res) => {
  try {
    const assignment = await answerAssignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    res.status(200).json(assignment);
  } catch (error) {
    console.error('Error fetching assignment by ID:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

/**
 * GET /getassignmentsbyemail
 * Get assignments submitted by a student using email from token
 */
router.get('/getassignmentsbyemail', verifyToken, async (req, res) => {
  try {
    const { email } = req.user;
    const user = await Signup.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const assignments = await answerAssignment.find({ rollno: user.rollno });
    if (!assignments.length) return res.status(404).json({ message: 'No assignments found' });

    const assignmentsWithStatus = await Promise.all(assignments.map(async (assignment) => {
      const given = await giveAssignmentModel.findOne({ assignmentName: assignment.assignment });
      if (given) {
        const dueDate = new Date(given.dueDate);
        const submittedDate = new Date(assignment.submitteddate);
        assignment.status = submittedDate <= dueDate ? 'Submitted on Time' : 'Submitted Late';
      } else {
        assignment.status = 'Assignment details not found';
      }
      return assignment;
    }));

    res.status(200).json({ assignments: assignmentsWithStatus });
  } catch (error) {
    console.error('Error fetching assignments by email:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

/**
 * GET /getassignmentsbysubject
 * Get assignments submitted for subjects handled by the logged-in teacher
 */
router.get('/getassignmentsbysubject', verifyToken, async (req, res) => {
  try {
    const { email } = req.user;
    const user = await Signup.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const enrollment = await Enrollment.findOne({ "subjects.teacher": email });
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });

    const subjectsTaught = enrollment.subjects
      .filter(sub => sub.teacher === email)
      .map(sub => sub.name);

    if (!subjectsTaught.length) return res.status(404).json({ message: 'No subjects assigned to this teacher' });

    const assignments = await answerAssignment.find({ subject: { $in: subjectsTaught } });
    if (!assignments.length) return res.status(404).json({ message: 'No assignments found' });

    res.status(200).json({ assignments });
  } catch (error) {
    console.error('Error fetching assignments by subject:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Update an assignment record by ID
router.put('/putassignments/:id', upload.single('assignmentFile'), async (req, res) => {
  try {
    const { subject, assignment, rollno, remarks } = req.body;
    const updateData = { subject, assignment, rollno, remarks };
    if (req.file) {
      updateData.assignmentFile = `http://localhost:3200/uploads/assignments/${req.file.filename}`;
    }

    const updatedAssignment = await answerAssignment.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedAssignment) return res.status(404).json({ message: 'Assignment not found' });

    res.status(200).json(updatedAssignment);
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Delete an assignment by ID
router.delete('/delassignments/:id', async (req, res) => {
  try {
    const deleted = await answerAssignment.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Assignment not found' });

    res.status(200).json({ message: 'Assignment deleted', deletedAssignment: deleted });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

/**
 * GET /students/search
 * Filter students by name, email or roll number
 */
router.get('/students/search', verifyToken, async (req, res) => {
  try {
    const { name, rollno, email } = req.query;
    if (!name && !rollno && !email) {
      return res.status(400).json({ message: 'At least one of name, email or roll number must be provided' });
    }

    const query = {};
    if (name) query.name = name;
    if (email) query.email = email;
    if (rollno) query.rollno = rollno;

    const students = await Signup.find(query);
    if (!students.length) return res.status(404).json({ message: 'No students found' });

    const assignments = await answerAssignment.find({ rollno: query.rollno || students[0].rollno });
    if (!assignments.length) return res.status(404).json({ message: 'No assignments found for this student' });

    res.status(200).json(assignments);
  } catch (error) {
    console.error('Error fetching student assignments:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

/**
 * POST /search-student
 * Returns full profile of a student: register, subjects, assignments, attendance
 */
router.post('/search-student', async (req, res) => {
  const query = req.body.query;

  if (!query || (!query.email && !query.rollno && !query.name)) {
    return res.status(400).json({ message: 'Query parameter is required' });
  }

  try {
    const { email, rollno, name } = query;
    const searchCriteria = {};
    if (email) searchCriteria.email = email;
    if (rollno) searchCriteria.rollno = rollno;
    if (name) searchCriteria.name = name;

    const registerData = await Signup.findOne(searchCriteria).lean();
    if (!registerData) return res.status(404).json({ message: 'Student not found' });

    const attendanceData = await Students.find({ email: registerData.email }).lean();
    const subjectsData = await UserSubjects.findOne({ userEmail: registerData.email }).lean();
    const assignmentsData = await answerAssignment.find({ rollno: registerData.rollno }).lean();

    res.status(200).json({ registerData, attendanceData, subjectsData, assignmentsData });
  } catch (error) {
    console.error('Error searching student data:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;