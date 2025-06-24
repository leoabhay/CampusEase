const express = require('express');
const multer = require('multer');
const path = require('path');
const Profile = require('../models/profileModel');
const verifyToken=require('../middleware')


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
  
  router.post('/profile', verifyToken, upload.single('photo'), async (req, res) => {
    try {
      const rollno = req.user.rollno;
      const profileData = {
        photo: req.file ? req.file.filename : '',
        rollno: rollno,
        address: req.body.address
      };
  
      const newProfile = new Profile(profileData);
      await newProfile.save();
  
      res.status(201).json({ message: 'Profile saved successfully', profile: newProfile });
    } catch (err) {
      res.status(500).json({ message: 'Error saving profile', error: err.message });
    }
  });
  router.get('/profileData', verifyToken, async (req, res) => {
    try {
      const rollno = req.user.rollno;
      const profile = await Profile.findOne({ rollno: rollno });
  
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }
  
      res.status(200).json(profile);
    } catch (err) {
      res.status(500).json({ message: 'Error fetching profile', error: err.message });
    }
  });
  
  
  module.exports = router;
