// src/routes/employeeRoutes.js
const express = require('express');
const { 
  getAllEmployees, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee,
  getEmployeePerformance
} = require('../controllers/employeeController');
const router = express.Router();
const auth = require('../middleware/auth');

router.route('/')
  .get(auth, getAllEmployees)
  .post(auth, createEmployee);

router.route('/:id')
  .put(auth, updateEmployee)
  .delete(auth, deleteEmployee);

router.get('/:id/performance', auth, getEmployeePerformance);

module.exports = router;