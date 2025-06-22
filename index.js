const express = require('express');
const app = express();
const connectdb = require('./db');
const cors = require('cors');

const path = require('path'); 

const userRoutes= require('./routes/userRoute')
const profileRoutes=require('./routes/profileRoutes')
const sendemail=require('./routes/sendemailRoutes');

app.use(express.json());
app.use(cors());

app.use(userRoutes);
app.use(profileRoutes);
app.use(sendemail);

  // Serve static files from the "uploads" directory
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(3200,()=>{
    console.log('Server is connected');
})