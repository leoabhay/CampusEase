const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises; // Use promises-based API
const nodemailer = require('nodemailer');
const Valuation = require('../models/internalExamModel');
const Signup = require('../models/userModel');
const UserSubjects = require('../models/userSubjectModel');
const Enrollment = require('../models/enrollmentModel');
const verifyToken = require('../middlewares/middleware');

// Multer Configuration
// Define upload path
const uploadDir = path.join(__dirname, '../uploads/internalExams');

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    console.log(`Upload directory ensured at: ${uploadDir}`);
  } catch (err) {
    console.error('Failed to create upload directory:', err);
  }
}
ensureUploadDir();

// Multer storage config
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}`);
  }
});

// File type checker
function checkFileType(file, cb) {
  const filetypes = /pdf|doc|docx/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
  }
}

// Multer middleware
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  }
}).single('file');

// Nodemailer config
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Upload internal exam file and send email
router.post('/internalUpload', verifyToken, async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err.message);
      return res.status(400).json({ message: 'File upload error', error: err.message });
    }

    if (!req.file) {
      console.warn('No file received in request');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
      const { email } = req.user;
      const { type, subject } = req.body;

      console.log(`Upload request by: ${email} | Subject: ${subject} | Type: ${type}`);

      const user = await Signup.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const enrollment = await Enrollment.findOne({ "subjects.teacher": user.email });
      if (!enrollment) {
        return res.status(404).json({ message: 'Enrollment not found for teacher' });
      }

      const subjectsTaught = enrollment.subjects
        .filter(subj => subj.teacher === user.email && subj.name === subject)
        .map(subj => subj.name);

      if (subjectsTaught.length === 0) {
        return res.status(404).json({ message: 'No matching subjects found for teacher' });
      }

      const students = await UserSubjects.find({ "subjects.name": { $in: subjectsTaught } });
      if (students.length === 0) {
        return res.status(404).json({ message: 'No students enrolled in this subject' });
      }

      const studentEmails = students.map(s => s.userEmail);
      const userDetails = await Signup.find({ email: { $in: studentEmails } });

      if (!userDetails || userDetails.length === 0) {
        return res.status(404).json({ message: 'No student details found' });
      }

      // Save valuation record
      const savedValuation = await new Valuation({
        type,
        subject,
        filePath: req.file.path
      }).save();

      const fileContent = await fs.readFile(req.file.path);

      const emailPromises = userDetails.map(student => {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: student.email,
          subject: 'New Internal Exam File Uploaded',
          text: `Dear ${student.fullName || 'Student'},\n\nA new internal exam file has been uploaded.\n\nSubject: ${subject}\nType: ${type}`,
          attachments: [{
            filename: req.file.originalname,
            content: fileContent
          }]
        };

        return transporter.sendMail(mailOptions)
          .then(() => console.log(`Email sent to: ${student.email}`))
          .catch(err => console.error(`Failed to send email to ${student.email}:`, err));
      });

      await Promise.all(emailPromises);

      res.status(201).json({
        message: `File uploaded and email sent to ${userDetails.length} students.`,
        data: savedValuation
      });

    } catch (err) {
      console.error('Error during upload and email process:', err);
      res.status(500).json({ message: 'Internal server error', error: err.message });
    }
  });
});

module.exports = router;