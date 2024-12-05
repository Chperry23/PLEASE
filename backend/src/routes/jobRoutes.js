// src/routes/jobRoutes.js
const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const auth = require('../middleware/auth');

// Route to get all jobs
router.get('/', auth, jobController.getAllJobs);

// Route to create a new job
router.post('/', auth, jobController.createJob);

// Route to get a single job by ID
router.get('/:id', auth, jobController.getJob);

// Route to update a job by ID
router.put('/:id', auth, jobController.updateJob);

// Route to delete a job by ID
router.delete('/:id', auth, jobController.deleteJob);

// Complete a job
router.post('/:id/complete', auth, jobController.completeJob);

// Complete multiple jobs
router.post('/complete-multiple', auth, jobController.completeMultipleJobs);

// Rate a job
router.post('/:id/rate', auth, jobController.rateJob);

// Get available jobs
router.get('/available', auth, jobController.getAvailableJobs);

// Update job schedule
router.put('/:id/schedule', auth, jobController.updateJobSchedule);

// Get recent jobs
router.get('/recent', auth, jobController.getRecentJobs);

// Get jobs by day
router.get('/day/:day', auth, jobController.getJobsByDay);

module.exports = router;
