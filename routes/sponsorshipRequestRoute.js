const express = require('express');
const router = express.Router();
const Form = require('../models/sponsoeshipRequestModel');
const verifyToken = require('../middleware');
const Signup = require('../models/signupModel');

// Create new sponsorship
router.post('/postsponsorship', verifyToken, async (req, res) => {
  try {
    const newForm = new Form({

      name: req.user.name,
      faculty: req.body.faculty,
      semester: req.body.semester,
      money: req.body.money,
      topic: req.body.topic,
      reason: req.body.reason,
      decision:req.body.decision,
      sponsor:req.body.sponsor
    });
    await newForm.save();
    res.status(201).json({message: "Sponsorship requested" ,newForm});
  } catch (error) {
    res.status(500).json({ message: 'Error creating form', error });
  }
});

// Read All spponsorship
router.get('/getsponsorship', verifyToken, async (req, res) => {
  try {
    const forms = await Form.find();
    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching forms', error });
  }
});

// Read One sponsorship
router.get('/getsponsorship/:id', verifyToken, async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) return res.status(404).json({ message: 'Form not found' });
    res.json(form);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching form', error });
  }
});

// Read One sponsorship by email
router.get('/getsponsorshipbyemail', verifyToken, async (req, res) => {
  try {
      const { email } = req.user;
      const user = await Signup.findOne({ email });

      // If the user is not found, handle the error
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }
      
      const sponsorships = await Form.find({ name: user.name });
       // Check if sponsorships is an empty array
      if (!sponsorships || sponsorships.length === 0) {
        return res.status(404).json({ message: 'No sponsorships found' });
      }
      res.json({ Sponsorship: sponsorships });
     
  } catch (error) {
      console.error('Error fetching sponsorship details:', error); // Log the error
      res.status(500).json({ message: 'Error fetching sponsorship details', error: error.message });
  }
});

// Read One sponsorship by role
router.get('/getsponsorshipbyrole', verifyToken, async (req, res) => {
  try {
      const {email}=req.user;
      const User=await Signup.findOne({email});
      if (!User) {
          return res.status(404).json({ message: 'User not found' });
      }
      const sponsorship = await Form.find({sponsor:User.email});
      if (!sponsorship || sponsorship.length === 0) {
          return res.status(404).json({ message: 'Sponsor not found' });
      }
      res.json({ sponsorship });
  } catch (error) {
      res.status(500).json({ message: 'Error fetching sponsorship details', error:error.message });
  }
});

// Update sponsorship by id
router.put('/putsponsorshipbyid/:id', verifyToken, async (req, res) => {
  try {
    const {  decision } = req.body;
    const updatedForm = await Form.findByIdAndUpdate(req.params.id, {decision}, { new: true });
    if (!updatedForm) return res.status(404).json({ message: 'Form not found' });
    if(updatedForm.decision=="accepted"){
      res.json({message: "Sponsorship request accepted!! ",updatedForm});
    }
    else if(updatedForm.decision == "rejected"){
      res.json({message: "Sponsorship request rejected!! ",updatedForm});
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating form', error });
  }
});

// Update sponsorship
router.put('/putsponsorship/:id', verifyToken, async (req, res) => {
  try {
    const {name}=req.user;
    const {  faculty, semester, topic, money, reason } = req.body;
    const updatedForm = await Form.findByIdAndUpdate(req.params.id, { name, faculty, semester, topic, money, reason }, { new: true });
    if (!updatedForm) return res.status(404).json({ message: 'Form not found' });
    res.json(updatedForm);
  } catch (error) {
    res.status(500).json({ message: 'Error updating form', error });
  }
});

// Delete sponsorship
router.delete('/delsponsorship/:id', verifyToken, async (req, res) => {
  try {
    const deletedForm = await Form.findByIdAndDelete(req.params.id);
    if (!deletedForm) {
      return res.status(404).json({ message: 'Form not found' });
    }
    res.json({ message: 'Form deleted', deletedForm });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting form', error: error.message });
  }
});

module.exports = router;