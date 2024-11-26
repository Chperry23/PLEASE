// profileRoutes.js
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const auth = require('../middleware/auth');

router.get('/', auth, profileController.getProfile);
router.put('/', auth, profileController.updateProfile);
router.get('/subscription', auth, profileController.getSubscriptionStatus);

module.exports = router;
