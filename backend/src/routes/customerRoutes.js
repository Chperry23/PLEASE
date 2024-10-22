// backend/src/routes/customerRoutes.js
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const auth = require('../middleware/auth');
const checkTrial = require('../middleware/checkTrial'); // Import the checkTrial middleware
const multer = require('multer');
const upload = multer({ dest: 'temp/' });

// ========================
// Customer Routes (With Trial Checks)
// ========================

// All customer routes require authentication and trial verification
router.get('/', auth, checkTrial(), customerController.getAllCustomers);
router.post('/', auth, checkTrial(), customerController.createCustomer);
router.get('/:id', auth, checkTrial(), customerController.getCustomer);
router.put('/:id', auth, checkTrial(), customerController.updateCustomer);
router.delete('/:id', auth, checkTrial(), customerController.deleteCustomer);
router.post('/import', auth, checkTrial(), upload.single('file'), customerController.importCustomers);
router.get('/:id/lifetime-value', auth, checkTrial(), customerController.getCustomerLifetimeValue);
router.put('/:id/status', auth, checkTrial(), customerController.updateCustomerStatus);

module.exports = router;
