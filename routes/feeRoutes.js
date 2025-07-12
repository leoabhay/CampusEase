const express = require('express');
const router = express.Router();
const Fee = require('../models/feeModel');
const verifyToken = require('../middleware');

// Student pays fee
router.post('/payFee', verifyToken, async (req, res) => {
  try {
    const { studentId, amount, method } = req.body;

    const fee = new Fee({
      studentId,
      amount,
      method,
      receiptNumber: 'RCPT-' + Date.now()
    });

    await fee.save();
    res.status(201).json({ message: 'Fee submitted successfully', fee });
  } catch (err) {
    res.status(500).json({ message: 'Fee payment failed', error: err.message });
  }
});

// Admin approves cash payment
router.patch('/approveFee/:id', verifyToken, async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee || fee.method !== 'Cash') return res.status(400).json({ message: 'Invalid fee or not cash' });

    fee.status = 'Paid';
    await fee.save();
    res.json({ message: 'Cash fee approved', fee });
  } catch (err) {
    res.status(500).json({ message: 'Approval failed', error: err.message });
  }
});

// Admin rejects cash payment
router.patch('/rejectFee/:id', verifyToken, async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee || fee.method !== 'Cash') return res.status(400).json({ message: 'Invalid fee or not cash' });

    fee.status = 'Rejected';
    await fee.save();
    res.json({ message: 'Cash fee rejected', fee });
  } catch (err) {
    res.status(500).json({ message: 'Rejection failed', error: err.message });
  }
});

// Get all fees (admin)
router.get('/getAllFees', verifyToken, async (req, res) => {
  try {
    const fees = await Fee.find().populate('studentId', 'name email rollno');
    res.json(fees);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch fees', error: err.message });
  }
});

// Get fees by student
router.get('/getFees/:studentId', verifyToken, async (req, res) => {
  try {
    const fees = await Fee.find({ studentId: req.params.studentId });
    res.json(fees);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch fees', error: err.message });
  }
});

// delete the fee record
router.delete('/deleteFee/:id', verifyToken, async (req, res) => {
  try {
    const deletedFee = await Fee.findByIdAndDelete(req.params.id);
    if (!deletedFee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }
    res.json({ message: 'Fee record deleted successfully', fee: deletedFee });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting fee record', error });
  }
});

module.exports = router;