// backend/src/routes/jobRoutes.js
const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const auth = require('../middleware/auth');

// ========================
// Job Routes
// ========================

// All job routes require authentication
router.post('/', auth, jobController.createJob);
router.get('/', auth, jobController.getAllJobs);
router.get('/:id', auth, jobController.getJob);
router.put('/:id', auth, jobController.updateJob);
router.delete('/:id', auth, jobController.deleteJob);
router.post('/:id/complete', auth, jobController.completeJob);
router.post('/:id/rate', auth, jobController.rateJob);
router.get('/available', auth, jobController.getAvailableJobs);
router.put('/:id/schedule', auth, jobController.updateJobSchedule);
router.get('/recent', auth, jobController.getRecentJobs);
router.get('/day/:day', auth, jobController.getJobsByDay);

module.exports = router;
