const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const nodemailer = require('nodemailer');
const verifyToken = require('../middleware');
const Signup= require('../models/signupModel');
//const XLSX = require('xlsx');
const ExcelData = require('../models/examModel');
//const upload = multer({ dest: 'uploads/' });

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
  const filetypes = /pdf|doc|docx|xlsx/;
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
    pass: process.env.EMAIL_PASS,
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
            to: std.email,
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


// router.post('/upload', upload.single('file'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: 'No file uploaded' });
//     }
//     const workbook = XLSX.readFile(req.file.path);
//     const sheet_name_list = workbook.SheetNames;
//     const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
    
//     // for (const row of data) {
//     //   if (!row.name || !row.rollno) {
//     //     return res.status(400).json({ message: 'Error: Each row must contain a name and rollno.' });
//     //   }
//     // }

//     await ExcelData.insertMany(data);

//     fs.writeFileSync('output.json', JSON.stringify(data));
    
//     res.json({ message: 'File uploaded successfully', data });
//   } catch (err) {
//     console.error('Error uploading file:', err); // Enhanced error logging
//     res.status(500).json({ message: 'Error uploading file', error: err.message });
//   }
// });


// router.get('/getdata', async (req, res) => {
//   try {
//     const jsonData = JSON.parse(fs.readFileSync('output.json', 'utf-8'));
//     const dbData = await ExcelData.find({});
    
//     res.json({
//       message: 'Data retrieved successfully',
//       jsonData,
//       dbData
//     });
//   } catch (err) {
//     console.error('Error fetching data:', err);
//     res.status(500).json({ message: 'Error fetching data', error: err.message });
//   }
// });



module.exports = router;
