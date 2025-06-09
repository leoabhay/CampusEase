const express = require ('express');
require('dotenv').config();
const app = express();
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');

// Import routes
const userRoutes = require('./routes/userRoutes');
const otpRoutes=require('./routes/otpRoutes')
const profileRoutes=require('./routes/profileRoutes')
const sendemail=require('./routes/sendEmailRoutes');
const createDepartmentRoutes = require('./routes/createDepartmentRoute');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const examRoutes = require('./routes/examRoutes');
const discussionRoutes = require('./routes/discussionRoutes');

// Connect to database
connectDB();

app.use(cors());
app.use(express.json());

// api routes
app.use('/api/users', userRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/sendemail', sendemail);
app.use('/api/department', createDepartmentRoutes);
app.use('/api/enrollment', enrollmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/discussion', discussionRoutes);

// Serve static files from the "uploads" directory
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// check the server
  app.get('/', (req, res) => {
    res.send('Welcome to the CampusEase');
  });

// start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});