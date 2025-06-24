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
  }
});

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;
