const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Assignment = require('../models/giveAssignmentModel');
const verifyToken = require('../middlewares/middleware');
const Signup = require('../models/userModel');
const Enrollment = require('../models/enrollmentModel');
const UserSubjects = require('../models/userSubjectModel');

// Multer Configuration
// Define the upload path
const uploadPath = path.join(__dirname, '../uploads/assignments');

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

// Give assignments to students
router.post('/postGiveAssignments', verifyToken, upload.single('assignmentFile'), async (req, res) => {
  try {
    console.log('File received:', req.file);

    const { subject, assignmentName, dueDate, remarks } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileURL = `http://localhost:3200/uploads/giveAssignments/${file.filename}`;

    const assignment = new Assignment({
      subject,
      assignmentName,
      assignmentFile: fileURL,
      remarks,
      dueDate
    });

    const savedAssignment = await assignment.save();
    res.status(201).json(savedAssignment);

  } catch (err) {
    console.error('Error uploading assignment:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get all assignments
router.get('/getGiveAssignments', async (req, res) => {
  try {
    const assignments = await Assignment.find();
    res.status(200).json(assignments);
  } catch (err) {
    console.error('Error fetching assignments:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get asssignment by ID
router.get('/getGiveAssignments/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    res.status(200).json(assignment);
  } catch (err) {
    console.error('Error fetching assignment:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get assignments given by a specific teacher (by token email)
router.get('/getassignmentsgivenbyemail', verifyToken, async (req, res) => {
  try {
    const { email } = req.user;
    const user = await Signup.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const enrollment = await Enrollment.findOne({ 'subjects.teacher': email });

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found for teacher' });
    }

    const subjectsTaught = enrollment.subjects
      .filter(subject => subject.teacher === email)
      .map(subject => subject.name);

    if (subjectsTaught.length === 0) {
      return res.status(404).json({ message: 'No subjects assigned to this teacher' });
    }

    const assignments = await Assignment.find({ subject: { $in: subjectsTaught } });

    if (!assignments.length) {
      return res.status(404).json({ message: 'No assignments found for these subjects' });
    }

    res.status(200).json({ assignments });

  } catch (error) {
    console.error('Error fetching teacher assignments:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get assignments based on student's enrolled subjects
router.get('/getAssignmentsByEnrolledSubject', verifyToken, async (req, res) => {
  try {
    const { email } = req.user;

    const enrollment = await UserSubjects.findOne({ userEmail: email });

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found for user' });
    }

    const enrolledSubjects = enrollment.subjects.map(subject => subject.name);

    const assignments = await Assignment.find({ subject: { $in: enrolledSubjects } });

    if (!assignments.length) {
      return res.status(404).json({ message: 'No assignments found for enrolled subjects' });
    }

    res.status(200).json({ assignments });

  } catch (error) {
    console.error('Error fetching student assignments:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Update assignment by ID
router.put('/putGiveAssignments/:id', async (req, res) => {
  try {
    const updated = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!updated) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error('Error updating assignment:', err);
    res.status(400).json({ message: err.message });
  }
});

// Delete assignment
router.delete('/giveAssignments/:id', async (req, res) => {
  try {
    const deleted = await Assignment.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.status(200).json({ message: 'Assignment deleted successfully' });
  } catch (err) {
    console.error('Error deleting assignment:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;