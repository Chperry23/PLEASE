// backend/src/routes/jobRoutes.js
const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const auth = require('../middleware/auth');
const checkTrial = require('../middleware/checkTrial'); // Import the checkTrial middleware

// ========================
// Job Routes (With Trial Checks)
// ========================

// All job routes require authentication and trial verification
router.post('/', auth, checkTrial(), jobController.createJob);
router.get('/', auth, checkTrial(), jobController.getAllJobs);
router.get('/:id', auth, checkTrial(), jobController.getJob);
router.put('/:id', auth, checkTrial(), jobController.updateJob);
router.delete('/:id', auth, checkTrial(), jobController.deleteJob);
router.post('/:id/complete', auth, checkTrial(), jobController.completeJob);
router.post('/:id/rate', auth, checkTrial(), jobController.rateJob);
router.get('/available', auth, checkTrial(), jobController.getAvailableJobs);
router.put('/:id/schedule', auth, checkTrial(), jobController.updateJobSchedule);
router.get('/recent', auth, checkTrial(), jobController.getRecentJobs);
router.get('/day/:day', auth, checkTrial(), jobController.getJobsByDay);

module.exports = router;
