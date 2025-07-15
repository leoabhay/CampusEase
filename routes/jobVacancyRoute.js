const express = require('express');
const router = express.Router();
const Vacancy = require('../models/jobVacancy')
// const verifyToken=require('../middleware')

// create a new vacancy
router.post('/postVacancies', async (req, res) => {
    try {
        const vacancy = new Vacancy(req.body);
        await vacancy.save();
        res.status(201).send(vacancy);
    } catch (error) {
        res.status(400).send(error);
    }
});

// get all vacancies
router.get('/getVacancies', async (req, res) => {
    try {
        const vacancies = await Vacancy.find();
        res.status(200).send(vacancies);
    } catch (error) {
        res.status(500).send(error);
    }
});

// get one vacancy
router.get('/vacancies/:id', async (req, res) => {
    try {
        const vacancy = await Vacancy.findById(req.params.id);
        if (!vacancy) {
            return res.status(404).send('Vacancy not found');
        }
        res.status(200).send(vacancy);
    } catch (error) {
        res.status(500).send(error);
    }
});

// update a vacancy
router.put('/vacancies/:id', async (req, res) => {
    try {
        const vacancy = await Vacancy.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!vacancy) {
            return res.status(404).send('Vacancy not found');
        }
        res.status(200).send(vacancy);
    } catch (error) {
        res.status(400).send(error);
    }
});

// delete a vacancy
router.delete('/vacancies/:id', async (req, res) => {
    try {
        const vacancy = await Vacancy.findByIdAndDelete(req.params.id);
        if (!vacancy) {
            return res.status(404).send('Vacancy not found');
        }
        res.status(200).send(vacancy);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;