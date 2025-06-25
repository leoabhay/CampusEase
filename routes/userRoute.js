const express = require('express');
const router = express.Router();
const multer = require('multer');
const userRegister = require('../models/signupModel');
const jwt = require('jsonwebtoken');
const verifyToken=require('../middleware');
const bcrypt=require('bcrypt');


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });


router.post('/signup', async (req, res) => {
  try {
    const { name, email, rollno, address, password, confirmPassword, role } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new userRegister({
      name,
      email,
      rollno,
      address,
      password: hashedPassword,
      confirmPassword: hashedPassword, // You may even omit this from DB
      role,
      isVerified: false, // required field
    });

    await newUser.save();
    res.json({ message: 'Register Successful' });
  } catch (error) {
    return res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
});


// router.get('/getUserData', async (req, res) => {
//     const userData = await userRegister.find();
//     res.json({ userData: userData });
// })

router.get('/user/faculty', async (req, res) => {
    try {
      const faculty = await userRegister.find({ role: 'faculty' });
      const count = await userRegister.countDocuments({ role: 'faculty' });
      res.json({ faculty, count });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
router.get('/user/student', async (req, res) => {
    try {
      const student = await userRegister.find({ role: 'student' });
      const count = await userRegister.countDocuments({ role: 'student' });
      res.json({ student, count });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
router.get('/user/secretary', async (req, res) => {
    try {
      const secretary = await userRegister.find({ role: 'secretary' });
      const count = await userRegister.countDocuments({ role: 'secretary' });
      res.json({ secretary, count });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  

router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await userRegister.findOne({ email });
        if (!userData) {
            console.log("Password doesnot match ", error);
            return res.json({ message: 'username is not found ' });
        }
        if(userData.isVerified !=true){
          return res.json({ message: 'User is not verified. Please verify before login! ',userData });
        }
        const userPasswordMatch = await bcrypt.compare(password, userData.password);
        //const userPasswordMatch = password === userData.password;
        if (!userPasswordMatch) {
            console.log('password doesnot match ');
            return res.json({ message: 'password is incorrect' });
        }
        const userRole = userData.role;
        // const token = jwt.sign({ email: userData.email }, 'secretKey');
        const token = jwt.sign({ email: userData.email, userId: userData._id , name: userData.name , rollno: userData.rollno , role: userData.role }, 'secretKey');

        res.json({ message: 'Login Sucessfull', role: userRole, token: token });
    }
    catch (error) {
      res.status(500).json({ message: 'something went wrong', error: error.stack });


    }
})

router.get('/userdata', async (req, res) => {
    const userData = await userRegister.find();
    res.json({ userData: userData });
})
 


router.get('/getuserdata', verifyToken, async (req, res) =>{
    try{
            const { email } = req.user;
            const userdata= await userRegister.findOne({email});
            if(userdata){
                return res.json({ data: userdata });
            }
            else{
                res.status(404).json({message: "data not found"});
            }
    }catch(error)
    {
        res.status(500).json({ messgae: 'something is error', error });
    }
})


router.put('/userdata/:id', verifyToken, upload.single("photo"), async (req, res) => {
  try {
    const { address } = req.body;
    const file = req.file;

    const updateData = {};

    if (address && address !== "") {
      updateData.address = address;
    }

    if (file) {
      updateData.photo = `http://localhost:3200/uploads/${file.filename}`;
    }

    const updatedUser = await userRegister.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    res.json({ message: 'Profile updated successfully!', userdata: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error });
  }
});


router.put('/password/:id', verifyToken, async (req, res) => {
  try {
    const { oldpassword, password, confirmPassword } = req.body;

    // Fetch user by ID
    const user = await userRegister.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Compare old password with hashed password in DB
    const isMatch = await bcrypt.compare(oldpassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Old password is incorrect' });
    }

    // Check if new passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'New password did not match' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password in DB
    const updatedUser = await userRegister.findByIdAndUpdate(
      req.params.id,
      { password: hashedPassword, confirmPassword: hashedPassword }, // optional to store confirmPassword
      { new: true }
    );

    res.json({ message: 'Password updated successfully', userdata: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error });
  }
});


router.delete('/user/:id', verifyToken,async (req, res) => {
  try {
      const user = await userRegister.findByIdAndDelete(req.params.id);
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }
      res.json({ message: 'User deleted' ,user});
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});


// Filter students by email or roll number
// Search one student
router.get('/students/search', verifyToken, async (req, res) => {
  try {
    const { name, rollno, email } = req.query;

    const query = {};
    if (name) query.name = name;
    if (email) query.email = email;
    if (rollno) query.rollno = rollno;

    if (!name && !rollno && !email) {
      return res.status(400).json({ message: 'At least one of name, email or roll number must be provided' });
    }

    const student = await userRegister.findOne(query).lean().exec();
    if (!student) {
      return res.status(404).json({ message: 'No student found' });
    }

    res.status(200).json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Error fetching student', error: error.message });
  }
});


// // Search one faculty
// router.get('/faculty/search', verifyToken, async (req, res) => {
//   try {
//     const { name, rollno, email } = req.query;

//     const query = {};
//     if (name) query.name = name;
//     if (email) query.email = email;
//     if (rollno) query.rollno = rollno;

//     if (!name && !rollno && !email) {
//       return res.status(400).json({ message: 'At least one of name, email or teacher number must be provided' });
//     }

//     const faculty = await Faculty.findOne(query).lean().exec();
//     if (!faculty) {
//       return res.status(404).json({ message: 'No faculty found' });
//     }

//     res.status(200).json(faculty);
//   } catch (error) {
//     console.error('Error fetching faculty:', error);
//     res.status(500).json({ message: 'Error fetching faculty', error: error.message });
//   }
// });

// // Search one secretary
// router.get('/secretary/search', verifyToken, async (req, res) => {
//   try {
//     const { name, rollno, email } = req.query;

//     const query = {};
//     if (name) query.name = name;
//     if (email) query.email = email;
//     if (rollno) query.rollno = rollno;

//     if (!name && !rollno && !email) {
//       return res.status(400).json({ message: 'At least one of name, email or secretary number must be provided' });
//     }

//     const secretary = await Secretary.findOne(query).lean().exec();
//     if (!secretary) {
//       return res.status(404).json({ message: 'No secretary found' });
//     }

//     res.status(200).json(secretary);
//   } catch (error) {
//     console.error('Error fetching secretary:', error);
//     res.status(500).json({ message: 'Error fetching secretary', error: error.message });
//   }
// });


module.exports = router;