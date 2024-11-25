// customerRoutes.js
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const auth = require('../middleware/auth'); // Import your authentication middleware

// Get all customers
router.get('/', auth, customerController.getAllCustomers);

// Create a new customer
router.post('/', auth, customerController.createCustomer);

// Get a specific customer by ID
router.get('/:id', auth, customerController.getCustomer);

// Update a customer by ID
router.put('/:id', auth, customerController.updateCustomer);

// Delete a customer by ID
router.delete('/:id', auth, customerController.deleteCustomer);

// Import customers from CSV
router.post('/import', auth, customerController.importCustomers);

// Get customer lifetime value
router.get('/:id/lifetime-value', auth, customerController.getCustomerLifetimeValue);

// Update customer status
router.put('/:id/status', auth, customerController.updateCustomerStatus);

module.exports = router;
