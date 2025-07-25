const express = require('express');
const router = express.Router();
const Student = require('../models/otpModel');
const nodemailer = require('nodemailer');
const verifyToken = require('../middleware');

// Haversine formula for location distance
function haversineDistance(coords1, coords2) {
    function toRad(x) {
        return x * Math.PI / 180;
    }

    const R = 6371; // Radius of Earth in km
    const dLat = toRad(coords2.latitude - coords1.latitude);
    const dLon = toRad(coords2.longitude - coords1.longitude);
    const lat1 = toRad(coords1.latitude);
    const lat2 = toRad(coords2.latitude);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
}

// Generate 6-digit OTP
function generateOtp(length = 6) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
}

// Send OTP via email
async function sendOtp(email, otp, date) {
    let transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    let mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP for Attendance',
        html: `
  <div style="font-family: Arial, sans-serif; color: #333;">
    <h2 style="color: #2E86C1;">Attendance OTP Verification</h2>
    <p>Hello,</p>
    <p>Your <strong>One-Time Password (OTP)</strong> to mark attendance is:</p>
    <h1 style="color: #27AE60;">${otp}</h1>
    <p>Please enter this OTP in the attendance system to confirm your presence for the date: <strong>${date}</strong>.</p>
    <p style="font-size: 0.9em; color: #888;">If you did not request this OTP, please ignore this email.</p>
    <br />
    <p>Thank you,<br />` + process.env.EMAIL_USER + `</p>
  </div>
`

    };

    await transporter.sendMail(mailOptions);
}

// Send OTP (Upsert – avoid duplicates)
router.post('/send-otp', async (req, res) => {
    const currentDate = new Date();
    const formattedDate = currentDate.toDateString();

    const { email, location } = req.body;
    const otp = generateOtp();

    try {
        const student = await Student.findOneAndUpdate(
            { email, date: formattedDate },
            {
                otp,
                otpExpiration: Date.now() + 5 * 60 * 1000,  // 5 minutes expiration
                present: false,
                latitude: location.latitude,
                longitude: location.longitude
            },
            { upsert: true, new: true }
        );

        await sendOtp(email, otp, formattedDate);
        console.log(`OTP sent to ${email}: ${otp}`);
        res.status(200).send('OTP sent');
    } catch (err) {
        console.error('Error generating OTP:', err);
        res.status(500).send('Error generating OTP');
    }
});

// Verify OTP & Location
router.post('/verify-otp', async (req, res) => {
    const { email, otp, location } = req.body;
    const currentDate = new Date();
    const formattedDate = currentDate.toDateString();

    try {
        const student = await Student.findOne({ email, otp, date: formattedDate });

        if (!student) {
            return res.status(404).json({ success: false, error: 'Invalid OTP or email' });
        }

        if (student.otpExpiration < Date.now()) {
            return res.status(400).json({ success: false, error: 'OTP expired' });
        }

        const otpLocation = {
            latitude: student.latitude,
            longitude: student.longitude
        };

        const distance = haversineDistance(location, otpLocation);
        student.present = distance <= 1; // mark present if within 1 km
        await student.save();

        res.status(200).json({ success: true, message: 'Attendance marked successfully' });
    } catch (err) {
        console.error('Error verifying OTP:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get All Attendance
router.get('/attendance', verifyToken, async (req, res) => {
    try {
        const attendance = await Student.find();
        return res.status(200).json({ attendance });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch attendance' });
    }
});

// Get Today's Attendance
router.get('/getattendancebydate', verifyToken, async (req, res) => {
    try {
        const formattedDate = new Date().toDateString();
        const todayAttendance = await Student.find({ date: formattedDate });

        if (todayAttendance.length === 0) {
            return res.status(404).send('There is no attendance for today!');
        }
        return res.status(200).json({ attendance: todayAttendance });
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching attendance list', error });
    }
});

// Get Attendance by Logged-in User (from token)
router.get('/getattendancebyemail', verifyToken, async (req, res) => {
    try {
        const { email } = req.user;

        const attendance = await Student.find({ email });
        if (attendance.length === 0) {
            return res.status(200).send('No attendance for this user');
        }

        return res.status(200).json({ attendance });
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching attendance list', error: error.message });
    }
});

// Get Attendance for Specific Date and Email
router.get('/attendance/:email/:date', verifyToken, async (req, res) => {
    const { email, date } = req.params;

    try {
        const attendance = await Student.findOne({ email, date });
        if (!attendance) {
            return res.status(404).send('No attendance record found for this date');
        }

        res.status(200).json({ attendance });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;