const express = require('express');
const router = express.Router();
const multer = require('multer');
const Assignment = require('../models/giveAssignmentModel')
const verifyToken=require('../middleware')
const Signup=require('../models/signupModel');
const Enrollment=require('../models/enrollmentModel');
const UserSubjects= require('../models/userSubjectModel');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  });
  
  const upload = multer({ storage: storage });
  upload.single('assignmentFile'),



  router.post('/postGiveAssignments', verifyToken, upload.single('assignmentFile'), async (req, res) => {
    try {
        console.log('File received:', req.file); 
        const { subject, assignmentName, dueDate ,remarks } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        } else {
            const filename = file.filename;
            const assignment = new Assignment({
                subject,
                assignmentName,
                assignmentFile: `http://localhost:3200/uploads/${filename}`,
                remarks,
                dueDate 
            });
            const savedAssignment = await assignment.save();
            res.status(201).json(savedAssignment);
        }
    } catch (err) {
        console.error(err); 
        res.status(400).json({ message: err.message });
    }
});

router.get('/getGiveAssignments', async (req, res) => {
    try {
        const assignments = await Assignment.find();
        res.json(assignments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.get('/getGiveAssignments/:id', async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        res.json(assignment);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


  //aafai le deko assinment teacher ko ma dekichha 

router.get('/getassignmentsgivenbyemail', verifyToken, async (req, res) => {
    try {
        const { email } = req.user;
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
            .filter(subject => subject.teacher === user.email)
            .map(subject => subject.name);

        if (subjectsTaught.length === 0) {
           return res.status(404).json({ message: 'No subjects found for this teacher' });
           }                               

        // Find assignments for the subjects taught by this teacher
        const assignment = await Assignment.find({ subject: { $in: subjectsTaught } });

            // Check if assignment is an empty array
            if (!assignment || assignment.length === 0) {
                return res.status(404).json({ message: 'No assignment found' });
               }
      
                res.json({ Assignments: assignment });

    } catch (error) {
        console.error('Error fetching assignment:', error); // Log the error
        res.status(500).json({ message: 'Error fetching assignment', error: error.message });
    }
  });


  router.get('/getAssignmentsByEnrolledSubject', verifyToken, async (req, res) => {
    try {
        const { email } = req.user;

        // Find the enrollment details for the logged-in student
        const enrollment = await UserSubjects.findOne({ userEmail: email });

        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found for the user' });
        }

        // Extract the subjects the student is enrolled in
        const enrolledSubjects = enrollment.subjects.map(subject => subject.name);

        // Find the assignments given by the teacher for the enrolled subjects
        const assignments = await Assignment.find({ subject: { $in: enrolledSubjects } });

        if (!assignments || assignments.length === 0) {
            return res.status(404).json({ message: 'No assignments found for enrolled subjects' });
        }

        res.json({ assignments });
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({ message: 'Error fetching assignments', error: error.message });
    }
});


router.put('/putGiveAssignments/:id', async (req, res) => {
    try {
        const assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        res.json(assignment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.delete('/giveAssignments/:id', async (req, res) => {
    try {
        const assignment = await Assignment.findByIdAndDelete(req.params.id);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        res.json({ message: 'Assignment deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;