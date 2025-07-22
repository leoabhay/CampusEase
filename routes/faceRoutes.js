const express = require('express');
const router = express.Router();
const axios = require('axios');
const Attendance = require('../models/faceModel');
const EnrollmentSubjects = require('../models/enrollmentModel');
const verifyToken = require('../middleware');
const Register = require('../models/signupModel');

// Route to mark attendance
router.post('/mark-attendance', async (req, res) => {
  try {
    const { image, subjectName } = req.body;

    if (!image || !subjectName) {
      return res.status(400).json({ message: 'Missing image or subjectName' });
    }

    // Check if subject exists
    const subjectExists = await EnrollmentSubjects.findOne({
      subjects: { $elemMatch: { name: subjectName } }
    });

    if (!subjectExists) {
      return res.status(404).json({ message: 'Invalid subject name' });
    }

    // Send image to Flask face recognition server
    const faceRes = await axios.post('http://127.0.0.1:5000/verify-face', { image });

    if (!faceRes.data.success) {
      return res.status(404).json({ message: 'Face not recognized' });
    }

    const rollno = Number(faceRes.data.rollno);
    console.log('Roll number from Flask:', rollno);

    // Find user by rollno (not faceId)
    const user = await Register.findOne({ rollno });

    if (!user) {
      return res.status(404).json({ message: 'User not found for recognized roll number' });
    }

    // Check duplicate attendance for today & subject
    const alreadyMarked = await Attendance.findOne({
      rollno,
      subjectName,
      date: {
        $gte: new Date().setHours(0, 0, 0, 0),
        $lt: new Date().setHours(23, 59, 59, 999),
      },
    });

    if (alreadyMarked) {
      return res.status(409).json({ message: 'Attendance already marked' });
    }

    // Save attendance record
    await new Attendance({ rollno, subjectName }).save();

    return res.json({ message: 'Attendance marked', rollno });

  } catch (error) {
    console.error('Error marking attendance:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get all attendances
router.get('/getAllFaceAttendances', async (req, res) => {
  try {
    const attendances = await Attendance.find();
    res.json(attendances);
  } catch (err) {
    console.error('Error in /getAllAttendances:', err);
    res.status(500).json({ message: 'Failed to fetch attendances', error: err.message });
  }
});

// Get attendance by roll number (protected)
router.get('/getFaceAttendances/:rollno', verifyToken, async (req, res) => {
  try {
    const rollno = Number(req.params.rollno);
    const attendances = await Attendance.find({ rollno });
    res.json(attendances);
  } catch (err) {
    console.error('Error fetching attendances:', err);
    res.status(500).json({ message: 'Failed to fetch attendances' });
  }
});

// Get attendance by email
router.get('/getFaceAttendancesByEmail', verifyToken, async (req, res) => {
  try {
    const email = req.params.email;
    const attendances = await Attendance.find({ email });
    res.json(attendances);
  } catch (err) {
    console.error('Error fetching attendances:', err);
    res.status(500).json({ message: 'Failed to fetch attendances' });
  }
});

// Delete attendance by ID
router.delete('/deleteFaceAttendance/:id', async (req, res) => {
  try {
    await Attendance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Attendance deleted' });
  } catch (err) {
    console.error('Error in /deleteAttendance/:id:', err);
    res.status(500).json({ message: 'Failed to delete attendance', error: err.message });
  }
});

// Get valid roll numbers (students only)
router.get('/valid-rollnos', async (req, res) => {
  try {
    const students = await Register.find(
      { role: 'student', rollno: { $ne: null } },
      { rollno: 1, _id: 0 }
    );

    const rollnos = students.map(s => s.rollno);
    res.status(200).json(rollnos);
  } catch (err) {
    console.error('Error fetching rollnos:', err);
    res.status(500).json({ message: 'Failed to fetch roll numbers' });
  }
});

// Route to register face
router.post('/register-face', async (req, res) => {
  try {
    const { image, rollno } = req.body;

    if (!image || !rollno) {
      return res.status(400).json({ message: 'Missing image or rollno' });
    }

    // Call Flask server to register face
    const flaskRes = await axios.post('http://127.0.0.1:5000/register-face', { image, rollno });

    if (!flaskRes.data.success) {
      return res.status(400).json({ message: 'Flask registration failed', details: flaskRes.data });
    }

    // Save faceId to user document in MongoDB
    const faceId = flaskRes.data.faceId; // this is the rollno as string

    const user = await Register.findOneAndUpdate(
      { rollno: Number(rollno) },
      { faceId: faceId },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found to save faceId' });
    }

    return res.json({ message: 'Face registered and faceId saved', user });

  } catch (error) {
    console.error('Error in register-face:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = router;