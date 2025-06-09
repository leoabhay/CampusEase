const express = require('express');
const router = express.Router();
require('dotenv').config();
const userRegister = require('../models/userModel');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const verifyToken = require('../middleware');
const bcrypt = require('bcrypt');

// Setup nodemailer transporter for sending emails
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Function to send verification email
function sendVerificationEmail(user) {
    const token = jwt.sign(
        { email: user.email },
        process.env.JWT_SECRET_KEY, 
        { expiresIn: '1h' }
    );
    const verificationUrl = `http://localhost:3200/verify-signup?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Email Verification for Signup',
        text: `Please click the following link to verify your login: ${verificationUrl}`
    };
    return transporter.sendMail(mailOptions);
}

// for checking nodemailer
// const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to: process.env.EMAIL_USER,
//     subject: 'SMTP Test',
//     text: 'This is a test email.',
// };

// transporter.sendMail(mailOptions, (error, info) => {
//     if (error) {
//         return console.log('Error:', error);
//     }
//     console.log('Email sent:', info.response);
// });

// User registration with email verification
router.post('/signupUser', verifyToken, async (req, res) => {
    try {
        const { name, email, rollno, address, password, confirmPassword, role } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }

        const currentDate = new Date();
        const formattedDate = currentDate.toDateString();

        const hashedPassword = await bcrypt.hash(password, 10);
        const hashedConfirmPassword = await bcrypt.hash(confirmPassword, 10);

        const existingUser = await userRegister.findOne({ email });

        if (!existingUser) {
            // New user registration
            const newUser = new userRegister({
                name,
                email,
                rollno,
                phone,
                address,
                password: hashedPassword,
                confirmPassword: hashedConfirmPassword,
                role,
                registereddate: formattedDate,
                isVerified: false
            });

            await newUser.save();
            await sendVerificationEmail(newUser);

            return res.status(201).json({ message: 'Registration successful, please check your email to verify your account' });
        }

        if (existingUser.isVerified) {
            return res.status(409).json({ message: 'Already registered.', user: existingUser });
        } else {
            // Re-registration before verification
            const updatedUser = await userRegister.findOneAndUpdate(
                { email },
                {
                    name,
                    email,
                    rollno,
                    phone,
                    address,
                    password: hashedPassword,
                    confirmPassword: hashedConfirmPassword,
                    role,
                    registereddate: formattedDate,
                    isVerified: false
                },
                { new: true }
            );

            await sendVerificationEmail(updatedUser);
            return res.status(200).json({ message: 'Registration successful, please check your email to verify your account' });
        }
    } catch (error) {
        console.error('Error during signup:', error);
        return res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
});

// Email verification route
router.get('/verify-signup', async (req, res) => {
    try {
        const { token } = req.query;

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        } catch (err) {
            return res.status(400).json({ message: 'Verification link expired or invalid' });
        }

        const user = await userRegister.findOne({ email: decoded.email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid verification link' });
        }

        user.isVerified = true;
        await user.save();

        return res.status(200).json({ message: 'Email verification successful, you can now log in' });
    } catch (error) {
        return res.status(500).json({ message: 'Something went wrong', error });
    }
});

// Step 1: Request password reset link
router.post('/request-reset-password', async (req, res) => {
    const { email } = req.body;
    const user = await userRegister.findOne({ email });

    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    }

    const token = jwt.sign({ email: user.email }, 'secretKey', { expiresIn: '1h' });
    const resetUrl = `http://localhost:3200/reset-password?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Password Reset',
        text: `Please click the following link to reset your password: ${resetUrl}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).json({ message: 'Error sending email', error });
        }
        res.json({ message: 'Password reset link sent to your email' });
    });
});

// Step 2a: Render reset password page (API-based, not actual frontend render)
router.get('/reset-password', async (req, res) => {
    const { token } = req.query;
    try {
        const decoded = jwt.verify(token, 'secretKey');
        const user = await userRegister.findOne({ email: decoded.email });

        if (!user) {
            return res.status(400).json({ message: 'Invalid token: User not found' });
        }

        return res.status(200).json({ message: 'Token valid', token }); // Let frontend use this to show reset form
    } catch (error) {
        return res.status(400).json({ message: 'Invalid or expired token', error });
    }
});

// Step 2b: Reset password using the token
router.post('/reset-password', async (req, res) => {
    const { newPassword, confirmPassword } = req.body;
    const { token } = req.query;

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    try {
        const decoded = jwt.verify(token, 'secretKey');
        const user = await userRegister.findOne({ email: decoded.email });

        if (!user) {
            return res.status(400).json({ message: 'Invalid token' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        const hashedConfirmPassword = await bcrypt.hash(confirmPassword, 10);

        user.password = hashedNewPassword;
        user.confirmPassword = hashedConfirmPassword;
        await user.save();

        return res.json({ message: 'Password reset successful' });
    } catch (error) {
        return res.status(400).json({ message: 'Invalid or expired token', error });
    }
});

module.exports = router;