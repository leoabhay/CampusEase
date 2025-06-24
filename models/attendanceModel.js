const mongoose= require('mongoose');

const AttendanceSchema= new mongoose.Schema({
    Email:{type:Number},
    EnteredOtp:{type: String},
    Name:{type: String, required:true},
    Rollno:{type:Number},
    Subject:{type: String},
    Date:{type: String},
    FaceRegistered: { type: Boolean, default: false },
   
    Remarks:{
        type:String
    }
})
const Attendance = mongoose.model('attendance',AttendanceSchema)
module.exports = Attendance;