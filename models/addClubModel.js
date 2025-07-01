const mongoose = require('mongoose');

const addClubSchema = new mongoose.Schema({
    clubStatus: {type: String, required: true},
    clubName: {type: String, required: true},
    contactNumber: {type: String, required: true},
    contactEmail:{type:String, required:true},
    createdDate: { type: String }
});

const addClubname = mongoose.model('addClub', addClubSchema);

module.exports = addClubname;