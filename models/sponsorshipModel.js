const mongoose= require('mongoose');

const SponsorshipSchema= new mongoose.Schema({
    name:{type: String},
    faculty:{type:String}, 
    semester:{type:String},
    status:{
        type:String,
        enum:['political','non-political'],
        default:'non-political'
    },
    topic:{type:String},
    money:{type:Number},
    reason:{type: String},
    date:{type: Date},
    decision:{
        type:String,
        enum:['accepted','rejected','pending']
    }
});

const Sponsorship = mongoose.model('sponsorship',SponsorshipSchema);

module.exports = Sponsorship; 