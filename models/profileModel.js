const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  photo: {
    type: String,
  },
  rollno: {
    type: Number,
  },
  address: {
    type: String,
  },
  biography: {
    type: String,
  },
  facebook: {
    type: String,
  },
  instagram: {
    type: String,
  },
  whatsapp: {
    type: String,
  },
  website: {
    type: String,
  },
});

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;
