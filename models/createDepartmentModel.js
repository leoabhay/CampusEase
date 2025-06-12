const mongoose= require('mongoose');

const createDepartment= new mongoose.Schema({
    department: {type: String, required:true },
    hod: {type: String, required:true },
});

const createDepartmentList = mongoose.model('createDepartmentList', createDepartment)

module.exports = createDepartmentList;