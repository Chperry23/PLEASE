// backend/src/routes/customerRoutes.js
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const auth = require('../middleware/auth');
// Removed checkTrial middleware import
const multer = require('multer');
const upload = multer({ dest: 'temp/' });

// ========================
// Customer Routes
// ========================

router.get('/', auth, customerController.getAllCustomers);
router.post('/', auth, customerController.createCustomer);
router.get('/:id', auth, customerController.getCustomer);
router.put('/:id', auth, customerController.updateCustomer);
router.delete('/:id', auth, customerController.deleteCustomer);
router.post('/import', auth, upload.single('file'), customerController.importCustomers);
router.get('/:id/lifetime-value', auth, customerController.getCustomerLifetimeValue);
router.put('/:id/status', auth, customerController.updateCustomerStatus);

module.exports = router;
