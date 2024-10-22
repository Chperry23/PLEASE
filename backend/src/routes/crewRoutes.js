const express = require('express');
const { getAllCrews, createCrew, updateCrew, deleteCrew, moveEmployee } = require('../controllers/crewController');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/', auth, getAllCrews);
router.post('/', auth, createCrew);
router.put('/move-employee', auth, (req, res, next) => {
  console.log('Received move-employee request:', req.body);
  moveEmployee(req, res, next);
});
router.delete('/:id', auth, deleteCrew);
router.put('/move-employee', auth, moveEmployee);  // Changed from '/move' to '/move-employee'

module.exports = router;