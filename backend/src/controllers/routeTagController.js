const RouteTag = require('../models/RouteTag');

// Fetch all tags for the authenticated user
exports.getRouteTags = async (req, res) => {
  try {
    const userId = req.user.id;
    const tags = await RouteTag.find({ userId });
    res.json(tags);
  } catch (error) {
    console.error('Error fetching route tags:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Save or update a tag
exports.saveRouteTag = async (req, res) => {
  try {
    const userId = req.user.id;
    const { occurrenceId, tag } = req.body;

    const existingTag = await RouteTag.findOneAndUpdate(
      { userId, occurrenceId },
      { tag },
      { upsert: true, new: true }
    );

    res.json(existingTag);
  } catch (error) {
    console.error('Error saving route tag:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
