const express = require('express');
const router = express.Router();
const FeedbackModel = require('../models/FeedbackModel');
const verifyToken = require('../middleware');
const Signup = require('../models/signupModel');

// Create a new feedback
router.post('/addFeedback', verifyToken, async (req, res) => {
    try {
        const newFeedback = new FeedbackModel({
            feedbackBy: req.user.email,
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

// Get all feedback (with names for both feedbackBy and feedbackFor)
router.get('/getFeedbackList', verifyToken, async (req, res) => {
    try {
        const feedbackListRaw = await FeedbackModel.find();
        const feedbackList = await Promise.all(
            feedbackListRaw.map(async fb => {
                const feedbackByUser = await Signup.findOne({ email: fb.feedbackBy });
                const feedbackForUser = await Signup.findOne({ email: fb.feedbackFor });

                return {
                    ...fb._doc,
                    feedbackBy: feedbackByUser ? feedbackByUser.name : fb.feedbackBy,
                    feedbackFor: feedbackForUser ? feedbackForUser.name : fb.feedbackFor
                };
            })
        );
        res.json({ feedbackList });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching feedback list', error });
    }
});

// Get feedback received by the logged-in user (as receiver)
router.get('/getFeedbackbyrole', verifyToken, async (req, res) => {
    try {
        const { email } = req.user;
        const User = await Signup.findOne({ email });

        if (!User) {
            return res.status(404).json({ message: 'User not found' });
        }

        const feedback = await FeedbackModel.find({ feedbackFor: User.email });

        if (!feedback || feedback.length === 0) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        const feedbackByName = await Promise.all(feedback.map(async fb => {
            const sentby = await Signup.findOne({ email: fb.feedbackBy });
            const sentto = await Signup.findOne({ email: fb.feedbackFor });
            return {
                ...fb._doc,
                feedbackBy: sentby ? sentby.name : 'Unknown',
                feedbackFor: sentto ? sentto.name : fb.feedbackFor
            };
        }));

        res.json({ feedbackByName });
    } catch (error) {
        console.error('Error in /getFeedbackbyrole:', error);
        res.status(500).json({ message: 'Error fetching feedback', error: error.message });
    }
});

// Get feedback sent by the logged-in user (as sender)
router.get('/getFeedbackbyemail', verifyToken, async (req, res) => {
    try {
        const { email } = req.user;
        // console.log('Logged-in user email:', email);

        const user = await Signup.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const feedback = await FeedbackModel.find({ feedbackBy: email });
        // console.log('Feedback found:', feedback);

        // Instead of 404, send empty array if none found
        if (!feedback || feedback.length === 0) {
            return res.json({ feedback: [] }); // No feedback but success response
        }

        const feedbackByName = await Promise.all(
            feedback.map(async fb => {
                const feedbackForUser = await Signup.findOne({ email: fb.feedbackFor });
                return {
                    ...fb._doc,
                    feedbackBy: user.name,
                    feedbackFor: feedbackForUser ? feedbackForUser.name : fb.feedbackFor
                };
            })
        );

        res.json({ feedback: feedbackByName });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ message: 'Error fetching feedback', error: error.message });
    }
});

// get all feedback by name for admin
router.get('/getAllFeedback', verifyToken, async (req, res) => {
  try {
    const allFeedback = await FeedbackModel.find();

    // Map feedback with names
    const enrichedFeedback = await Promise.all(allFeedback.map(async (fb) => {
      const sentByUser = await Signup.findOne({ email: fb.feedbackBy });
      const feedbackForUser = await Signup.findOne({ email: fb.feedbackFor });

      return {
        ...fb._doc,
        feedbackByName: sentByUser ? sentByUser.name : fb.feedbackBy,
        feedbackForName: feedbackForUser ? feedbackForUser.name : fb.feedbackFor,
      };
    }));

    res.json({ feedbackList: enrichedFeedback });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all feedback', error });
  }
});

// Update a feedback
router.put('/updateFeedback/:id', async (req, res) => {
  try {
    // Make a copy of the update data
    const updateData = { ...req.body };

    // Remove feedbackBy to prevent changes
    if ('feedbackBy' in updateData) {
      delete updateData.feedbackBy;
    }

    const updatedFeedback = await FeedbackModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedFeedback) return res.status(404).json({ message: 'Feedback not found' });

    res.json(updatedFeedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
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