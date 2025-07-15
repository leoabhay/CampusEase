const express = require('express');
const router = express.Router();
const verifyToken=require('../middleware')
const Sponsorship = require('../models/sponsorshipModel');

// create a new sponsorship
router.post('/sponsorship',verifyToken, async (req, res) => {
    try {
        const newSponsorship = new Sponsorship({
            name: req.body.name,
            faculty: req.body.faculty,
            semester: req.body.semester,
            status: req.body.status,
            topic:req.body.topic,
            money:req.body.money,
            reason:req.body.reason,
            date:req.body.date,
            decision:req.body.decision
        });
       
        await newSponsorship.save();
        res.json({ message: 'Sponsorship saved sucessfully ' });
    }
    catch (error) {
        res.json({ messgae: 'something is error', error });
    }
})

// get all sponsorships
router.get('/getSponsorships', verifyToken, async (req, res) => {
  try {
    const { decision } = req.query; // accepted, rejected, pending

    let filter = {};
    if (decision) {
      filter.decision = decision; // filter by decision if provided
    }

    const sponsorships = await Sponsorship.find(filter);

    if (!sponsorships || sponsorships.length === 0) {
      return res.status(404).json({ message: 'No sponsorships found with the given decision' });
    }

    res.json({ message: `Sponsorships${decision ? ' with decision: ' + decision : ''}`, sponsorships });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sponsorships', error: error.message });
  }
});

// delete a sponsorship
router.delete('/deleteSponsorship/:id',verifyToken,async(req,res)=>{
    try{
        const deletedSponsorship=await Sponsorship.findByIdAndDelete(req.params.id)
        if(!deletedSponsorship){
            return res.status(400).json({message:'Sponsorship not Found'});

        }
        res.json({messgae:'Sponsorship deleted Sucessfully ' , sponsorship:deletedSponsorship})
    }
    catch(error){
        res.status(500).json({ message: 'Error deleting Sponsorship', error });
    }
})

module.exports = router;