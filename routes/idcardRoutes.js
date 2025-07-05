const express = require('express');
const router = express.Router();
const IdCard = require('../models/idcardModel');
const Enrollment = require('../models/enrollmentModel');
const UserSubject = require('../models/userSubjectModel');
const verifyToken= require('../middleware');
const Signup = require('../models/signupModel')


router.post('/postIdCard', verifyToken, async (req, res) => {
    try {
      const { email, name, rollno } = req.user;
      const users = await Signup.findOne({email});
      if(!users){
        return res.status(404).send('User not registered');
      }
       //console.log(users.role)
       if (users.role === 'student') {
        const user = await UserSubject.findOne({ userEmail: email });
        if (!user) {
          return res.status(404).send('User is not enrolled');
        }
        // console.log('User subjects:', user.subjects);
        const subjectNames = user.subjects.map(subject => subject.name);
        const subject = await Enrollment.findOne({ 'subjects.name': { $in: subjectNames } });
        if (!subject) {
          return res.status(404).send('Subject not found');
        }
        // Ensure the subjects match exactly
      const userSubjects = new Set(subjectNames);
      const enrollmentSubjects = new Set(subject.subjects.map(subject => subject.name));

      const isSubjectMatch = [...userSubjects].every(subject => enrollmentSubjects.has(subject));

      if (!isSubjectMatch) {
        return res.status(404).send('Subject mismatch');
      }
        console.log('Enrollment',subject);
        const data = new IdCard({
          name,
          email,
          rollno,
          semester: subject.semester,
          contactNo: req.body.contactNo,
          department: subject.department,
         // department:req.body.department,
          reason: req.body.reason,
          photo:users.photo,
          isPaid: true,
          isApproved: false,
        });
        await data.save();
        res.status(200).json({ message: 'Requested for ID-card replacement', data });
      } else {
        res.status(403).json({ message: 'This user cannot report for ID card' });
      }
    } catch (error) {
      res.status(500).send({ message: "Internal server error!", error: error.message });
    }
  });


  router.get('/getIdCard',verifyToken, async(req,res)=>{
    try {
        const idcard = await IdCard.find();
        res.json({ message:"All Idcard fetched", idcard});
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
  }
);

router.get('/getidcardbyEmail',verifyToken,async(req,res)=>{
    try {
        const { email} = req.user;
      const users = await Signup.findOne({email});
      if(!users){
        return res.status(404).send('User not registered');
      }
        const idcard = await IdCard.find({email});
        if(!idcard){
            res.json({ message:"Idcard not found for this student"});
        }
        res.json({ message:"Idcard fetched for students", idcard});
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
});
router.get('/idcard', verifyToken,async(req,res)=>{
  try{
    const { email, name, rollno } = req.user;
      const users = await Signup.findOne({email});
      if(!users){
        return res.status(404).send('User not registered');
      }
      if (users.role === 'student') {
        const user = await UserSubject.findOne({ userEmail: email });
        if (!user) {
          return res.status(404).send('User is not enrolled');
        }
        //console.log('User subjects:', user.subjects);
        const subjectNames = user.subjects.map(subject => subject.name);
        const subject = await Enrollment.findOne({ 'subjects.name': { $in: subjectNames } });
        if (!subject) {
          return res.status(404).send('Subject not found');
        }
        // Ensure the subjects match exactly
      const userSubjects = new Set(subjectNames);
      const enrollmentSubjects = new Set(subject.subjects.map(subject => subject.name));

      const isSubjectMatch = [...userSubjects].every(subject => enrollmentSubjects.has(subject));

      if (!isSubjectMatch) {
        return res.status(404).send('Subject mismatch');
      }
      const registeredDate = new Date(users.registereddate);
      const fourYearsLater = new Date(registeredDate.setFullYear(registeredDate.getFullYear() + 4));
      const formattedDate = fourYearsLater.toDateString(); // Format as 'Fri Jun 07 2028'
      
      const data = [
        { 
          Name: name, 
          Rollno: rollno, 
          Semester: subject.semester, 
          Department: subject.department, 
          ValidUntil: formattedDate,
          Photo: users.photo,
        }
      ];
      return res.status(200).json({ message: 'Requested for ID-card', data});
      }else {
        return res.status(403).json({ message: 'This user cannot report for ID card' });
      }
  }catch(error){
    return res.status(500).send({message:"Internal server error!",error:error.message });
  }
});

router.delete('/deleteIdCard/:id', async (req, res) => {
    try {
      const deletedIdCard = await IdCard.findByIdAndDelete(req.params.id);
      if (!deletedIdCard) return res.status(404).json({ message: 'IdCard not found' });
      res.json({ message: 'IdCard deleted', deletedIdCard });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting IdCard', error });
    }
  });

// Approve payment (set isPaid to true)
router.post('/approvePayment/:id', async (req, res) => {
  try {
    const updatedCard = await IdCard.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );

    if (!updatedCard) {
      return res.status(404).json({ message: 'IdCard not found' });
    }

    res.json({ message: 'Payment approved', updatedCard });
  } catch (error) {
    res.status(500).json({ message: 'Error approving payment', error: error.message });
  }
});

// Decline payment (set isPaid to false)
router.post('/declinePayment/:id', async (req, res) => {
  try {
    const updatedCard = await IdCard.findByIdAndUpdate(
      req.params.id,
      { isPaid: false },
      { new: true }
    );

    if (!updatedCard) {
      return res.status(404).json({ message: 'IdCard not found' });
    }

    res.json({ message: 'Payment declined', updatedCard });
  } catch (error) {
    res.status(500).json({ message: 'Error declining payment', error: error.message });
  }
});


router.put('/IDCardUpdate/:id', async (req, res) => {
  console.log('PUT /IDCardUpdate called with id:', req.params.id);
  console.log('Request body:', req.body);

  try {
    const updatedCard = await IdCard.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedCard) {
      return res.status(404).json({ message: 'ID card not found' });
    }

    res.json({ message: "Updated successfully!", updatedCard });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


module.exports = router;