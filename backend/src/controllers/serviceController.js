// src/controllers/serviceController.js
const Service = require('../models/service');

const createService = async (req, res) => {
  try {
    const service = new Service({
      ...req.body,
      createdBy: req.user._id
    });
    await service.save();
    res.status(201).json(service);
  } catch (error) {
    res.status(400).json({ message: 'Error creating service', error: error.message });
  }
};

const getServices = async (req, res) => {
  try {
    const services = await Service.find({ createdBy: req.user._id });
    res.json(services);
  } catch (error) {
    res.status(400).json({ message: 'Error fetching services', error: error.message });
  }
};

const deleteService = async (req, res) => {
  try {
    const service = await Service.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting service', error: error.message });
  }
};

module.exports = {
  createService,
  getServices,
  deleteService
};