const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const auth = require('../middleware/auth');

// Placeholder route that returns empty data
router.get('/', auth, routeController.getAllRoutes);

module.exports = router;