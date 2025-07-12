const mongoose = require('mongoose');

const cvSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    cvFilename: String,
}, {
    timestamps: true
});

module.exports = mongoose.model('Cv', cvSchema);