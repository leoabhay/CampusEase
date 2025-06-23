
const express = require('express');
const router = express.Router();
const createDepartmentListModel = require('../models/createDepartmentModel');
const verifyToken = require('../middleware');

router.post('/postDepartments', async (req, res) => {
    try {
        const existingDepartment = await createDepartmentListModel.findOne({ hod: req.body.hod });
        if (existingDepartment) {
            return res.status(400).json({ message: 'This teacher is already the head of a department.' });
        }

        const department = new createDepartmentListModel(req.body);
        await department.save();
        res.status(201).send(department);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.get('/getDepartments', async (req, res) => {
    try {
        const departments = await createDepartmentListModel.find();
        res.status(200).send(departments);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/departments/:id', async (req, res) => {
    try {
        const department = await createDepartmentListModel.findById(req.params.id);
        if (!department) {
            return res.status(404).send('Department not found');
        }
        res.status(200).send(department);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.put('/departments/:id', async (req, res) => {
    try {
        // const department = await createDepartmentListModel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        const department = await createDepartmentListModel.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!department) {
            return res.status(404).send('Department not found');
        }
        res.status(200).send(department);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.delete('/departments/:id', async (req, res) => {
    try {
        const department = await createDepartmentListModel.findByIdAndDelete(req.params.id);
        if (!department) {
            return res.status(404).send('Department not found');
        }
        res.status(200).send(department);
    } catch (error) {
        res.status(500).send(error);
    }
});


module.exports = router;
