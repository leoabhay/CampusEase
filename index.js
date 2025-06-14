const express = require ('express');
require('dotenv').config();
const app = express();
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');

// Connect to database
connectDB();

// Import routes
const academicRecordRoutes = require('./routes/academicRecordRoutes');
const addClubRoutes = require('./routes/addClubRoutes');
const answerAssignmentRoutes = require('./routes/answerAssignmentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const createDepartmentRoutes = require('./routes/createDepartmentRoute');
const discussionRoutes = require('./routes/discussionRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const eventRoutes = require('./routes/eventRoutes');
const examRoutes = require('./routes/examRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const giveAssignmentRoutes = require('./routes/giveAssignmentRoutes');
const giveQuestionRoutes = require('./routes/giveQuestionRoute');
const idCardRoutes = require('./routes/idcardRoutes');
const internalExamRoutes = require('./routes/internalExamRoutes');
const internalMarksPredictRoutes = require('./routes/internalMarksPredictRoutes');
const jobVacancyRoutes = require('./routes/jobVacancyRoute');
const joinClubRoutes = require('./routes/joinClubRoutes');
const otpRoutes = require('./routes/otpRoutes')
const profileRoutes = require('./routes/profileRoutes')
const sendEmailRoutes = require('./routes/sendEmailRoutes');
const sponsorshipRequestRoutes = require('./routes/sponsorshipRequestRoute');
const sponsorRoutes = require('./routes/sponsorshipRoutes');
const userRoutes = require('./routes/userRoutes');


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// api routes
app.use('/api/academicRecord', academicRecordRoutes);
app.use('/api/addClub', addClubRoutes);
app.use('/api/answerAssignment', answerAssignmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/department', createDepartmentRoutes);
app.use('/api/discussion', discussionRoutes);
app.use('/api/enrollment', enrollmentRoutes);
app.use('/api/event', eventRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/giveAssignment', giveAssignmentRoutes);
app.use('/api/giveQuestion', giveQuestionRoutes);
app.use('/api/idcard', idCardRoutes);
app.use('/api/internalExam', internalExamRoutes);
app.use('/api/internalMarksPredict', internalMarksPredictRoutes);
app.use('/api/jobVacancy', jobVacancyRoutes);
app.use('/api/joinClub', joinClubRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/sendemail', sendEmailRoutes);
app.use('/api/sponsorshipRequest', sponsorshipRequestRoutes);
app.use('/api/sponsorship', sponsorRoutes);
app.use('/api/user', userRoutes);

// Serve static files from the "uploads" directory
const uploadDirs = [
  'assignments', 'answerAssignments', 'questions',
  'users', 'profiles', 'exams', 'internalExams'
];

uploadDirs.forEach(dir => {
  app.use(`/uploads/${dir}`, express.static(path.join(__dirname, `uploads/${dir}`)));
});

// Error Handler
// 404 Not Found Handler
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// check the server
  app.get('/', (req, res) => {
    res.send('Welcome to the CampusEase');
  });

// start server
const PORT = process.env.PORT || 3200;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});