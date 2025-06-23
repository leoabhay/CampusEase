const express = require('express');
const router = express.Router()
const AcademicRecord = require('../models/AcademicRecordModel');
const Signup=require('../models/signupModel');
const verifyToken=require('../middleware')

router.post('/postAcademicRecord',verifyToken,async (req, res) => {
    try {
        const newAcademicRecord = new AcademicRecord({
            Name: req.body.Name,
            Rollno: req.body.Rollno,
            Subject: req.body.Subject,
            Credit: req.body.Credit,
            Grade:req.body.Grade
        });
       
        await newAcademicRecord.save();
        res.json({ message: 'AcademicRecord saved sucessfully ' });
    }
    catch (error) {
        res.status(500).json({ messgae: 'something is error', error });
    }
})


router.get('/getAcademicRecordList', verifyToken, async (req, res) => {
    try {
        const AcademicRecords = await AcademicRecord.find();
        res.json({ AcademicRecords });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});


// Read One
router.get('/getAcademicRecord/:id', verifyToken, async (req, res) => {
    try {
      const academicRecord = await AcademicRecord.findById(req.params.id);
      if (!academicRecord) return res.status(404).json({ message: 'AcademicRecord not found' });
      res.json(academicRecord);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching AcademicRecord', error });
    }
  });


router.get('/getAcademicRecordbyemail', verifyToken, async (req, res) => {
    try {
        const { email } = req.user;
        const user = await Signup.findOne({ email });
  
        // If the user is not found, handle the error
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const academicRecords = await AcademicRecord.find({ Name: user.name });
         // Check if AcademicRecord is an empty array
        if (!academicRecords || academicRecords.length === 0) {
          return res.status(404).json({ message: 'No AcademicRecords found' });
        }
        res.json({ AcademicRecords: academicRecords });
       
    } catch (error) {
        console.error('Error fetching AcademicRecord:', error); // Log the error
        res.status(500).json({ message: 'Error fetching AcademicRecord', error: error.message });
    }
  });


  // Update
router.put('/putAcademicRecord/:id', verifyToken, async (req, res) => {
    try {
      const {name,rollno}=req.user;
      const {  Subject, Credit, Grade } = req.body;
      const updatedAcademicRecord = await AcademicRecord.findByIdAndUpdate(req.params.id, { name, rollno, Subject, Credit, Grade }, { new: true });
      if (!updatedAcademicRecord) return res.status(404).json({ message: 'AcademicRecord not found' });
      res.json(updatedAcademicRecord);
    } catch (error) {
      res.status(500).json({ message: 'Error updating AcademicRecord', error });
    }
  });
  
  // Delete
  router.delete('/delAcademicRecord:id', verifyToken, async (req, res) => {
    try {
      const deletedAcademicRecord = await AcademicRecord.findByIdAndDelete(req.params.id);
      if (!deletedAcademicRecord) return res.status(404).json({ message: 'AcademicRecord not found' });
      res.json({ message: 'AcademicRecord deleted', deletedAcademicRecord });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting AcademicRecord', error });
    }
  });


  module.exports = router;