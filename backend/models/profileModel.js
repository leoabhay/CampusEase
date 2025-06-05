const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  photo: {type: String,},
  rollno: {type: Number, unique: true, sparse: true},
  phone: {type: String, unique: true},
  address: {type: String,},
  biography: {type: String,}
});

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;