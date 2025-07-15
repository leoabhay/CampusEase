const express = require('express');
const router = express.Router();
const ClassSchedule = require('../models/classScheduleModel');
const verifyToken = require('../middleware');

// Add new class schedule
router.post('/addSchedule', async (req, res) => {
  try {
    const newSchedule = new ClassSchedule(req.body);
    await newSchedule.save();
    res.status(201).json({ success: true, message: 'Class schedule added', schedule: newSchedule });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error adding schedule', error: err.message });
  }
});

// Get all schedules
router.get('/getSchedules', async (req, res) => {
  try {
    const schedules = await ClassSchedule.find()
      .populate('faculty', 'name email role') // from register
      .populate('department', 'createFaculty hod'); // from depatmentList
    res.status(200).json({ success: true, schedules });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching schedules', error: err.message });
  }
});

// Get schedules by department, faculty, or day
router.get('/getSchedules/filter', async (req, res) => {
  try {
    const { department, faculty, day } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (faculty) filter.faculty = faculty;
    if (day) filter.day = day;

    const schedules = await ClassSchedule.find(filter)
      .populate('faculty', 'name email')
      .populate('department', 'createFaculty');
    res.status(200).json({ success: true, schedules });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error filtering schedules', error: err.message });
  }
});

// Update schedule
router.put('/updateSchedule/:id', async (req, res) => {
  try {
    const updatedSchedule = await ClassSchedule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json({ success: true, message: 'Schedule updated', schedule: updatedSchedule });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating schedule', error: err.message });
  }
});

// Delete schedule
router.delete('/deleteSchedule/:id', async (req, res) => {
  try {
    await ClassSchedule.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Schedule deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting schedule', error: err.message });
  }
});

module.exports = router;