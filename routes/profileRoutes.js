const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const Profile = require('../models/profileModel');
const verifyToken = require('../middlewares/middleware');

// Multer Configuration
// Define the upload path
const uploadPath = path.join(__dirname, '../uploads/profiles');

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

// Save user profile data
router.post('/saveProfile', verifyToken, upload.single('photo'), async (req, res) => {
  try {
    const rollno = req.user.rollno;

    console.log(`Saving profile for roll number: ${rollno}`);

    const profileData = {
      rollno,
      photo: req.file ? req.file.filename : '',
      address: req.body.address,
      biography: req.body.biography
    };

    const newProfile = new Profile(profileData);
    await newProfile.save();

    console.log('Profile saved:', newProfile);
    res.status(201).json({ message: 'Profile saved successfully', profile: newProfile });

  } catch (err) {
    console.error('Error saving profile:', err);
    res.status(500).json({ message: 'Error saving profile', error: err.message });
  }
});

// Get user profile data
router.get('/getProfileData', verifyToken, async (req, res) => {
  try {
    const rollno = req.user.rollno;
    console.log(`Fetching profile for roll number: ${rollno}`);

    const profile = await Profile.findOne({ rollno });

    if (!profile) {
      console.warn(`Profile not found for rollno: ${rollno}`);
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.status(200).json(profile);

  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
});

// Check route
router.get('/', (req, res) => {
  console.log('Profile route test hit');
  res.status(200).send('Profile route is working!');
});

module.exports = router;