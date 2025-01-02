const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const auth = require('../middleware/auth');

// Get all routes
router.get('/', auth, routeController.getAllRoutesGroupedByDay);

// Get routes by day
router.get('/day/:day', auth, routeController.getRouteByDay);

// Create new route
router.post('/', auth, routeController.createRoute);

// Add job to route
router.post('/:routeId/jobs', auth, routeController.addJobToRoute);

// Update route
router.put('/:routeId', auth, routeController.updateRoute);

// Delete route
router.delete('/:routeId', auth, routeController.deleteRoute);

// Get available jobs
router.get('/jobs/available', auth, routeController.getAvailableJobs);

// Complete route
router.post('/:routeId/complete', auth, routeController.completeRoute);

// Reschedule route
router.put('/:routeId/reschedule', auth, routeController.rescheduleRoute);

// Assign employee or crew to route
router.put('/:routeId/assign', auth, routeController.assignRoute);

module.exports = router;
