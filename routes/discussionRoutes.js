const express = require('express');
const router = express.Router();
const verifyToken=require('../middleware')
const Discussion = require('../models/discussionModel');

// create a new discussion
router.post('/discussion',verifyToken,  async (req, res) => {
    try {
        const newDiscussion = new Discussion({
            discussion_topic: req.body.discussion_topic,
            date: req.body.date,
            decision_by: req.user.name,
            decision: req.body.decision
        });
       
        await newDiscussion.save();
        res.json({ message: 'Discussion saved sucessfully ' });
    }
    catch (error) {
        res.json({ messgae: 'something is error', error });
    }
})

// get all discussion
router.get('/getdiscussion', verifyToken, async (req, res) => {
    const discussion = await Discussion.find();
    res.json({ discussion: discussion });
})
router.put('/discussion/:id', verifyToken, async (req, res) => {
    try {
        const updatedDiscussion = await Discussion.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json({ message: 'Discussion updated successfully', discussion: updatedDiscussion });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});
router.get('/discussion/:id', verifyToken, async (req, res) => {
    try {
        const discussion = await Discussion.findById(req.params.id);
        res.status(200).send(discussion);
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// delete a discussion
router.delete('/discussion/:id', verifyToken, async (req, res) => {
    try {
       const discussion=  await Discussion.findByIdAndDelete(req.params.id);
       if(!discussion)
        {
            return res.status(404).json({ message: 'Discussion not found' });
        }
        
        res.json({ message: 'Discussion deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

module.exports = router;