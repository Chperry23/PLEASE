const express = require('express');
const router = express.Router();
const stripe = require('../utils/stripe'); // Import Stripe from utils

// GET /api/payment/prices - Fetch Stripe Prices
router.get('/prices', async (req, res) => {
  try {
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
    });
    console.log('Fetched Stripe prices:', prices);
    res.json(prices.data);
  } catch (error) {
    console.error('Error fetching prices from Stripe:', error);
    res.status(500).json({ error: 'Failed to fetch prices from Stripe.' });
  }
});


module.exports = router;
