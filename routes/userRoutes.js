const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const userRegister = require('../models/userModel');
const jwt = require('jsonwebtoken');
const verifyToken = require('../middlewares/middleware');
const bcrypt = require('bcrypt');

// Multer configuration
// Define the upload path
const uploadPath = path.join(__dirname, '../uploads/users');

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

// Route to register a new user (signup)
router.post('/signup', upload.single("photo"), async (req, res) => {
  try {
    const { name, email, rollno, phone, address, password, confirmPassword, role } = req.body;

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Password and Confirm Password do not match' });
    }

    // Check for duplicate email or roll number
    const existingUser = await userRegister.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const existingRollNo = await userRegister.findOne({ rollno });
    if (existingRollNo) {
      return res.status(400).json({ message: 'Roll number already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new userRegister({
      name,
      email,
      rollno,
      phone,
      address,
      password: hashedPassword,
      role,
      registereddate: new Date().toLocaleDateString(),
      isVerified: false
    });

    // Add photo URL if uploaded
    if (req.file) {
      newUser.photo = `http://localhost:3200/uploads/users/${req.file.filename}`;
    }

    await newUser.save();
    // console.log('New user registered:', newUser);
    res.status(201).json({ message: 'User registered successfully', users: newUser });
  } catch (error) {
    // console.error('Error during registration:', error);
    res.status(500).json({ message: 'Something went wrong during registration', error });
  }
});

// Route for user login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const userData = await userRegister.findOne({ email });
    if (!userData) {
      return res.status(404).json({ message: 'Username not found' });
    }

    // Check verification
    if (!userData.isVerified) {
      console.log('User is not verified:', userData);
      return res.status(403).json({ message: 'User is not verified. Please verify before login!', userData });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        email: userData.email,
        userId: userData._id,
        name: userData.name,
        rollno: userData.rollno,
        userRole: userData.role
      },
      process.env.JWT_SECRET_KEY
    );

    // console.log('User logged in:', userData);
    res.status(200).json({ message: 'Login Successfully', role: userData.role, token, users: userData });
  } catch (error) {
    // console.error('Error during login:', error);
    res.status(500).json({ message: 'Something went wrong', error });
  }
});

// Get users by role
// Get all teacher users
router.get('/getUsers/teacher', async (req, res) => {
  try {
    const teacher = await userRegister.find({ role: 'teacher' });
    const count = await userRegister.countDocuments({ role: 'teacher' });
    // console.log('Teacher users:', teacher, 'Total teacher users count :',count);
    res.status(200).json({ count, teacher });
  } catch (err) {
    // console.error('Error fetching teacher users:', err);
    res.status(500).json({ message: 'Failed to fetch teacher users', error });
  }
});

// Get all student users
router.get('/getUsers/student', async (req, res) => {
  try {
    const student = await userRegister.find({ role: 'student' });
    const count = await userRegister.countDocuments({ role: 'student' });
    // console.log('Student users:', student, 'Total student users count :',count);
    res.status(200).json({ count, student });
  } catch (err) {
    // console.error('Error fetching student users:', err);
    res.status(500).json({ message: 'Failed to fetch student users', error });
  }
});

// Get all secretary users
router.get('/getUsers/secretary', async (req, res) => {
  try {
    const secretary = await userRegister.find({ role: 'secretary' });
    const count = await userRegister.countDocuments({ role: 'secretary' });
    // console.log('Student users:', secretary, 'Total secretary users count :',count);
    res.status(200).json({ count, secretary});
  } catch (err) {
    // console.error('Error fetching secretary users:', err);
    res.status(500).json({ message: 'Failed to fetch secretary users', error });
  }
});

// Get all users
router.get('/getAllUsers', async (req, res) => {
  try {
    const userData = await userRegister.find();
    const count = await userRegister.countDocuments();
    // console.log('total users:', count);
    res.status(200).json({ count, userData });
  } catch (error) {
    // console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users', error });
  }
});

// Get verified users
router.get('/getUsers/verified', async (req, res) => {
  try {
    const verifiedUsers = await userRegister.find({ isVerified: true });
    const count = await userRegister.countDocuments({ isVerified: true });
    // console.log('Total verified users count :',count);
    res.status(200).json({ count, verifiedUsers });
  } catch (err) {
    // console.error('Error fetching verified users:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get unverified users
router.get('/getUsers/unverified', async (req, res) => {
  try {
    const unverifiedUsers = await userRegister.find({ isVerified: false });
    const count = await userRegister.countDocuments({ isVerified: false });
    // console.log('Total unverified users count :',count);
    res.status(200).json({ count, unverifiedUsers });
  } catch (err) {
    // console.error('Error fetching unverified users:', err);
    res.status(500).json({ error: err.message });
  }
});

// Route to get user data based on verified JWT token (jasko token ho tesko info)
router.get('/getUserData', verifyToken, async (req, res) => {
  try {
    const { email } = req.user;
    const userdata = await userRegister.findOne({ email });
    if (userdata) {
      return res.status(200).json({ data: userdata });
    } else {
      console.log('User data not found for email:', email);
      res.status(404).json({ message: "Data not found" });
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Something went wrong', error });
  }
});

// Update user data
router.put('/updateUserData/:id', verifyToken, upload.single("photo"), async (req, res) => {
  try {
    const { phone, address, biography} = req.body;
    const file = req.file;

    const updateData = {};
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (biography) updateData.biography = biography;
    if (file) updateData.photo = `http://localhost:3200/uploads/users/${file.filename}`;

    const updatedUser = await userRegister.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
    res.status(200).json({ message: 'Profile updated successfully!', userdata: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error });
  }
});

// Update user password
router.put('/updatePassword/:id', verifyToken, async (req, res) => {
  try {
    const { oldPassword, password, confirmPassword } = req.body;

    const user = await userRegister.findById(req.params.id);

    // validate the fields
    if (!oldPassword || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Old password did not match' });
    }

    // Validate new passwords
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match' });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error });
  }
});

// Delete user by id
router.delete('/deleteUser/:id', verifyToken, async (req, res) => {
  try {
    const user = await userRegister.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search students by name, roll number, or email
router.get('/students/search', verifyToken, async (req, res) => {
  try {
    const { name, rollno, email } = req.query;

    // Build query
    const query = {};
    if (name) query.name = name;
    if (email) query.email = email;
    if (rollno) query.rollno = rollno;

    // Ensure at least one search parameter is provided
    if (!name && !rollno && !email) {
      return res.status(400).json({ message: 'At least one of name, email or roll number must be provided' });
    }

    // Find students based on the query
    query.role = 'student'; // Ensure we only search for students
    const students = await userRegister.find(query).lean().exec();
    if (!students.length) {
      return res.status(404).json({ message: 'No students found' });
    }

    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
});

// check if the user route is working
router.get('/', (req, res) => {
  res.send('User route is working!');
});

module.exports = router;