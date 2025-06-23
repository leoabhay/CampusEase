const mongoose= require('mongoose');

const createDepartment= new mongoose.Schema({
    createFaculty:{type: String, required:true},
    
    hod:{type: String},
   
})
const createDepartmentList = mongoose.model('depatmentList',createDepartment)
module.exports = createDepartmentList;