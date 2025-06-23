const mongoose= require('mongoose');

const giveAssignmentSchema= new mongoose.Schema({
    subject:{type: String, required:true},
    assignmentName:{type:String}, 
    assignmentFile:{type:String},
    remarks:{type:String},
    dueDate: { type: Date } 
})
const Assignment = mongoose.model('give_assignment',giveAssignmentSchema)
module.exports = Assignment;