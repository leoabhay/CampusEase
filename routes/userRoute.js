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
        const token = jwt.sign({ email: userData.email, userId: userData._id , name: userData.name , rollno: userData.rollno , userRole: userData.role }, 'secretKey');

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

// router.put('/userdata/:id', verifyToken,upload.single("photo"), async (req, res) => {
//   try {
//     const { address,biography,facebook,instagram,whatsapp,website }= req.body;
//     const file = req.file;
//     const updateData = {
//       address,
//       // photo:`http://localhost:3200/uploads/${file.filename}`,
//       biography,
//       facebook,
//       instagram,
//       whatsapp,
//       website
//     }
//     if (file) {
//       updateData.photo = `http://localhost:3200/uploads/${file.filename}`;
//     }
//       const updatedUser = await userRegister.findByIdAndUpdate(
//         req.params.id,
//         {$set: updateData},
//         { new: true }
//     );
  
//     res.json({ message: 'Profile updated successfully!', userdata: updatedUser });
//   } catch (error) {
//       res.status(500).json({ message: 'Something went wrong', error });
//   }
// });


router.put('/userdata/:id', verifyToken, upload.single("photo"), async (req, res) => {
  try {
    const { address, biography, facebook, instagram, whatsapp, website } = req.body;
    const file = req.file;

    const updateData = {};

    if (address && address !== "") {
      updateData.address = address;
    }
    // Add other fields similarly
    if (biography && biography !== "") {
      updateData.biography = biography;
    }
    if (facebook && facebook !== "") {
      updateData.facebook = facebook;
    }
    if (instagram && instagram !== "") {
      updateData.instagram = instagram;
    }
    if (whatsapp && whatsapp !== "") {
      updateData.whatsapp = whatsapp;
    }
    if (website && website !== "") {
      updateData.website = website;
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
    const {oldpassword, password,confirmPassword}=req.body;
    const user= await userRegister.findById(req.params.id);
  if(user.password != oldpassword){
    return res.status(400).json({ error: 'Password did not match' });
  }
  else{
    if(password != confirmPassword){
      return res.status(404).json({ error: 'New Password did not match' });
    }else{
      const userData= { password,confirmPassword };
      const updateduserdata = await userRegister.findByIdAndUpdate(
        req.params.id,
        userData,
        { new: true }
    );
    res.json({ message: 'Password updated successfully', userdata: updateduserdata });
  
    }
      }
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
router.get('/students/search', verifyToken, async (req, res) => {
  try {
    const { name, rollno , email } = req.query;

    // Build the query object based on the provided parameters
    const query = {};
    if (name) {
      query.name = name;
    }
    if (email) {
      query.email = email;
    }
    if (rollno) {
      query.rollno = rollno;
    }

    // Ensure at least one parameter is provided
    if (!name && !rollno && !email) {
      return res.status(400).json({ message: 'At least one of name,email or roll number must be provided' });
    }

    const students = await userRegister.find(query).lean().exec();
    if (!students || students.length === 0) {
      return res.status(404).json({ message: 'No students found' });
    }

    res.status(200).json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
});


module.exports = router;


