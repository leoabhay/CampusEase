const mongoose= require('mongoose');
const mongodb = require ('mongodb');

mongoose
.connect("mongodb+srv://abhaycdry10:Abhay123andres@cluster0.lresqtr.mongodb.net/")
 .then(()=>{
    console.log('Database is connected successfully');
   
 })
 .catch((error)=>{
    console.log('Database cannot be connected',error);
});