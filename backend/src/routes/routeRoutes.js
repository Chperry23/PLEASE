const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const auth = require('../middleware/auth');

// Get all routes
router.get('/', auth, routeController.getRoutes);

// Get routes by day (new endpoint to avoid conflicts)
router.get('/day/:day', auth, routeController.getRouteByDay);

// Update a specific route
router.put('/:day/:index', auth, routeController.updateRoute);

// Delete a specific route
router.delete('/:day/:index', auth, routeController.deleteRoute);

// Get available jobs
router.get('/jobs/available', auth, routeController.getAvailableJobs);

// Complete a route
router.post('/:day/:routeIndex/complete', auth, routeController.completeRoute);

// Update all routes
router.put('/', auth, routeController.updateAllRoutes);

// Reschedule a route
router.put('/:id/reschedule', auth, routeController.rescheduleRoute);

// Assign employee or crew to a route
router.put('/:day/:index/assign', auth, routeController.assignRoute);

module.exports = router;
