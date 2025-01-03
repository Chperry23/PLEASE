const Route = require('../models/route');

// Placeholder controller that returns empty data
exports.getAllRoutes = async (req, res) => {
  try {
    res.json({ 
      routes: {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
        Sunday: []
      } 
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};