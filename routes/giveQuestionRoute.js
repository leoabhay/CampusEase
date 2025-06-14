const express = require('express');
const router = express.Router();
const ModelQuestion = require('../models/giveQuestionModel');
const verifyToken = require('../middlewares/middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Signup = require('../models/userModel');
const Enrollment = require('../models/enrollmentModel');
const UserSubjects = require('../models/userSubjectModel');

// Multer Configuration
// Define the upload path
const uploadPath = path.join(__dirname, '../uploads/questions');

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

const upload = multer({ storage });

// Create a new model question
router.post('/submit-model-question', verifyToken, upload.single('file'), async (req, res) => {
    try {
        const { subject, model_question } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filename = file.filename;
        const newModelQuestion = new ModelQuestion({
            subject,
            model_question,
            file: `http://localhost:3200/uploads/questions/${filename}`
        });

        const savedModelQuestion = await newModelQuestion.save();
        res.status(201).json(savedModelQuestion);

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get all model questions
router.get('/model-questions', async (req, res) => {
    try {
        const modelQuestions = await ModelQuestion.find();
        res.json(modelQuestions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get a model question by ID
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

// Get model questions submitted by teacher (email-based)
router.get('/getmodelquestiongivenbyemail', verifyToken, async (req, res) => {
    try {
        const { email } = req.user;
        const user = await Signup.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const enrollment = await Enrollment.findOne({ "subjects.teacher": user.email });

        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found' });
        }

        const subjectsTaught = enrollment.subjects
            .filter(subject => subject.teacher === user.email)
            .map(subject => subject.name);

        if (subjectsTaught.length === 0) {
            return res.status(404).json({ message: 'No subjects found for this teacher' });
        }

        const question = await ModelQuestion.find({ subject: { $in: subjectsTaught } });

        if (!question || question.length === 0) {
            return res.status(404).json({ message: 'No model question found' });
        }

        res.json({ Model_Question: question });

    } catch (error) {
        console.error('Error fetching question:', error);
        res.status(500).json({ message: 'Error fetching question', error: error.message });
    }
});

// Get questions by enrolled subjects for a student
router.get('/getQuestionsByEnrolledSubject', verifyToken, async (req, res) => {
    try {
        const { email } = req.user;

        const enrollment = await UserSubjects.findOne({ userEmail: email });

        if (!enrollment) {
            return res.status(404).json({ message: 'Enrollment not found for the user' });
        }

        const enrolledSubjects = enrollment.subjects.map(subject => subject.name);

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

// Update a model question by ID
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

// Delete a model question by ID
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