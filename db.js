const mongoose= require('mongoose');
const mongodb = require ('mongodb');

mongoose
.connect(process.env.MONGO_URI)
 .then(()=>{
    console.log(`Database connected successfully at ${process.env.MONGO_URI}`);
   
 })
 .catch((error)=>{
    console.log('Database cannot be connected',error);
});