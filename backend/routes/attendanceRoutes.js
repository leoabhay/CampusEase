const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/middleware')
const Attendance = require('../models/attendanceModel');

// Route to save attendance
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

// Route to get all attendance records
router.get('/getattendance',verifyToken, async (req, res) => {
    const attendance = await Attendance.find();
    res.json({ attendance: attendance });
})

// check if the user route is working
router.get('/', (req, res) => {
  res.send('Attendance route is working!');
});

module.exports = router;