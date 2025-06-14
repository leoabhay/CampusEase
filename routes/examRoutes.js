const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const nodemailer = require('nodemailer');
const verifyToken = require('../middlewares/middleware');
const Signup = require('../models/userModel');
const ExcelData = require('../models/examModel');

// Multer Configuration
// Define the upload path
const uploadPath = path.join(__dirname, '../uploads/exams');

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.mkdir(uploadPath, { recursive: true });
    console.log(`Upload directory ensured at: ${uploadPath}`);
  } catch (err) {
    console.error('Failed to create upload directory:', err);
  }
}
ensureUploadDir();

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Allowed file extensions and mimetypes
const allowedExtensions = /pdf|doc|docx|xlsx/;
const allowedMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

// File type validation function
function checkFileType(file, cb) {
  const ext = path.extname(file.originalname).toLowerCase().slice(1); // remove the dot
  const isValidExt = allowedExtensions.test(ext);
  const isValidMime = allowedMimeTypes.includes(file.mimetype);

  if (isValidExt && isValidMime) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, DOCX, and XLSX files are allowed!'));
  }
}

// Multer upload middleware
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => checkFileType(file, cb)
}).single('file');

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Upload exam file and notify students
router.post('/upload', verifyToken, async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('File upload error:', err);
      return res.status(400).json({ message: 'File upload failed', error: err.message });
    }

    if (!req.file) {
      console.warn('No file selected by user');
      return res.status(400).json({ message: 'No file selected' });
    }

    try {
      const { email } = req.user;
      const { type } = req.body;

      const uploader = await Signup.findOne({ email });
      if (!uploader) {
        return res.status(404).json({ message: 'Uploader not found' });
      }

      // Find all students
      const students = await Signup.find({ role: 'student' });
      if (!students.length) {
        return res.status(404).json({ message: 'No students found' });
      }

      // Save file info to DB
      const newValuation = new ExcelData({
        type,
        filePath: req.file.path
      });
      const savedValuation = await newValuation.save();

      const fileContent = await fs.readFile(req.file.path);

      // Prepare and send emails
      const emailPromises = students.map((student) => {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: student.email,
          subject: 'New Exam File Uploaded',
          text: `Hello ${student.name || 'Student'},\n\nA new file has been uploaded:\nType: ${type}\nPath: ${savedValuation.filePath}`,
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

      console.log(`Emails sent to ${students.length} students`);

      res.status(200).json({
        message: `File uploaded and emails sent to ${students.length} students`,
        data: savedValuation
      });
    } catch (error) {
      console.error('Error during file processing or email:', error);
      res.status(500).json({ message: 'Internal server error', error: error.message });
    }
  });
});

// Get uploaded exam data
router.get('/getdata', async (req, res) => {
  try {
    const jsonData = JSON.parse(await fs.readFile('output.json', 'utf-8'));
    const dbData = await ExcelData.find({});

    console.log('Data fetched successfully');

    res.status(200).json({
      message: 'Data retrieved successfully',
      jsonData,
      dbData
    });
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).json({ message: 'Error fetching data', error: err.message });
  }
});

module.exports = router;