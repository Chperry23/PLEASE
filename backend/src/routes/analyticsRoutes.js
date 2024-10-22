// backend/src/routes/analyticsRoutes.js

const express = require('express');
const router = express.Router();
const { getCounts, getAnalyticsData } = require('../controllers/analyticsController');
const verifyToken = require('../middleware/auth'); // Ensure correct path

// Route: GET /api/analytics/counts
router.get('/counts', verifyToken, getCounts);

// Route: GET /api/analytics
router.get('/', verifyToken, getAnalyticsData);

module.exports = router;
