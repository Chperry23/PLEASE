const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of 30s
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    // More detailed error logging
    if (err.name === 'MongooseServerSelectionError') {
      console.error('Could not connect to any MongoDB servers.');
      console.error('Please check your connection string and ensure your IP is whitelisted.');
    }
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;