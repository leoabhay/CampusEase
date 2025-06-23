const express = require('express');
const router = express.Router()
const addClub = require('../models/addClubModel');
const verifyToken = require('../middleware')

router.post('/addClub', verifyToken, async (req, res) => {
    try {
      const existingClub = await addClub.findOne({ contactEmail: req.body.contactEmail });
      if (existingClub) {
        return res.status(400).json({ message: 'A club with this contact email already exists.' });
      }
  
      const currentDate = new Date();
      const formattedDate = currentDate.toDateString();
      const newClub = new addClub({
        clubStatus: req.body.clubStatus,
        clubName: req.body.clubName,
        contactNumber: req.body.contactNumber,
        contactEmail: req.body.contactEmail,
        createdDate: formattedDate,
      });
  
      await newClub.save();
      res.json({ message: 'Club saved successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Something went wrong', error });
    }
  });

router.get('/getClubList', verifyToken, async (req, res) => {
    const clubName = await addClub.find();
    res.json({ clubName: clubName });
})
router.get('/getClubList/:id', verifyToken, async (req, res) => {
    try {
        const clubListById = await addClub.findById(req.params.id);
        res.status(200).send(clubListById);
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});


router.put('/updateClub/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updatedClub = await addClub.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedClub) {
            return res.status(404).json({ message: 'Club not found' });
        }

        res.json({ message: 'Club updated successfully', updatedClub });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
});


router.delete('/deleteClub/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const deletedClub = await addClub.findByIdAndDelete(id);

        if (!deletedClub) {
            return res.status(404).json({ message: 'Club not found' });
        }

        res.json({ message: 'Club deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong', error });
    }
})


module.exports = router;
