const mongoose= require('mongoose');

const AttendanceSchema= new mongoose.Schema({
    email:{type:String},
    // EnteredOtp:{type: String},
    name:{type: String, required:true},
    rollno:{type:Number},
    subject:{type: String},
    date:{type: String},
    // FaceRegistered: { type: Boolean, default: false },
    remarks:{ type:String }
});

const Attendance = mongoose.model('attendance', AttendanceSchema);

module.exports = Attendance;