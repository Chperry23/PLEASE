const Quote = require('../models/quote');
const Job = require('../models/job');
const Customer = require('../models/customer');
const mongoose = require('mongoose');

exports.calculateQuote = async (req, res) => {
  const { type, area, options, timeEstimate, difficulty, skillRequired, customerInfo } = req.body;

  let basePrice;
  let additionalPrice = 0;

  const difficultyWeights = { 'Easy': 1, 'Moderate': 1.1, 'Difficult': 1.2 };
  const skillWeights = { 'Basic': 1, 'Intermediate': 1.1, 'Expert': 1.2 };
  const timeWeight = Math.max(timeEstimate / 60, 1);

  switch (type) {
    case 'lawncare':
      basePrice = calculateLawnCarePrice(area, options);
      break;
    case 'hedge_trimming':
      basePrice = calculateHedgeTrimmingPrice(area, options);
      break;
    case 'landscaping':
      basePrice = calculateLandscapingPrice(area, options);
      break;
    default:
      return res.status(400).json({ message: 'Invalid type' });
  }

  const weightedPrice = basePrice * difficultyWeights[difficulty] * skillWeights[skillRequired] * timeWeight;
  const totalPrice = weightedPrice + additionalPrice;

  const quoteData = {
    type,
    area,
    options,
    timeEstimate,
    difficulty,
    skillRequired,
    basePrice: basePrice.toFixed(2),
    weightedPrice: weightedPrice.toFixed(2),
    additionalPrice: additionalPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
    customerInfo,
    quoteStatus: 'Waiting',
    createdBy: req.user._id,
    quoteIdentifier: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };

  try {
    const quote = new Quote(quoteData);
    await quote.save();
    res.json(quote);
  } catch (error) {
    console.error('Error saving quote:', error);
    res.status(500).json({ message: 'Error saving quote' });
  }
};

