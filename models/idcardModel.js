const mongoose= require('mongoose');

const idcardSchema= new mongoose.Schema({
    name:{type:String, required:true},
    rollno:{ type:Number, required:true},
    email:{type:String, required:true},
    semester:{ type: String, required:true},
    contactNo:{ type:Number, required:true},
    department: { type: String, required:true},
    validuntil:{ type: String},
    reason:{ type: String, required:true},
    photo:{type : String}
})
const IdCard = mongoose.model('IdCard', idcardSchema)
module.exports = IdCard;