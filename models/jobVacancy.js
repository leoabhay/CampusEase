const mongoose = require('mongoose');

const vacancySchema = new mongoose.Schema({
    vacancyPosition: { type: String, required: true },
    vacancyExperience: { type: String, required: true },
    vacancyLevel: { type: String, required: true },
    vacancySubject: { type: String, required: true },
    vacancyQualification: { type: String, required: true },
    time: { type: String, required: true },
    vacancySalary: { type: String, required: true }
});

const Vacancy = mongoose.model('Vacancy', vacancySchema);

module.exports = Vacancy;