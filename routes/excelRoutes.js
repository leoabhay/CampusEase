const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const nodemailer = require('nodemailer');
const verifyToken = require('../middleware'); // JWT middleware
const Signup = require('../models/signupModel');
const ExcelData = require('../models/examModel');

// Multer config
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|doc|docx|xlsx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb('Error: PDFs and Word Documents Only!');
  }
}).single('file');

// Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

router.post('/upload', verifyToken, (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).send(err);
    if (!req.file) return res.status(400).send('No file selected');

    try {
      const { email } = req.user;
      const adminUser = await Signup.findOne({ email });
      if (!adminUser) return res.status(404).json({ message: 'User not found' });

      const students = await Signup.find({ role: 'student' });
      if (!students.length) return res.status(404).json({ message: 'No students found' });

      const fileContent = await fs.readFile(req.file.path);
      const { type } = req.body;

      const newValuation = new ExcelData({ type, filePath: req.file.path });
      const savedValuation = await newValuation.save();

      const emailPromises = students.map(student => {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: student.email,
          subject: 'New File Uploaded',
          text: `New file uploaded:\nType: ${savedValuation.type}`,
          attachments: [
            {
              filename: req.file.originalname,
              content: fileContent
            }
          ]
        };
        return transporter.sendMail(mailOptions);
      });

      await Promise.all(emailPromises);

      res.json({
        message: `Upload successful. Sent to ${students.length} students.`,
        data: savedValuation
      });
    } catch (err) {
      console.error(err);
      res.status(500).send(err.toString());
    }
  });
});

module.exports = router;