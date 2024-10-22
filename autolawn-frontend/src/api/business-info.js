// In your Express server file (e.g., server.js or app.js)
const express = require('express');
const router = express.Router();
const BusinessInfo = require('../models/businessInfo'); // You'll need to create this model

// GET business info
router.get('/business-info', async (req, res) => {
  try {
    const businessInfo = await BusinessInfo.findOne();
    res.json(businessInfo || {});
  } catch (error) {
    res.status(500).json({ message: 'Error fetching business info', error: error.message });
  }
});

// POST (create/update) business info
router.post('/business-info', async (req, res) => {
  try {
    let businessInfo = await BusinessInfo.findOne();
    if (businessInfo) {
      businessInfo = await BusinessInfo.findOneAndUpdate({}, req.body, { new: true });
    } else {
      businessInfo = new BusinessInfo(req.body);
      await businessInfo.save();
    }
    res.json(businessInfo);
  } catch (error) {
    res.status(500).json({ message: 'Error updating business info', error: error.message });
  }
});

app.use('/api', router);