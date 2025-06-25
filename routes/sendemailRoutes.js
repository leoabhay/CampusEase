const express = require('express');
const router = express.Router();
const userRegister = require('../models/signupModel');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const verifyToken= require('../middleware');
const bcrypt=require('bcrypt');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    }
});

function sendVerificationEmail(user) {
    const token = jwt.sign(
        { email: user.email },
        'secretKey',  
        { expiresIn: '1h' }  // Token expires in 1 hour
    );
    const verificationUrl = `http://localhost:3200/verify-signup?token=${token}`;
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Email Verification for Signup',
        html: `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5; max-width: 600px; margin: auto;">
        <h2 style="color: #2c3e50;">Verify Your Login</h2>
        <p>Hello,</p>
        <p>You have been registered on <strong>CampusEase</strong>. Use the following credentials to log in:</p>
        <table style="margin: 15px 0; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold;">Email:</td>
            <td style="padding: 8px;">${user.email}</td>
          </tr>
          <tr style="background-color: #f8f8f8;">
            <td style="padding: 8px; font-weight: bold;">Password:</td>
            <td style="padding: 8px;">${user.password || 'N/A'}</td>
          </tr>
        </table>
        <p>Please click the button below to verify your login:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="
               background-color: #007bff;
               color: #fff;
               padding: 12px 24px;
               text-decoration: none;
               border-radius: 6px;
               font-weight: bold;
               display: inline-block;
             ">
            Verify Your Login
          </a>
        </p>
        <p>If the button doesn’t work, copy and paste the following link into your browser:</p>
        <p style="word-break: break-all;">${verificationUrl}</p>
        <p>Thank you,<br/>CampusEase Team</p>
      </div>
    `
    };
    return transporter.sendMail(mailOptions);
}

// User Registration Route
router.post('/signupUser', verifyToken,  async (req, res) => {
    try {
      const { name, email, rollno, address, password, confirmPassword, role } = req.body;
  
      if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }
  
      const currentDate = new Date();
      const formattedDate = currentDate.toDateString();

       // Save plain password for email (not for DB)
      const plainPassword = password;

      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(password, 10);
      const hashedconfirmPassword = await bcrypt.hash(confirmPassword, 10);
      const user = await userRegister.findOne({ email });
  
      //const rollNumber = role === 'student' ? rollno : null;
  
      if (!user) {
        const newUser = new userRegister({
          name,
          email,
          rollno,
          address,
          password:hashedPassword,
          confirmPassword:hashedconfirmPassword,
          role,
          registereddate: formattedDate,
          isVerified: false
        });
  
        await newUser.save();
        await sendVerificationEmail({
        email: newUser.email,
        password: plainPassword
      });
  
        return res.status(201).json({ message: 'Registration successful, please check your email to verify your account' });
      }
  
      if (user.isVerified) {
        return res.status(409).json({ message: 'Already registered.', user });
      } else {
        const newUser = await userRegister.findOneAndUpdate(
          { email },
          {
            name,
            email,
            rollno,
            address,
            password:hashedPassword,
            confirmPassword,
            role,
            registereddate: formattedDate,
            isVerified: false
          },
          { new: true }
        );
  
         await sendVerificationEmail({
        email: updatedUser.email,
        password: plainPassword
      });
        console.log('Verification email sent to:', newUser.email);
        return res.status(200).json({ message: 'Registration successful, please check your email to verify your account' });
      }
    } catch (error) {
      return res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
  });

// user registration route ( for admin only )
router.post('/signupAdmin', async (req, res) => {
  try {
    const { name, email, address, password, confirmPassword } = req.body;

    if (!name || !email || !address || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const existingUser = await userRegister.findOne({ email });
    const plainPassword = password;
    const hashedPassword = await bcrypt.hash(password, 10);
    const currentDate = new Date().toDateString();

    if (!existingUser) {
      const newAdmin = new userRegister({
        name,
        email,
        address,
        password: hashedPassword,
        role: 'admin', // Force assignment
        registereddate: currentDate,
        isVerified: false
      });

      await newAdmin.save();

      await sendVerificationEmail({
        email: newAdmin.email,
        password: plainPassword
      });

      return res.status(201).json({ message: 'Admin created successfully. Verification email sent. Please check your email' });
    }

    if (existingUser.isVerified) {
      return res.status(409).json({ message: 'Admin already exists and is verified.' });
    } else {
      const updatedAdmin = await userRegister.findOneAndUpdate(
        { email },
        {
          name,
          address,
          password: hashedPassword,
          role: 'admin',
          registereddate: currentDate,
          isVerified: false
        },
        { new: true }
      );

      await sendVerificationEmail({
        email: updatedAdmin.email,
        password: plainPassword
      });

      return res.status(200).json({ message: 'Admin updated and verification email re-sent.' });
    }

  } catch (err) {
    console.error('Admin signup error:', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});




router.get('/verify-signup', async (req, res) => {
    try {
        const { token } = req.query;

        let decoded;
        try {
            decoded = jwt.verify(token, 'secretKey');  
        } catch (err) {
            return res.json({ message: 'Verification link expired or invalid' });
        }

        const user = await userRegister.findOne({ email: decoded.email });

        if (!user) {
            return res.json({ message: 'Invalid verification link' });
        }

        user.isVerified = true;
        await user.save();
        console.log('Email verification successful, you can now log in');
        return res.redirect('http://localhost:4200/login');
        //return res.status(200).json({ message: 'Email verification successful, you can now log in' });
    } catch (error) {
        return res.status(500).json({ message: 'Something went wrong', error });
    }
});


// Step 1: Request Password Reset
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

router.get('/reset-password', async (req, res) => {
    const { token } = req.query;
    try {
        const decoded = jwt.verify(token, 'secretKey');
        const user = await userRegister.findOne({ email: decoded.email });

        if (!user) {
            console.error('Invalid token: User not found');
            return res.status(400).json({ message: 'Invalid token: User not found' });
        }

        // Render your Angular reset password form HTML here
        // For example, if using EJS:
        res.render('reset-password', { token }); // Assuming 'reset-password' is your view name

    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(400).json({ message: 'Invalid or expired token', error });
    }
});
// Step 2: Reset Password using the token
router.post('/reset-password', async (req, res) => {
    const {  newPassword, confirmPassword } = req.body;
    const {token }=req.query;
    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    try {
        const decoded = jwt.verify(token, 'secretKey');
        const user = await userRegister.findOne({ email: decoded.email });

        if (!user) {
            return res.status(400).json({ message: 'Invalid token' });
        }

        user.password = newPassword;
        user.confirmPassword = confirmPassword;
        await user.save();
        
        return res.json({ message: 'Password reset successful' });
    } catch (error) {
        return res.status(400).json({ message: 'Invalid or expired token', error });
    }
});

module.exports = router;