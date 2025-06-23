const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const nodemailer = require('nodemailer');
const Valuation = require('../models/internalExamModel');
const Signup= require('../models/signupModel');
const UserSubjects=require('../models/userSubjectModel');
const Enrollment=require('../models/enrollmentModel');
const verifyToken = require('../middleware');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2000000 }, 
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  }
}).single('file');

function checkFileType(file, cb) {
  const filetypes = /pdf|doc|docx/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: PDFs and Word Documents Only!');
  }
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// router.post('/internalUpload',verifyToken, async(req, res) => {
//   upload(req, res, async(err) => {
//     if (err) {
//       res.status(400).send(err);
//     } else {
//       if (req.file == undefined) {
//         res.status(400).send('No file selected');
//       } else {
//         const { subject}=req.body;
//         const teacher = await Enrollment.findOne({'subjects.teacher' :req.user.email});
//         if (!teacher) {
//           return res.status(404).send('Teacher not found in enrollment');
//         }
        
//         //console.log(teacher);
//         const Subjects = teacher.subjects.find(sub => sub.name === subject);
//         if (!Subjects) {
//           return res.status(404).send('Subject not found for teacher');
//         }
//         const sub = await Subject.findOne({'subjects.name.': teacher.subjects.name });
//         if (!sub) {
//           return res.status(404).send('Subject not found for students');
//         }
//         const user = await Signup.find({email:sub.userEmail}); 
//         if(user.length===0){
//           return res.status(404).send('No users enrolled in this subject');
//         }

//         // Extract emails of all users
//         const userEmails = user.map(user => user.email).join(',');

//         const fileContent = await readFile(req.file.path);

//         const newValuation = new Valuation({
//           type: req.body.type,
//           filePath: req.file.path,
//           subject:req.body.subject
//         });
    
//         newValuation.save()
//           .then(valuation => {
//             const mailOptions = {
//               from: process.env.EMAIL_USER,
//               to: userEmails,
//               subject: 'New File Uploaded',
//               text: `A new file has been uploaded with the following details:\n\nType: ${valuation.type}\nFile Path: ${valuation.filePath}`,
//               attachments: [
//               {
//                 filename: req.file.originalname,
//                 content: fileContent
//               }
//             ]
//             };
//             console.log(userEmails);
//             transporter.sendMail(mailOptions, (error, info) => {
//               if (error) {
//                 console.error('Error sending email:', error);
//                 return res.status(500).send(error.toString());
//               }
//               console.log('Email sent:', info.response);
//               res.json({
//                 message: `Upload successful, email sent to ${userEmails}`,
//                 data: valuation
//               });
//             });
//           })
//           .catch(err => res.status(500).send(err));
//       }
//     }
//   });
// });

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
              from: process.env.EMAIL_USER,
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
