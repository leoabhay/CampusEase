const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const Valuation = require('../models/internalExamModel');
const Signup= require('../models/userModel');
const UserSubjects=require('../models/userSubjectModel');
const Enrollment=require('../models/enrollmentModel');
const verifyToken = require('../middlewares/middleware');

// Ensure the upload directory exists
const uploadDir = path.join(__dirname, 'uploads/internalExams');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}`);
  }
});

// File type check function
function checkFileType(file, cb) {
  // Allowed extensions
  const filetypes = /pdf|doc|docx/;
  // Check extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime type
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Error: PDFs and Word Documents Only!'));
  }
}

// Multer upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  }
}).single('file');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Route to upload internal exam files and notify students
router.post('/internalUpload',verifyToken, async(req, res) => {
    upload(req, res, async(err) => {
      if (err) {
        res.status(400).send(err);
      } else {
        if (!req.file || req.file == undefined) {
          res.status(400).send('No file selected');
        } try {
          const { email } = req.user;
          const {type,subject}=req.body;
          const user = await Signup.findOne({ email });
          
    // If the user is not found, handle the error
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
     // Find the enrollment details based on the teacher's name
     const enrollment= await Enrollment.findOne({ "subjects.teacher": user.email });
    
     if (!enrollment) {
         return res.status(404).json({ message: 'Enrollment not found' });
     }
     // Extract the subjects taught by this teacher
     const subjectsTaught = enrollment.subjects
     .filter(subjectt => subjectt.teacher === user.email && subjectt.name === subject )
     .map(subjectt => subjectt.name);

    if (subjectsTaught.length === 0) {
      return res.status(404).json({ message: 'No subjects found for this teacher' });
    } 
    const student = await UserSubjects.find({ "subjects.name": { $in: subjectsTaught } });
    if (student.length === 0) {
      return res.status(404).json({ message: 'No students found for this subject' });
    }
    // Extract user emails from the student records
const studentEmails = student.map(students => students.userEmail);

// Find details of all these students
const users = await Signup.find({ email: { $in: studentEmails } });
    if(!users || users.length === 0){
      return res.status(404).json({ message: 'No students found for this teacher' });
    }
  //return res.status(200).json({message:'Enrolled students in are:',  users  });
  const fileContent = await fs.readFile(req.file.path);

        const newValuation = new Valuation({
          type,
          filePath: req.file.path,
          subject
        });
    
        const savedValuation = await newValuation.save();

        // Prepare email options for each user
        const emailPromises = users.map(user => {
            const mailOptions = {
              from: 'karthikpokharel@gmail.com',
              to: user.email,
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
        message: `Upload successful, email sent to ${users.length} users`,
        data: savedValuation
      });
    }
    catch (err) {
      console.error('Error uploading file:', err);
      res.status(500).send(err.toString());
    }  
  }});
});

module.exports = router;