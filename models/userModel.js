const mongoose= require('mongoose');

const registerSchema= new mongoose.Schema({
    name: { type:String },
    photo: { type:String },
    email: { type:String, unique:true, required:true },
    rollno: { type: Number, unique: true, sparse: true },
    phone: { type:String, unique:true },
    address: { type:String },
    biography: { type:String },
    password: { type:String },
    confirmPassword: {type:String },
    role: {
        type: String,
        enum: ['student', 'teacher', 'secretary', 'admin'],
        default: 'student'
    },
    registeredDate:{ type: String },
    isVerified:{ type:Boolean, required:true }
});

const Register = mongoose.model('register', registerSchema);

module.exports = Register;