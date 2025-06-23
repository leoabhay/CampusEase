const express = require('express');
const router = express.Router();
const Event = require('../models/eventModel');
const verifyToken = require('../middleware');  
const Signup = require('../models/signupModel');

router.post('/addEvent', verifyToken, async (req, res) => {
    try {
        const currentDate = new Date();
        const formattedDate = currentDate.toDateString(); // Format as 'Fri Jun 07 2024'

        const newEvent = new Event({
            eventName: req.body.eventName,
            eventDate: req.body.eventDate,
            location: req.body.location,
            description: req.body.description,
            createdBy:req.user.email,
            createdDate:formattedDate
        });

        await newEvent.save();
        res.json({ message: 'Event saved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

// router.get('/getEventList', verifyToken, async (req, res) => {
//     try {
//         const events = await Event.find();
//         res.json({ events });
//     } catch (error) {
//         res.status(500).json({ message: 'Something went wrong', error });
//     }
// });

// Get the list of events
router.get('/getEventList',async (req, res) => {
    try {
        const events = await Event.find();

        const eventsWithCreatorNames = await Promise.all(events.map(async (event) => {
            const user = await Signup.findOne({ email: event.createdBy });
            return {
                ...event._doc,
                createdBy: user ? user.name : event.createdBy // Replace email with name, if user is found
            };
        }));

        res.json(eventsWithCreatorNames);
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

router.get('/getEvent/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const event = await Event.findById(id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json({ event });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});


router.get('/getEventbyemail', verifyToken, async (req, res) => {
    try {
        const { email } = req.user;
        const user = await Signup.findOne({ email });

        // If the user is not found, handle the error
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const events = await Event.find({ createdBy: email });

        // Check if event is an empty array
        if (!events || events.length === 0) {
            return res.status(404).json({ message: 'Events not found' });
        }

        // Add user's name to each event record
        const eventsWithCreatorNames = events.map(event => ({
            ...event._doc,
            createdBy: user.name
        }));

        res.json({ Events: eventsWithCreatorNames });
    } catch (error) {
        console.error('Error fetching event:', error); // Log the error
        res.status(500).json({ message: 'Error fetching events', error: error.message });
    }
});


router.put('/updateEvent/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updatedEvent = await Event.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json({ message: 'Event updated successfully', updatedEvent });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

router.delete('/delEventList/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const deletedEvent = await Event.findByIdAndDelete(id);

        if (!deletedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});

module.exports = router;
