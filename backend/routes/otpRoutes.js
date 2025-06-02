const express = require('express');
const router = express.Router();
const Student = require('../models/otpModel');
const nodemailer = require('nodemailer');
const verifyToken = require('../middleware'); // Middleware to verify JWT token

// Calculates the distance between two coordinates using the Haversine formula
function haversineDistance(coords1, coords2) {
    function toRad(x) {
        return x * Math.PI / 180;
    }

    const R = 6371; // Radius of the Earth in kilometers
    const dLat = toRad(coords2.latitude - coords1.latitude);
    const dLon = toRad(coords2.longitude - coords1.longitude);
    const lat1 = toRad(coords1.latitude);
    const lat2 = toRad(coords2.latitude);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c;
}

// Generates a numeric OTP of the given length (default 6 digits)
function generateOtp(length = 4) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
}

// Sends the OTP to the student's email using Gmail SMTP
async function sendOtp(email, otp, date) {
    let transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        }
    });

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP for Attendance',
        text: `Your OTP is ${otp}. Please enter this to mark your attendance.\nDate: ${date}`,
    };

    await transporter.sendMail(mailOptions);
}

// Send OTP to student - saves entry to DB and emails the OTP
router.post('/send-otp', verifyToken, async (req, res) => {
    const currentDate = new Date();
    const formattedDate = currentDate.toDateString(); // Format: 'Fri Jun 07 2024'

    const { email, location } = req.body;
    const otp = generateOtp();

    try {
        const student = new Student({
            email,
            otp,
            otpExpiration: Date.now() + 5 * 60 * 1000, // OTP valid for 5 mins
            present: false,
            date: formattedDate,
            latitude: location.latitude,
            longitude: location.longitude
        });

        await student.save(); // Save attendance record
        await sendOtp(email, otp, formattedDate); // Send email with OTP

        res.status(200).send('OTP sent');
    } catch (err) {
        console.error('Error generating OTP:', err);
        res.status(500).send('Error generating OTP');
    }
});

// Verify OTP and mark student as present (if location is within 1 km range)
router.post('/verify-otp', verifyToken, async (req, res) => {
    const { email, otp, location } = req.body;
    const currentDate = new Date();
    const formattedDate = currentDate.toDateString();

    try {
        const student = await Student.findOne({ email, otp, date: formattedDate });
        if (student) {
            const otpLocation = {
                latitude: student.latitude,
                longitude: student.longitude
            };

            const distance = haversineDistance(location, otpLocation);
            if (distance <= 1) {
                student.present = true; // Within range
            } else {
                student.present = false; // Outside allowed range
            }

            await student.save(); // Update attendance
            res.status(200).json({ success: true, message: 'Attendance marked successfully' });
        } else {
            res.status(404).json({ success: false, error: 'Invalid OTP or email' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get all attendance records (admin or teacher)
router.get('/attendance', verifyToken, async (req, res) => {
    try {
        const attendance = await Student.find();
        return res.status(200).json({ attendance });
    } catch (err) {
        return res.status(500).json({ message: 'Error fetching attendance', error: err.message });
    }
});

// Get today's attendance list
router.get('/getattendancebydate', verifyToken, async (req, res) => {
    try {
        const currentDate = new Date();
        const formattedDate = currentDate.toDateString();

        const attendance = await Student.find();
        const todayAttendance = attendance.filter(student => student.date === formattedDate);

        if (todayAttendance.length === 0) {
            return res.status(404).send('There is no attendance for today!');
        }

        return res.status(200).json({ attendance: todayAttendance });
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching attendance list', error });
    }
});

// Get attendance records for logged-in user (student)
router.get('/getattendancebyemail', verifyToken, async (req, res) => {
    try {
        const { email } = req.user; // Extract email from decoded token
        const attendance = await Student.find({ email });

        if (!attendance.length) {
            return res.status(404).send('No attendance for this user');
        }

        return res.status(200).json({ attendance });
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching attendance list', error: error.message });
    }
});

// check if the otp route is working
router.get('/', (req, res) => {
  res.send('Otp route is working!');
});

module.exports = router;