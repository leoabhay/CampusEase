const express = require('express');
const router = express.Router();
const ModelQuestion = require('../models/giveQuestionModel')
const verifyToken=require('../middleware')
const multer = require('multer');
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
  upload.single('file'),



router.post('/submit-model-question',verifyToken, upload.single('file'), async (req, res) => {
    try {
        const { subject, model_question } = req.body;
        const file = req.file;
        if(!file){
            return res.status(400).json({ error: 'No file uploaded' });
        }
        else{
            const filename = file.filename;
            const newModelQuestion = new ModelQuestion({
                subject,
                model_question,
                file:`http://localhost:3200/uploads/${filename}`
            });
            const savedModelQuestion = await newModelQuestion.save();
            res.status(201).json(savedModelQuestion);
        }
        
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.get('/model-questions', async (req, res) => {
    try {
        const modelQuestions = await ModelQuestion.find();
        res.json(modelQuestions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/model-questions/:id', async (req, res) => {
    try {
        const modelQuestion = await ModelQuestion.findById(req.params.id);
        if (!modelQuestion) {
            return res.status(404).json({ message: 'Model question not found' });
        }
        res.json(modelQuestion);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



//Read One by email
router.get('/getmodelquestiongivenbyemail', verifyToken, async (req, res) => {
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
           
        // Find question for the subjects taught by this teacher
        const question = await ModelQuestion.find({ subject: { $in: subjectsTaught } });

            // Check if question is an empty array
            if (!question || question.length === 0) {
                return res.status(404).json({ message: 'No model question found' });
               }
      
                res.json({ Model_Question: question });
            
    } catch (error) {
        console.error('Error fetching question:', error); // Log the error
        res.status(500).json({ message: 'Error fetching question', error: error.message });
    }
  });


  
router.get('/getQuestionsByEnrolledSubject', verifyToken, async (req, res) => {
    try {
        const { email } = req.user;

        // Find the enrollment details for the logged-in student
        const enrollment = await UserSubjects.findOne({ userEmail: email });

        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found for the user' });
        }

        // Extract the subjects the student is enrolled in
        const enrolledSubjects = enrollment.subjects.map(subject => subject.name);

        // Find the questions given by the teacher for the enrolled subjects
        const questions = await ModelQuestion.find({ subject: { $in: enrolledSubjects } });

        if (!questions || questions.length === 0) {
            return res.status(404).json({ message: 'No questions found for enrolled subjects' });
        }

        res.json({ Model_Questions: questions });
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ message: 'Error fetching questions', error: error.message });
    }
});

router.put('/model-questions/:id', async (req, res) => {
    try {
        const modelQuestion = await ModelQuestion.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!modelQuestion) {
            return res.status(404).json({ message: 'Model question not found' });
        }
        res.json(modelQuestion);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/model-questions/:id', async (req, res) => {
    try {
        const modelQuestion = await ModelQuestion.findByIdAndDelete(req.params.id);
        if (!modelQuestion) {
            return res.status(404).json({ message: 'Model question not found' });
        }
        res.json({ message: 'Model question deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
