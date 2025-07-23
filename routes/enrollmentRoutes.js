const express = require('express');
const router = express.Router();
const Enrollment = require('../models/enrollmentModel')
const UserSubjects  = require('../models/userSubjectModel')
const verifyToken=require('../middleware')
const Signup = require('../models/signupModel');

// create a new enrollment
router.post('/enrollmentCreate', async (req, res) => {
  try {
    const { enrollmentKey, semester, department, subjects } = req.body;

    // Loop through each subject to validate
    for (const subject of subjects) {
      const existingEnrollment = await Enrollment.findOne({
        semester: semester,
        "subjects.teacher": subject.teacher,
      });

      if (existingEnrollment) {
        return res.status(400).json({
          message: `Teacher ${subject.teacher} is already assigned to a subject in semester ${semester}`,
        });
      }
    }

    const enrollment = new Enrollment({
      enrollment_key: enrollmentKey,
      semester,
      department,
      subjects,
    });

    const savedEnrollment = await enrollment.save();
    res.status(201).json(savedEnrollment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// get all enrollments
router.get('/enrollmentData',verifyToken, async (req, res) => {
  try {
    const enrollments = await Enrollment.find();
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// get all enrollments
router.get('/enrollmentData/subjects', verifyToken, async (req, res) => {
  try {
    const { email } = req.user;
      const enrollments = await Enrollment.find({});
      const subjects = enrollments.flatMap(enrollment => enrollment.subjects.filter(subject =>subject.teacher === email));
      const count = subjects.length; // Get the count of subjects
      res.json({subjects, count});
  } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

// get all enrollments
router.get('/subjectsList', verifyToken, async (req, res) => {
  try {
    // const { email } = req.user;
      const enrollments = await Enrollment.find({});
      const subjects = enrollments.flatMap(enrollment => enrollment.subjects);
      const count = subjects.length; // Get the count of subjects
      res.json({subjects, count});
  } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

// to post the enrollment key form by the student
router.post('/postEnrollmentKeyForm', verifyToken, async (req, res) => {
  try {
    const { enrollment_key,userEmail } = req.body;
    
    const findEnrollmentKey = await Enrollment.findOne({ enrollment_key });
    if (!findEnrollmentKey) {
      console.log('Enrollment key is not found');
      return res.json({ message: 'Enrollment key is not found' });
    }

    // console.log('Associated Subjects:', findEnrollmentKey.subjects);
    const enrolledSubjects = new UserSubjects({
      enrollment_key: findEnrollmentKey.enrollment_key,
      subjects: findEnrollmentKey.subjects,
      userEmail:req.user.email
    });

    await enrolledSubjects.save();


    res.json({ matchEnrollmentKey: true, message: 'Enrollment key is found', subjects: findEnrollmentKey.subjects });
  } catch (error) {
    console.log('Something went wrong', error);
    res.status(500).json({ message: 'Something went wrong', error });
  }
});

// to get data of enrolled student in particular subject
router.get('/enrollmentDatabyEmail',verifyToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const subject = await UserSubjects.findOne({ userEmail: userEmail });
    if (!subject) {
      return res.status(404).json({ message: 'subject not found' });
    }
    res.json(subject);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// to delete the enrollment of the semester by the students 
router.delete('/enrollmentDatabyEmail',verifyToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const subject = await UserSubjects.findOneAndDelete({ userEmail: userEmail });
    if (!subject) {
      return res.status(404).json({ message: 'subject not found' });
    }
    res.json({message:"Enrolled subject deleted successfully",subject});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//to get data of enrolled student in particular subject in teacher dashboard
router.get('/enrollmentDatabyEnrolledsubject', verifyToken, async (req, res) => {
  try {
    const { email } = req.user;
    const user = await Signup.findOne({ email });
  
        // If the user is not found, handle the error
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
         // Find the enrollment details based on the teacher's name
         const enrollment= await Enrollment.findOne({ "subjects.teacher": user.email });
        
         if (!enrollment) {
             return res.status(404).json({ message: 'Enrollment not found' });
         }
         // Extract the subjects taught by this teacher
         const subjectsTaught = enrollment.subjects
         .filter(subject => subject.teacher === user.email)
         .map(subject => subject.name);

        if (subjectsTaught.length === 0) {
          return res.status(404).json({ message: 'No subjects found for this teacher' });
        } 
        const student = await UserSubjects.find({ "subjects.name": { $in: subjectsTaught } });
        // Extract user emails from the student records
    const studentEmails = student.map(students => students.userEmail);

    // Find details of all these students
    const users = await Signup.find({ email: { $in: studentEmails } }, 'name email rollno');
        if(!users){
          return res.status(404).json({ message: 'No students found for this teacher' });
        }
      return res.status(200).json({message:'Enrolled students in are:',  users  });
  } catch (error) {
      res.status(500).json({ error: 'Internal Server Error', error:error.message });
  }
});

// to update the enrollment of the semester by the teacher
router.put('/enrollmentUpdate/:id', async (req, res) => {
  try {
    const { enrollmentKey, subjects, semester, department } = req.body;

    // Check for duplicate teacher assignment in the same semester
    for (const subject of subjects) {
      const existingEnrollment = await Enrollment.findOne({
        _id: { $ne: req.params.id }, // exclude current enrollment
        semester: semester,
        "subjects.teacher": subject.teacher,
      });

      if (existingEnrollment) {
        return res.status(400).json({
          message: `Teacher ${subject.teacher} is already assigned to a subject in semester ${semester}`,
        });
      }
    }

    // Update Enrollment
    const updatedEnrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      {
        enrollment_key: enrollmentKey,
        subjects,
        semester,
        department,
      },
      { new: true }
    );

    // Also update UserSubjects for students who enrolled using this enrollment key
    const studentEnrollments = await UserSubjects.updateMany(
      { enrollment_key: enrollmentKey },
      { $set: { subjects } }
    );

    res.json({
      message: 'Enrollment updated successfully',
      updatedEnrollment,
      updatedStudentSubjects: studentEnrollments.modifiedCount || 0,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// to get data of enrolled student in particular subject
router.get('/subjects/:id', async (req, res) => {
  try {
    const subject = await Enrollment.findOne({ 'subjects._id': req.params.id });
    if (!subject) {
      return res.status(404).send({ message: 'Subject not found' });
    }
    res.send(subject.subjects[0]);
  } catch (error) {
    res.status(500).send({ message: 'Server Error' });
  }
});

// to delete the enrollment of the semester by the teacher
router.delete('/enrollmentDelete/:id', async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndDelete(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    res.json({ message: 'Enrollment deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// to delete the subject of the semester by the teacher
router.delete('/deleteSubject/:enrollmentId/:subjectCode', verifyToken, async (req, res) => {
  try {
      const { enrollmentId, subjectCode } = req.params;

      const enrollment = await Enrollment.findById(enrollmentId);
      if (!enrollment) {
          return res.status(404).json({ message: 'Enrollment not found' });
      }

      const subjectIndex = enrollment.subjects.findIndex(subject => subject.code === subjectCode);
      if (subjectIndex === -1) {
          return res.status(404).json({ message: 'Subject not found' });
      }

      enrollment.subjects.splice(subjectIndex, 1); // Remove the subject
      await enrollment.save();

      res.json({ message: 'Subject deleted successfully', enrollment });
  } catch (error) {
      console.error('Error deleting subject:', error);
      res.status(500).json({ message: 'Something went wrong', error });
  }
});

module.exports = router;