exports.createQuote = async (req, res) => {
  try {
    const quoteData = req.body;
    quoteData.createdBy = req.user._id;
    quoteData.quoteIdentifier = `${quoteData.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    quoteData.quoteStatus = 'Waiting';
    const quote = new Quote(quoteData);
    await quote.save();
    res.status(201).json(quote);
  } catch (error) {
    console.error('Error creating quote:', error);
    res.status(500).json({ message: 'Error creating quote', error: error.message });
  }
};

exports.getQuotes = async (req, res) => {
  try {
    const quotes = await Quote.find().sort({ createdAt: -1 });
    res.json(quotes);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({ message: 'Error fetching quotes' });
  }
};

exports.getQuoteById = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }
    res.json(quote);
  } catch (error) {
    console.error('Error fetching quote:', error);
    res.status(500).json({ message: 'Error fetching quote' });
  }
};

exports.updateQuoteStatus = async (req, res) => {
  const { id } = req.params;
  const { quoteStatus } = req.body;

  try {
    const quote = await Quote.findByIdAndUpdate(id, { quoteStatus }, { new: true });
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }
    console.log('Updated quote status:', quote.quoteStatus);
    res.json(quote);
  } catch (error) {
    console.error('Error updating quote status:', error);
    res.status(500).json({ message: 'Error updating quote status' });
  }
};

exports.deleteQuote = async (req, res) => {
  try {
    const quote = await Quote.findByIdAndDelete(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }
    res.json({ message: 'Quote deleted successfully' });
  } catch (error) {
    console.error('Error deleting quote:', error);
    res.status(500).json({ message: 'Error deleting quote' });
  }
};

exports.convertQuoteToJob = async (req, res) => {
  const { quoteId } = req.body;

  try {
    const quote = await Quote.findById(quoteId);

    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    console.log('Quote status:', quote.quoteStatus);
    console.log('Is converted:', quote.isConverted);

    if (quote.isConverted) {
      return res.status(400).json({ message: 'This quote has already been converted to a job' });
    }

    if (quote.quoteStatus !== 'Accepted') {
      return res.status(400).json({ message: 'Only accepted quotes can be converted to jobs', currentStatus: quote.quoteStatus });
    }

    let customer;
    if (quote.customerInfo._id) {
      customer = await Customer.findById(quote.customerInfo._id);
      if (!customer) {
        customer = new Customer(quote.customerInfo);
        await customer.save();
      }
    } else {
      customer = new Customer(quote.customerInfo);
      await customer.save();
    }

    const recurrenceMap = {
      'weekly': 'Weekly',
      'bi-weekly': 'Bi-weekly',
      'monthly': 'Monthly'
    };

    const newJob = new Job({
      customer: customer._id,
      title: `${quote.type.charAt(0).toUpperCase() + quote.type.slice(1)} Service`,
      description: `Service based on quote ${quoteId}`,
      status: 'Pending',
      estimatedDuration: quote.timeEstimate,
      location: {
        address: customer.address.street + ', ' + customer.address.city + ', ' + customer.address.state + ' ' + customer.address.zipCode,
        coordinates: customer.address.coordinates || []
      },
      price: parseFloat(quote.totalPrice),
      cost: parseFloat(quote.basePrice),
      createdBy: req.user._id,
      recurrence: recurrenceMap[quote.options.frequency] || 'One-time',
      notes: `Created from quote ${quoteId}. Area: ${quote.area} sq ft. Difficulty: ${quote.difficulty}. Skill Required: ${quote.skillRequired}.`
    });

    await newJob.save();

    quote.isConverted = true;
    quote.jobId = newJob._id;
    await quote.save();

    res.json({ message: 'Quote successfully converted to job', job: newJob, quote });
  } catch (error) {
    console.error('Error converting quote to job:', error);
    res.status(500).json({ message: 'Error converting quote to job', error: error.message });
  }
};

exports.getQuotesByIdentifier = async (req, res) => {
  try {
    const { identifier } = req.query;
    const quotes = await Quote.find({ quoteIdentifier: identifier });
    res.json(quotes);
  } catch (error) {
    console.error('Error fetching quotes by identifier:', error);
    res.status(500).json({ message: 'Error fetching quotes' });
  }
};

function calculateLawnCarePrice(area, options) {
  let price = area * 0.05;

  if (options.frequency === 'weekly') price *= 1.2;
  if (options.terrain === 'sloped') price *= 1.1;
  if (options.terrain === 'hilly') price *= 1.2;
  if (options.grassHeight === 'overgrown') price *= 1.2;
  if (options.grassHeight === 'very overgrown') price *= 1.4;
  if (options.obstacles === 'some') price *= 1.1;
  if (options.obstacles === 'many') price *= 1.2;
  if (options.edging) price += area * 0.02;
  if (options.fertilizing) price += area * 0.03;
  if (options.debrisRemoval) price += area * 0.01;
  if (options.seasonalCleanup) price += area * 0.05;

  return price;
}

function calculateHedgeTrimmingPrice(area, options) {
  let price = area * 0.1;

  if (options.hedgeHeight === '6-10ft') price *= 1.2;
  if (options.hedgeHeight === 'over10ft') price *= 1.5;
  if (options.hedgeDensity === 'dense') price *= 1.3;
  if (options.shapeComplexity === 'moderate') price *= 1.2;
  if (options.shapeComplexity === 'complex') price *= 1.4;
  if (options.accessDifficulty === 'moderate') price *= 1.1;
  if (options.accessDifficulty === 'difficult') price *= 1.3;
  if (options.debrisVolume === 'medium') price *= 1.1;
  if (options.debrisVolume === 'high') price *= 1.2;

  return price;
}

function calculateLandscapingPrice(area, options) {
  let price = area * 0.2;

  if (options.designComplexity === 'moderate') price *= 1.3;
  if (options.designComplexity === 'complex') price *= 1.6;
  if (options.soilQuality === 'poor') price *= 1.2;
  if (options.plantDiversity === 'medium') price *= 1.2;
  if (options.plantDiversity === 'high') price *= 1.4;
  if (options.irrigationNeeds === 'moderate') price *= 1.3;
  if (options.irrigationNeeds === 'advanced') price *= 1.6;
  if (options.hardscapingAmount === 'some') price *= 1.4;
  if (options.hardscapingAmount === 'extensive') price *= 1.8;
  if (options.siteAccessibility === 'moderate') price *= 1.1;
  if (options.siteAccessibility === 'difficult') price *= 1.3;

  return price;
}

module.exports = exports;