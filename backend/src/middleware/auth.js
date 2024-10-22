// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if the Authorization header is present and starts with 'Bearer '
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      console.log('Verifying token...');
      
      // Verify the token using JWT_SECRET
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token verified. User ID:', decoded.id);
      
      // Find the user by ID, excluding the password field
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        console.log('User not found for ID:', decoded.id);
        return res.status(401).json({ error: 'Unauthorized. User not found.' }); // Changed from 404 to 401
      }
      
      console.log('User authenticated:', user._id);
      req.user = user; // Attach user to the request object
      next(); // Proceed to the next middleware/controller
    } catch (error) {
      console.error('JWT verification failed:', error);
      return res.status(401).json({ error: 'Unauthorized. Invalid token.' });
    }
  } else {
    console.log('No token provided in Authorization header');
    return res.status(401).json({ error: 'Unauthorized. No token provided.' });
  }
};

module.exports = verifyToken;
