// routes/routeTagRoutes.js
const express = require('express');
const router = express.Router();
const { getRouteTags, saveRouteTag } = require('../controllers/routeTagController');
const auth = require('../middleware/auth'); // Corrected import path and variable name

router.get('/route-tags', auth, getRouteTags);
router.post('/route-tags', auth, saveRouteTag);

module.exports = router;
