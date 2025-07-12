const mongoose = require('mongoose');

const formSponsorshipSchema = new mongoose.Schema({
  name: { type: String, },
  faculty: { type: String, required: true },
  semester: { type: String, required: true },
  topic: { type: String, required: true },
  money: { type: String, required: true },
  reason: { type: String, required: true },
  decision:{type: String, required:true},
  sponsor:{type:String,required:true}
});

const SponsorshipForm = mongoose.model('sponsorshipForm', formSponsorshipSchema);

module.exports = SponsorshipForm;