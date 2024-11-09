// src/middleware/auth.js

const jwt = require('jsonwebtoken');
const User = require('../models/user');

const verifyToken = async (req, res, next) => {
  // Retrieve token from cookies or Authorization header
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'Unauthorized. No token provided.' });
  }

  try {
    console.log('Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified. Decoded payload:', decoded);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      console.log('User not found for ID:', decoded.id);
      return res.status(401).json({ error: 'Unauthorized. User not found.' });
    }

    console.log('User authenticated:', user._id);
    req.user = user; // Attach user to the request object
    next(); // Proceed to the next middleware/controller
  } catch (error) {
    console.error('JWT verification failed:', error);
    return res.status(401).json({ error: 'Unauthorized. Invalid token.' });
  }
};

module.exports = verifyToken;
