const mongoose= require('mongoose');

const AcademicRecordSchema= new mongoose.Schema({
    name: { type: String, required:true },
    rollno: { type: Number, required:true },
    subject: { type: String, required:true },
    credit: { type: Number, required:true },
    grade: { type: Number, required:true }
});

const AcademicRecord = mongoose.model('academicRecord',AcademicRecordSchema)

module.exports = AcademicRecord;