const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const auth = require('../middleware/auth');

router.get('/', auth, routeController.getRoutes);  // Get all routes
router.get('/:day', auth, routeController.getRouteByDay);  // Get routes by day
router.put('/:day/:index', auth, routeController.updateRoute);  // Update a specific route
router.delete('/:day/:index', auth, routeController.deleteRoute);  // Delete a specific route
router.get('/jobs/available', auth, routeController.getAvailableJobs);  // Get available jobs
router.post('/:day/:routeIndex/complete', auth, routeController.completeRoute);  // Complete a route
router.put('/', auth, routeController.updateAllRoutes);  // Update all routes

// Add this new route for assigning employees or crews to routes
router.put('/:day/:index/assign', auth, routeController.assignRoute);  // Assign employee or crew to a route

module.exports = router;