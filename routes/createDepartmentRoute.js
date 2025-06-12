
const express = require('express');
const router = express.Router();
const createDepartmentListModel = require('../models/createDepartmentModel');
const verifyToken = require('../middlewares/middleware');

// route to create a new department
router.post('/createDepartments', async (req, res) => {
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

// route to get all departments
router.get('/getDepartments', async (req, res) => {
    try {
        const departments = await createDepartmentListModel.find();
        res.status(200).send(departments);
    } catch (error) {
        res.status(500).send(error);
    }
});

// route to get a specific department by id
router.get('/getDepartments/:id', async (req, res) => {
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

// route to update a specific department by id
router.put('/updateDepartments/:id', async (req, res) => {
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

// route to delete a specific department by id
router.delete('/deleteDepartments/:id', async (req, res) => {
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

// check if the user route is working
router.get('/', (req, res) => {
  res.send('Department route is working!');
});

module.exports = router;