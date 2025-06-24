
const express = require('express');
const router = express.Router();
const verifyToken=require('../middleware')

const Attendance = require('../models/attendanceModel');


router.post('/attendance', verifyToken, async (req, res) => {
    try {
        const currentDate = new Date();
        const formattedDate = currentDate.toDateString(); // Format as 'Fri Jun 07 2024'

        const newAttendance = new Attendance({
            Name: req.body.Name,
            Program: req.body.Program,
            Semester: req.body.Semester,
            Rollno:req.body.Rollno,
            Subject: req.body.Subject,
            Date: formattedDate,
            Remarks:req.body.Remarks
        });
       
        await newAttendance.save();
        res.json({ message: 'Attendance saved sucessfully ' });
    }
    catch (error) {
        res.status(500).json({ messgae: 'something is error', error });
    }
})


router.get('/getattendance',verifyToken, async (req, res) => {
    const attendance = await Attendance.find();
    res.json({ attendance: attendance });
})


router.post('/face-register', verifyToken, async (req, res) => {
  const { Email, Name, Rollno, Subject, image } = req.body;

  const currentDate = new Date();
  const formattedDate = currentDate.toDateString();

  try {
    // Step 1: Send image to Python server for registration
    const response = await axios.post('http://localhost:5001/register', {
      email: Email,
      image
    });

    if (response.data.success) {
      // Step 2: Save to attendance collection
      const newAttendance = new Attendance({
        Email,
        Name,
        Rollno,
        Subject,
        Date: formattedDate,
        Remarks: 'Face Registered',
        FaceRegistered: true
      });

      await newAttendance.save();
      return res.status(200).json({ success: true, message: 'Face registered and attendance saved' });
    } else {
      return res.status(400).json({ success: false, message: 'Face registration failed', error: response.data.message });
    }
  } catch (error) {
    console.error('Error connecting to Python:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});


module.exports = router;
