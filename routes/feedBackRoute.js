const express = require('express');
const router = express.Router();
const FeedbackModel = require('../models/FeedbackModel');
const verifyToken = require('../middleware');
const Signup= require('../models/signupModel');

// Create a new feedback
router.post('/addFeedback', verifyToken, async (req, res) => {
    try {
        const newFeedback = new FeedbackModel({
            feedbackBy:req.user.email,
            feedbackGroup: req.body.feedbackGroup,
            feedbackAbout: req.body.feedbackAbout,
            feedbackFor: req.body.feedbackFor
        });
        await newFeedback.save();
        res.status(201).json({ message: 'Feedback saved successfully', feedback: newFeedback });
    } catch (error) {
        res.status(500).json({ message: 'Error creating feedback', error });
    }
});

// Get all feedback
router.get('/getFeedbackList', verifyToken, async (req, res) => {
    try {
        const feedbackList = await FeedbackModel.find();
        res.json({ feedbackList });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching feedback list', error });
    }
});

// Get feedback by role
router.get('/getFeedbackbyrole', verifyToken, async (req, res) => {
    try {
        // console.log('User info from token:', req.user);
        const { email } = req.user;
        const User = await Signup.findOne({ email });
        // console.log('User found:', User);

        if (!User) {
            return res.status(404).json({ message: 'User not found' });
        }

        const feedback = await FeedbackModel.find({ feedbackFor: User.email });
        // console.log('Feedback found:', feedback);

        if (!feedback || feedback.length === 0) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        const feedbackByName = await Promise.all(feedback.map(async fb => {
            const sentby = await Signup.findOne({ email: fb.feedbackBy });
            return {
                ...fb._doc,
                feedbackBy: sentby ? sentby.name : 'Unknown'
            };
        }));

        res.json({ feedbackByName });
    } catch (error) {
        console.error('Error in /getFeedbackbyrole:', error);
        res.status(500).json({ message: 'Error fetching feedback', error: error.message });
    }
});

// Get feedback by email
router.get('/getFeedbackbyemail', verifyToken, async (req, res) => {
    try {
        const { email } = req.user;
        const user = await Signup.findOne({ email });

        // If the user is not found, handle the error
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const feedback = await FeedbackModel.find({ feedbackBy: email });

        // Check if feedback is an empty array
        if (!feedback || feedback.length === 0) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        // Add user's name to each feedback record
        const feedbackByName = feedback.map(fb => ({
            ...fb._doc,
            feedbackBy: user.name
        }));

        res.json({ feedback: feedbackByName });
    } catch (error) {
        console.error('Error fetching feedback:', error); // Log the error
        res.status(500).json({ message: 'Error fetching feedback', error: error.message });
    }
});

// Update a feedback
router.put('/updateFeedback/:id', verifyToken, async (req, res) => {
    try {
        const updatedFeedback = await FeedbackModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedFeedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }
        res.json({ message: 'Feedback updated successfully', feedback: updatedFeedback });
    } catch (error) {
        res.status(500).json({ message: 'Error updating feedback', error });
    }
});

// Delete a feedback
router.delete('/deleteFeedback/:id', verifyToken, async (req, res) => {
    try {
        const deletedFeedback = await FeedbackModel.findByIdAndDelete(req.params.id);
        if (!deletedFeedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }
        res.json({ message: 'Feedback deleted successfully', feedback: deletedFeedback });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting feedback', error });
    }
});

module.exports = router;