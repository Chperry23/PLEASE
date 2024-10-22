const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const quoteController = require('../controllers/quoteController');

router.post('/calculate', auth, quoteController.calculateQuote);
router.post('/', auth, quoteController.createQuote);
router.get('/', auth, quoteController.getQuotes);
router.get('/:id', auth, quoteController.getQuoteById);
router.patch('/:id/status', auth, quoteController.updateQuoteStatus);
router.delete('/:id', auth, quoteController.deleteQuote);
router.post('/convert-to-job', auth, quoteController.convertQuoteToJob);
router.get('/check', auth, quoteController.getQuotesByIdentifier);

module.exports = router;
