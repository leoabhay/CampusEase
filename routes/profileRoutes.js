const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Profile = require('../models/profileModel');
const Register = require('../models/signupModel');
const verifyToken = require('../middleware');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Create a new profile with photo upload
router.post('/profile', verifyToken, upload.single('photo'), async (req, res) => {
  try {
    const rollno = req.user.rollno;
    const profileData = {
      photo: req.file ? req.file.filename : '',
      rollno: rollno,
      address: req.body.address,
    };

    const newProfile = new Profile(profileData);
    await newProfile.save();

    res.status(201).json({ message: 'Profile saved successfully', profile: newProfile });
  } catch (err) {
    res.status(500).json({ message: 'Error saving profile', error: err.message });
  }
});

// Get profile data with photo as base64 string
router.get('/profileData', verifyToken, async (req, res) => {
  try {
    const rollno = req.user.rollno;

    // Find profile by rollno
    const profile = await Profile.findOne({ rollno: rollno });
    // Find registered user to get registereddate
    const user = await Register.findOne({ rollno: rollno });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Convert photo filename to base64 data URI
    let photoBase64 = '';
    if (profile.photo) {
      const imgPath = path.join(__dirname, '..', 'uploads', profile.photo);
      if (fs.existsSync(imgPath)) {
        const imgData = fs.readFileSync(imgPath);
        const ext = path.extname(profile.photo).substring(1); // e.g., 'jpg' or 'png'
        photoBase64 = `data:image/${ext};base64,${imgData.toString('base64')}`;
      }
    }

    // Prepare combined response
    const combinedData = {
      ...profile.toObject(),
      photo: photoBase64, // replace filename with base64 string
      registereddate: user.registereddate,
    };

    res.status(200).json(combinedData);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile data', error: err.message });
  }
});

module.exports = router;