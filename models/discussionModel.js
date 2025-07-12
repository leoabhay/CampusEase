const mongoose= require('mongoose');

const DiscussionSchema= new mongoose.Schema({
    discussion_topic:{type: String, required: true},
    date:{type:String, required: true}, 
    decision_by:{type:String , required: true},
    decision:{type:String , required: true}
});

const Discussion = mongoose.model('discussion',DiscussionSchema);

module.exports = Discussion;