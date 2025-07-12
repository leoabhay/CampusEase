const express = require('express');
const router = express.Router();
const Submission = require('../models/cvModel');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

// Nodemailer transporter config
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

// submit a new CV and notify admin
router.post('/submit-cv', upload.single('cv'), async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email || !phone || !req.file) {
      return res.status(400).json({ message: 'All fields and CV file are required' });
    }

    const submission = new Submission({
      name,
      email,
      phone,
      cvFilename: req.file.filename,
    });

    await submission.save();

    // Prepare email to admin
    const host = req.protocol + '://' + req.get('host');
    const cvDownloadUrl = `${host}/uploads/${req.file.filename}`;

    const mailOptions = {
      from: `"CV Submission Portal" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: 'New CV Submission',
      html: `
        <h3>New CV Submitted</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Download CV:</strong> <a href="${cvDownloadUrl}">${cvDownloadUrl}</a></p>
      `,
      attachments: [
        {
          filename: req.file.originalname,
          path: path.join(__dirname, '../uploads', req.file.filename),
        }
      ]
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Error sending email to admin:', err);
      } else {
        // console.log('Email sent to admin:', info.response);
      }
    });

    res.status(201).json({ message: 'CV submitted and admin notified successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


// get all submissions
router.get('/cv-submissions', async (req, res) => {
  try {
    const submissions = await Submission.find().sort({ createdAt: -1 });
    // Map to include full CV URL
    const host = req.protocol + '://' + req.get('host');
    const result = submissions.map(s => ({
      _id: s._id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      cvUrl: host + '/uploads/' + s.cvFilename,
      createdAt: s.createdAt,
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// delete submission and CV file
router.delete('/cv-submissions/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const submission = await Submission.findById(id);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    // Delete CV file
    const filePath = path.join(__dirname, 'uploads', submission.cvFilename);
    fs.unlink(filePath, (err) => {
      if (err) console.error('Failed to delete CV file:', err);
    });

    await Submission.deleteOne({ _id: id });
    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;