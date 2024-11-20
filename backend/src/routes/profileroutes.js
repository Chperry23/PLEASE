// profileRoutes.js
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const auth = require('../middleware/auth');

router.get('/', auth, profileController.getProfile);
router.put('/', auth, profileController.updateProfile);
router.get('/services', auth, profileController.getServices);
router.post('/services', auth, profileController.addService);
router.put('/services/:serviceId', auth, profileController.updateService);
router.delete('/services/:serviceId', auth, profileController.deleteService);

module.exports = router;
