const express = require('express');
const router = express.Router();
const Fee = require('../models/feeModel');
const verifyToken = require('../middleware');

// Student pays fee
router.post('/payFee', verifyToken, async (req, res) => {
  try {
    const { amount, method } = req.body;

    const studentId = req.user.userId;

    // Always start with 'Unpaid' status regardless of method
    const status = 'Unpaid';

    const fee = new Fee({
      studentId,
      amount,
      method,
      receiptNumber: 'RCPT-' + Date.now(),
      status
    });

    await fee.save();
    res.status(201).json({ message: 'Fee submitted successfully', fee });
  } catch (err) {
    console.error('Error in /payFee:', err);
    res.status(500).json({ message: 'Fee payment failed', error: err.message });
  }
});

// Admin approves payment (any method)
router.patch('/approveFee/:id', verifyToken, async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(400).json({ message: 'Invalid fee' });

    fee.status = 'Paid';
    await fee.save();
    res.json({ message: 'Fee approved', fee });
  } catch (err) {
    res.status(500).json({ message: 'Approval failed', error: err.message });
  }
});

// Admin rejects payment (any method)
router.patch('/rejectFee/:id', verifyToken, async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(400).json({ message: 'Invalid fee' });

    fee.status = 'Rejected';  // or 'Rejected' if you want
    await fee.save();
    res.json({ message: 'Fee rejected', fee });
  } catch (err) {
    res.status(500).json({ message: 'Rejection failed', error: err.message });
  }
});


// Get all fees (admin)
router.get('/getAllFees', verifyToken, async (req, res) => {
  try {
    const fees = await Fee.find()
      .populate('studentId', 'name email rollno')
      .sort({ createdAt: -1 });

    res.json(fees);
  } catch (err) {
    console.error('Error in /getAllFees:', err);
    res.status(500).json({ message: 'Failed to fetch fees', error: err.message });
  }
});

// Get fees by student
router.get('/getFees/:studentId', verifyToken, async (req, res) => {
  try {
    const fees = await Fee.find({ studentId: req.params.studentId })
      .populate('studentId', 'name email rollno')
      .sort({ createdAt: -1 });

    res.json(fees);
  } catch (err) {
    console.error('Error in /getFees/:studentId:', err);
    res.status(500).json({ message: 'Failed to fetch fees', error: err.message });
  }
});

// Delete a fee record
router.delete('/deleteFee/:id', verifyToken, async (req, res) => {
  try {
    const deletedFee = await Fee.findByIdAndDelete(req.params.id);
    if (!deletedFee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }
    res.json({ message: 'Fee record deleted successfully', fee: deletedFee });
  } catch (error) {
    console.error('Error in /deleteFee/:id:', error);
    res.status(500).json({ message: 'Error deleting fee record', error });
  }
});

module.exports = router;
