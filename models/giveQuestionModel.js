const mongoose= require('mongoose');

const giveModelQuestinSchema= new mongoose.Schema({
    subject:{type: String, require:true},
    model_question:{type:String}, 
    file:{type:String}
});

const Model_Question = mongoose.model('givemodel_qustion', giveModelQuestinSchema);

module.exports = Model_Question;