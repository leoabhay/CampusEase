const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const verifyToken = require('../middlewares/middleware');
const Signup = require('../models/userModel');
const ExcelData = require('../models/examModel');

// Configure multer to store files in uploads/exams
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/exams');
    try {
      if (!fs.existsSync(uploadPath)) {
        // If the directory does not exist, create it
        fs.mkdirSync(uploadPath, { recursive: true });
       fs.mkdir(uploadPath, { recursive: true }); // Ensure the folder exists
      }
      cb(null, uploadPath);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File type validation
function checkFileType(file, cb) {
  const filetypes = /pdf|doc|docx|xlsx/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, DOCX, and XLSX files are allowed!'));
  }
}

// Multer upload middleware
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => checkFileType(file, cb)
}).single('file');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

router.post('/upload',verifyToken, async(req, res) => {
  upload(req, res, async(err) => {
    if (err) {
      res.status(400).send(err);
    } else {
      if (!req.file || req.file == undefined) {
        res.status(400).send('No file selected');
      } try {
        const { email } = req.user;
        //const {type,subject}=req.body;
        const user = await Signup.findOne({ email });
        
  // If the user is not found, handle the error
  if (!user) {
      return res.status(404).json({ message: 'User not found' });
  }
// Find details of all these students
const students = await Signup.find({ role: 'student' });
if (students.length === 0) {
  return res.status(404).json({ message: 'No students found' });
}

const fileContent = await fs.readFile(req.file.path);
const { type } = req.body; 
      const newValuation = new ExcelData({
        type,
        filePath: req.file.path
      });
  
      const savedValuation = await newValuation.save();

      // Prepare email options for each user
      const emailPromises = students.map(std => {
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: std.email, // send to each student's email
            subject: 'New File Uploaded',
            text: `A new file has been uploaded with the following details:\n\nType: ${savedValuation.type}\nFile Path: ${savedValuation.filePath}`,
            attachments: [
            {
              filename: req.file.originalname,
              content: fileContent
            }
          ]
          };
          // Send email and return the promise
      return transporter.sendMail(mailOptions);
    });

    // Wait for all emails to be sent
    await Promise.all(emailPromises);

    console.log('Emails sent successfully');
    res.json({
      message: `Upload successful, email sent to ${students.length} students`,
      data: savedValuation
    });
  }
  catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).send(err.toString());
  }  
}});
});

// Get all uploaded files
router.get('/getdata', async (req, res) => {
  try {
    const jsonData = JSON.parse(fs.readFileSync('output.json', 'utf-8'));
    const dbData = await ExcelData.find({});
    
    res.json({
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