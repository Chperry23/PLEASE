const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const auth = require('../middleware/auth');

router.get('/', auth, profileController.getProfile);
router.put('/', auth, profileController.updateProfile);
router.put('/progress', auth, profileController.updateProgress);
router.put('/setup-steps', auth, profileController.updateSetupSteps);
router.post('/services', auth, profileController.addService);
router.get('/services', auth, profileController.getServices);
router.put('/services/:serviceId', auth, profileController.updateService);
router.delete('/services/:serviceId', auth, profileController.deleteService);
// Remove this duplicate line: router.post('/services', auth, profileController.addService);

module.exports = router;