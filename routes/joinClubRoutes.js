const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware');
const JoinClub = require('../models/joinClubModel');
const Signup= require('../models/signupModel');
const Club=require('../models/addClubModel');

// Create a new joinClub record
router.post('/joinclub', verifyToken, async (req, res) => {
    try {
        // Check if the user has already joined the same club
        const existingJoinClub = await JoinClub.findOne({
            joinedBy: req.user.email,
            clubName: req.body.clubName
        });

        if (existingJoinClub) {
            return res.status(400).json({ message: 'You have already joined this club' });
        }

        const currentDate = new Date();
        const formattedDate = currentDate.toDateString(); // Format as 'Fri Jun 07 2024'

        const newJoinClub = new JoinClub({
            joinedBy: req.user.email,
            joinedDate: formattedDate,
            clubStatus: req.body.clubStatus,
            clubName: req.body.clubName,
            reason: req.body.reason,
            decision: req.body.decision
        });
        
        await newJoinClub.save();
        res.status(201).json({ message: 'New club joined successfully', joinClub: newJoinClub });
    } catch (error) {
        res.status(500).json({ message: 'Error creating joinClub record', error });
    }
});

// Get all joinClub records
router.get('/joinclub', verifyToken, async (req, res) => {
    try {
        const joinClubs = await JoinClub.find();
        res.json(joinClubs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching joinClub records', error });
    }
});

// Get joinClubs record by email
router.get('/getjoinedclubbyemail', verifyToken, async (req, res) => {
    try {
        const { email } = req.user;

        // Find the user details by email
        const user = await Signup.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find the joinClub records for the user
        const joinClubs = await JoinClub.find({ joinedBy: user.email });
        if (!joinClubs || joinClubs.length === 0) {
            return res.status(404).json({ message: 'Join club records not found' });
        }

        // Add user's name to each joinClub record
        const joinClubsWithName = joinClubs.map(joinClub => ({
            ...joinClub._doc,
            joinedBy: user.name
        }));

        // Classify join clubs by decision
        const classifiedClubs = {
            Requested_Clubs: [],
            Accepted_Clubs: [],
            Rejected_Clubs: []
        };

        joinClubsWithName.forEach(joinClub => {
            if (joinClub.decision === 'Pending') {
                classifiedClubs.Requested_Clubs.push(joinClub);
            } else if (joinClub.decision === 'Accepted') {
                classifiedClubs.Accepted_Clubs.push(joinClub);
            } else if (joinClub.decision === 'Rejected') {
                classifiedClubs.Rejected_Clubs.push(joinClub);
            }
        });

        res.json(classifiedClubs);

    } catch (error) {
        console.error('Error fetching joinClub records:', error);
        res.status(500).json({ message: 'Error fetching joinClub records', error: error.message });
    }
});

// Get joinClub records by clubname
router.get('/getjoinedclubbyclubname', verifyToken, async (req, res) => {
    try {
        const { email } = req.user;
        const user = await Signup.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'secretary') {
            return res.status(403).json({ message: 'Access Denied: Only club secretaries can access this data' });
        }

        const club = await Club.findOne({ contactEmail: user.email });

        if (!club) {
            return res.status(404).json({ message: 'Club not found or you do not have access to this club' });
        }

        const joinClubs = await JoinClub.find({ clubName: club.clubName });

        if (!joinClubs || joinClubs.length === 0) {
            return res.status(404).json({ message: 'Join club record not found' });
        }

        // Fetch all student names concurrently
        const joinClubsWithName = await Promise.all(joinClubs.map(async joinClub => {
            const student = await Signup.findOne({ email: joinClub.joinedBy });
            return {
                ...joinClub._doc,
               // joinedBy: student ? student.name : joinClub.joinedBy // Use email if student not found
               joinedBy: student.name
            };
        }));

        // Classify join clubs by decision
        const classifiedClubs = {
            Requested_Clubs: [],
            Accepted_Clubs: [],
            Rejected_Clubs: []
        };

        joinClubsWithName.forEach(joinClub => {
            if (joinClub.decision === 'Pending') {
                classifiedClubs.Requested_Clubs.push(joinClub);
            } else if (joinClub.decision === 'Accepted') {
                classifiedClubs.Accepted_Clubs.push(joinClub);
            } else if (joinClub.decision === 'Rejected') {
                classifiedClubs.Rejected_Clubs.push(joinClub);
            }
        });

        res.json(classifiedClubs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching joinClub record', error: error.message });
    }
});

// Update joinClub record by ID
router.put('/joinclubbyid/:id', verifyToken, async (req, res) => {
    try {
        const {decision}=req.body;
        const updatedJoinClub = await JoinClub.findByIdAndUpdate(req.params.id, {decision}, { new: true });
        if (!updatedJoinClub) {
            return res.status(404).json({ message: 'Join club record not found' });
        }
        if(updatedJoinClub.decision=="Accepted"){
            res.json({ message: 'Join club requested accepted !!', updatedJoinClub });
        }
        else if(updatedJoinClub.decision=="Rejected"){
            res.json({ message: 'Join club requested rejected !!', updatedJoinClub });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating joinClub record', error });
    }
});

// Update a joinClub record
router.put('/joinclub/:id', verifyToken, async (req, res) => {
    try {
        const updatedJoinClub = await JoinClub.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedJoinClub) {
            return res.status(404).json({ message: 'Join club record not found' });
        }
        res.json({ message: 'Join club record updated successfully', joinClub: updatedJoinClub });
    } catch (error) {
        res.status(500).json({ message: 'Error updating joinClub record', error });
    }
});

// Delete a joinClub record
router.delete('/joinclub/:id', verifyToken, async (req, res) => {
    try {
        const deletedJoinClub = await JoinClub.findByIdAndDelete(req.params.id);
        if (!deletedJoinClub) {
            return res.status(404).json({ message: 'Join club record not found' });
        }
        res.json({ message: 'Join club record deleted successfully', joinClub: deletedJoinClub });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting joinClub record', error });
    }
});

module.exports = router;