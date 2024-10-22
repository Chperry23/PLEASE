// backend/src/routes/serviceRoutes.js
const express = require('express');
const router = express.Router();
const Service = require('../models/service');
const authMiddleware = require('../middleware/auth');

// Get all services
router.get('/', authMiddleware, async (req, res) => {
  try {
    const services = await Service.find({ user: req.user._id });
    res.status(200).json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services.' });
  }
});

// Create a new service
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, defaultPrice } = req.body;
    const service = new Service({
      user: req.user._id,
      name,
      description,
      defaultPrice,
    });
    await service.save();
    res.status(201).json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Failed to create service.' });
  }
});

// Delete a service
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Service.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.status(200).json({ message: 'Service deleted successfully.' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service.' });
  }
});

module.exports = router;
