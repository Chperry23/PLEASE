// AUTOLAWN/backend/src/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { sendNotifications } = require('../controllers/notificationsController');

router.post('/send', authMiddleware, sendNotifications);

module.exports = router;
