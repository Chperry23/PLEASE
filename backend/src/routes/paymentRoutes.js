// backend/src/routes/paymentRoutes.js

const express = require('express');
const router = express.Router();
const stripe = require('../utils/stripe'); // Ensure Stripe is initialized correctly

// GET /api/payment/prices - Fetch Stripe Prices
router.get('/prices', async (req, res) => {
  try {
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
    });

    res.json(prices.data);
  } catch (error) {
    console.error('Error fetching prices from Stripe:', error);
    res.status(500).json({ error: 'An error occurred while fetching prices.' });
  }
});

module.exports = router;
