const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Profile = require('../models/profileModel');
const verifyToken = require('../middlewares/middleware');

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/profiles');
    try {
      if (!fs.existsSync(uploadPath)) {
        // If the directory does not exist, create it
        fs.mkdirSync(uploadPath, { recursive: true });
      fs.mkdir(uploadPath, { recursive: true }); // create folder if doesn't exist
      }
      cb(null, uploadPath);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Route to save user profile data
router.post('/saveProfile', verifyToken, upload.single('photo'), async (req, res) => {
  try {
    const rollno = req.user.rollno; // Extract roll number from decoded token

    const profileData = {
      photo: req.file ? req.file.filename : '', // Save filename if uploaded
      rollno: rollno,
      address: req.body.address,
      biography: req.body.biography,
    };

    const newProfile = new Profile(profileData);
    await newProfile.save();

    res.status(201).json({ message: 'Profile saved successfully', profile: newProfile });

  } catch (err) {
    console.error('Error saving profile:', err);
    res.status(500).json({ message: 'Error saving profile', error: err.message });
  }
});

// Route to fetch user profile data
router.get('/getProfileData', verifyToken, async (req, res) => {
  try {
    const rollno = req.user.rollno; // Extract roll number from token
    const profile = await Profile.findOne({ rollno: rollno });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.status(200).json(profile);

  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
});

// check if the user route is working
router.get('/', (req, res) => {
  res.send('Profile route is working!');
});

module.exports = router;