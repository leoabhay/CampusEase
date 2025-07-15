const express = require('express');
const router = express.Router();
const Academic = require('../models/AcademicModel');
const verifyToken = require('../middleware');

// Create academic record
router.post('/createAcademic', verifyToken, async (req, res) => {
  try {
    const record = new Academic(req.body);
    await record.save();
    res.status(201).json({ message: 'Academic record created', record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating record', error: err.message });
  }
});

// Get academic records
router.get('/getAcademic', verifyToken, async (req, res) => {
  try {
    let records;
    if (req.user.role === 'student') {
      // req.user.rollno must contain student's rollno string
      records = await Academic.find({ rollno: req.user.rollno }); // match by rollno string
    } else {
      records = await Academic.find(); // admin and teacher get all records
    }
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching records', error: err.message });
  }
});


// Update academic record
router.put('/updateAcademic/:id', verifyToken, async (req, res) => {
  try {
    const updated = await Academic.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: 'Academic record updated', updated });
  } catch (err) {
    res.status(500).json({ message: 'Error updating record', error: err.message });
  }
});

// Delete academic record
router.delete('/deleteAcademic/:id', verifyToken, async (req, res) => {
  try {
    await Academic.findByIdAndDelete(req.params.id);
    res.json({ message: 'Academic record deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting record', error: err.message });
  }
});

module.exports = router;