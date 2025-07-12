const mongoose= require('mongoose');

const InternalValuationSchema= new mongoose.Schema({
    name:{type: String, required:true},
    rollno:{type:Number}, 
    Valuation_type:{
        type:String,
        enum:['Student Internal Exam Value', 'Student Internal Marks']
    },
    marks:{type:Number},
    remarks:{type:String}
});

const Model_Question = mongoose.model('givemodel_qustion',InternalValuationSchema);

module.exports = Model_Question;