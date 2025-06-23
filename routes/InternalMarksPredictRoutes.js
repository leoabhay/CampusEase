const express = require('express');
const router = express.Router();
const calculateAndUpdateInternalMarks = require('../utils/InternalMarksPredict');

router.post('/calculate-internal-marks', async (req, res) => {
    try {
        await calculateAndUpdateInternalMarks();
        res.status(200).json({ message: 'Internal marks calculated and updated successfully' });
    } catch (error) {
        console.error('Error calculating internal marks:', error);
        res.status(500).json({ message: 'Internal marks calculation failed', error });
    }
});

module.exports = router;