const express = require('express');
const router = express.Router();
const multer = require('multer');
const userRegister = require('../models/signupModel');
const jwt = require('jsonwebtoken');
const verifyToken = require('../middleware');
const bcrypt = require('bcrypt');

// Multer storage config for handling photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Route to register a new user (signup)
router.post('/signup', upload.single("photo"), async (req, res) => {
  try {
    const { name, email, rollno, address, password, confirmPassword, role } = req.body;

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
      address,
      password: hashedPassword,
      role,
      registereddate: new Date().toLocaleDateString(),
      isVerified: false
    });

    // Add photo URL if uploaded
    if (req.file) {
      newUser.photo = `http://localhost:3200/uploads/${req.file.filename}`;
    }

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong during registration', error });
  }
});

// Route for user login
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    const userData = await userRegister.findOne({ email });
    if (!userData) {
      return res.status(404).json({ message: 'Username not found' });
    }

    // Check verification
    if (!userData.isVerified) {
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
      process.env.JWT_SECRET || 'secretKey'
    );

    res.status(200).json({ message: 'Login Successfully', role: userData.role, token });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error });
  }
});

// Get users by role
// Get all faculty users
router.get('/user/faculty', async (req, res) => {
  try {
    const faculty = await userRegister.find({ role: 'faculty' });
    const count = await userRegister.countDocuments({ role: 'faculty' });
    res.status(200).json({ faculty, count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all student users
router.get('/user/student', async (req, res) => {
  try {
    const student = await userRegister.find({ role: 'student' });
    const count = await userRegister.countDocuments({ role: 'student' });
    res.status(200).json({ student, count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all secretary users
router.get('/user/secretary', async (req, res) => {
  try {
    const secretary = await userRegister.find({ role: 'secretary' });
    const count = await userRegister.countDocuments({ role: 'secretary' });
    res.status(200).json({ secretary, count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users
router.get('/userdata', async (req, res) => {
  try {
    const userData = await userRegister.find();
    res.status(200).json({ userData });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error });
  }
});

// Get user data by verified token
router.get('/getuserdata', verifyToken, async (req, res) => {
  try {
    const { email } = req.user;
    const userdata = await userRegister.findOne({ email });
    if (userdata) {
      return res.status(200).json({ data: userdata });
    } else {
      res.status(404).json({ message: "Data not found" });
    }
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error });
  }
});

// Update user data
router.put('/userdata/:id', verifyToken, upload.single("photo"), async (req, res) => {
  try {
    const { address, biography, facebook, instagram, whatsapp, website } = req.body;
    const file = req.file;

    const updateData = {};
    if (address) updateData.address = address;
    if (biography) updateData.biography = biography;
    if (facebook) updateData.facebook = facebook;
    if (instagram) updateData.instagram = instagram;
    if (whatsapp) updateData.whatsapp = whatsapp;
    if (website) updateData.website = website;
    if (file) updateData.photo = `http://localhost:3200/uploads/${file.filename}`;

    const updatedUser = await userRegister.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true });
    res.status(200).json({ message: 'Profile updated successfully!', userdata: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error });
  }
});

// Update user password
router.put('/password/:id', verifyToken, async (req, res) => {
  try {
    const { oldpassword, password, confirmPassword } = req.body;

    const user = await userRegister.findById(req.params.id);

    // Check old password
    const isMatch = await bcrypt.compare(oldpassword, user.password);
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
router.delete('/user/:id', verifyToken, async (req, res) => {
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