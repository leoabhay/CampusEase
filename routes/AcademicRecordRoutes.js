const mongoose= require('mongoose');

const AcademicRecordSchema= new mongoose.Schema({
    Name:{type: String, required:true},
    Rollno:{type:Number, required:true},
    Subject:{type: String, required:true},
    Credit:{type: Number, required:true},
    Grade:{ type:Number, required:true}
})
const AcademicRecord = mongoose.model('academicRecord',AcademicRecordSchema)
module.exports = AcademicRecord;