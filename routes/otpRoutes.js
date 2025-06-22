const express = require('express');
const router = express.Router();
// const Student = require('../models/otpModel')
const Student = require('../models/otpModel');
const nodemailer = require('nodemailer');
const verifyToken= require('../middleware');

function haversineDistance(coords1, coords2) {
    function toRad(x) {
        return x * Math.PI / 180;
    }

    const R = 6371; // Radius of the Earth in km
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


function generateOtp(length = 6) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
}

async function sendOtp(email, otp, date) {
    let transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'abhaycdry10@gmail.com',
            pass: 'mdbz ukya qknq nfwp',
        }
    });

    let mailOptions = {
        from: 'abhaycdry10@gmail.com',
        to: email,
        subject: 'Your OTP for Attendance',
        text: `Your OTP is ${otp}. Please enter this to mark your attendance.\n ${date}`,
        
    };

    await transporter.sendMail(mailOptions);
}

// router.post('/send-otp', async (req, res) => {
//     const currentDate = new Date();
//     const formattedDate = currentDate.toDateString(); // Format as 'Fri Jun 07 2024'

//     const { email } = req.body;
//     const otp = generateOtp();
//    // const {date} = formattedDate;
//     //console.log(date);
//     try {
//         const student = await Student.findOneAndUpdate(
//             { email },
//             //{ date: formattedDate},
//             { otp, otpExpiration: Date.now() + 5 * 60 * 1000, present: false, 
//                 date: formattedDate  }, 
//             //{present:false},
//             { upsert: true, new: true }
            
//         );
//         await sendOtp(email, otp, formattedDate);
//         res.status(200).send('OTP sent');

//     } catch (err) {
//         console.error('Error generating OTP:', err);
//         res.status(500).send('Error generating OTP');
//     }
// });

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
            if (distance <= 1) { // 1 km range
                student.present = true;
            } else {
                student.present = false;
            }
            await student.save();
            res.status(200).json({ success: true, message: 'Attendance marked successfully' });
        } else {
            res.status(404).json({ success: false, error: 'Invalid OTP or email' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

router.get('/attendance', verifyToken, async(req,res)=>{
    const attendance = await Student.find();

    return res.status(200).json({ attendance});
})

router.get('/getattendancebydate', verifyToken, async (req, res) => {
    try {
        const currentDate = new Date();
        const formattedDate = currentDate.toDateString();
        const attendance = await Student.find();
        const todayAttendance = attendance.filter(student => student.date === formattedDate);

        if (todayAttendance.length === 0) {
            return res.status(404).send('There is no attendance for today!');
        }
        return res.status(200).json({ attendance:todayAttendance });
    }catch (error) {
        return res.status(500).json({ message: 'Error fetching attendance list', error });
    }
});
router.post('/send-otp', verifyToken,async (req, res) => {
    const currentDate = new Date();
    const formattedDate = currentDate.toDateString(); // Format as 'Fri Jun 07 2024'

    const { email, location } = req.body;
    const otp = generateOtp();

    try {
        const student = new Student({
            email,
            otp,
            otpExpiration: Date.now() + 5 * 60 * 1000,
            present: false,
            date: formattedDate,
            latitude: location.latitude,
            longitude: location.longitude
        });
        await student.save();
        await sendOtp(email, otp, formattedDate, location);
        res.status(200).send('OTP sent');

    } catch (err) {
        console.error('Error generating OTP:', err);
        res.status(500).send('Error generating OTP');
    }
});

router.get('/getattendancebyemail', verifyToken,  async (req, res) => {
    try {
        const { email }=req.user;
        console.log(email);
        const attendance = await Student.find({email:email});
        if(!attendance){
            return res.status(200).send('No attendance for this user');
        }
        console.log(attendance.email);
        return res.status(200).json({ attendance });
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching attendance list', error:error.message });
    }
});

module.exports = router;