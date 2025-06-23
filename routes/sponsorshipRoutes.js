const express = require('express');
const router = express.Router();
const verifyToken=require('../middleware')
const Sponsorship = require('../models/sponsorshipModel');


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


router.get('/getSponsorships',verifyToken, async (req, res) => {
    const sponsorship = await Sponsorship.find(decision);
    if(sponsorship.decision=="accepted"){
        res.json({ message: 'Accepted Sponsorship : ', sponsorship:sponsorship });
    }
    else if(sponsorship.decision=="rejected"){
        res.json({ message: 'Rejected Sponsorship : ', sponsorship:sponsorship });
    }
    else if(sponsorship.decision=="pending"){
        res.json({ message: 'Pending Sponsorship : ', sponsorship:sponsorship });
    }else{
         res.json({message: "Couldn't fetch data of sponsorship", error});
    }
    
})


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
