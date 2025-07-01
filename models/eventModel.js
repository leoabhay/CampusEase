const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    eventName: {type: String,required: true},
    eventDate: {type: String,required: true},
    location: {type: String,required: true},
    description: {type: String},
    createdDate: {type: String},
    createdBy:{type: String}
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;