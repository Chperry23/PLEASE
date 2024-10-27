const express = require('express');
const router = express.Router();
const stripe = require('../utils/stripe'); // Ensure Stripe is initialized correctly

// Endpoint to fetch Stripe Prices
router.get('/prices', async (req, res) => {
  try {
    console.log('Fetching Stripe prices...'); // Log for fetching
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
    });

    console.log('Prices fetched from Stripe:', prices.data); // Log fetched data

    res.json(prices.data); // Return the price data
  } catch (error) {
    console.error('Error fetching prices from Stripe:', error); // Log the error
    res.status(500).json({ error: 'An error occurred while fetching prices.' });
  }
});

module.exports = router;
