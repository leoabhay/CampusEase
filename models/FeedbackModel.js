const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    feedbackBy: { type: String, required: true },
    feedbackFor: { type: String, required: true },
    feedbackGroup: {
        type: String,
        enum: ['Admin', 'Teacher'], required: true
    },
    feedbackAbout: { type: String, required: true },
});

const Feedback = mongoose.model('feedback', FeedbackSchema);

module.exports = Feedback;