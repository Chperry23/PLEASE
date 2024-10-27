// backend/src/routes/paymentRoutes.js

const express = require('express');
const router = express.Router();
const stripe = require('../utils/stripe'); // Ensure Stripe is initialized correctly

// GET /api/payment/prices - Fetch Stripe Prices
router.get('/prices', async (req, res) => {
  try {
    console.log("Received request to /api/payment/prices at", new Date().toISOString());
    
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
    });

    console.log("Successfully fetched prices from Stripe at", new Date().toISOString(), "Prices:", prices);

    res.json(prices.data);
  } catch (error) {
    console.error('Error fetching prices from Stripe:', error);
    res.status(500).json({ error: 'An error occurred while fetching prices.' });
  }
});

module.exports = router;
