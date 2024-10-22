const { Seeder } = require('mongo-seeding');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/user'); // Adjust the path as needed

const config = {
  database: process.env.MONGODB_URI,
  dropDatabase: false, // Set to true if you want to drop the database before seeding
  databaseName: 'test' // Ensure we are using the 'test' database
};

const seeder = new Seeder(config);

const replaceUserIdPlaceholder = async () => {
  try {
    const user = await User.findOne({ email: 'chperry57@gmail.com' });
    if (!user) {
      throw new Error('No user found with email chperry57@gmail.com.');
    }

    const filePath = path.resolve('./seed/data/jobs.json');
    const jobs = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const updatedJobs = jobs.map(job => {
      job.assignedTo = user._id;
      job.createdBy = user._id;
      return job;
    });

    fs.writeFileSync(filePath, JSON.stringify(updatedJobs, null, 2));
    console.log('User ID placeholders replaced successfully');
  } catch (error) {
    console.error('Error replacing user ID placeholders:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  await replaceUserIdPlaceholder();

  const collections = seeder.readCollectionsFromPath(
    path.resolve('./seed/data'),
    {
      extensions: ['json'],
      transformers: [Seeder.Transformers.replaceDocumentIdWithUnderscoreId]
    }
  );

  seeder
    .import(collections)
    .then(() => {
      console.log('Seed data successfully imported');
      process.exit(0);
    })
    .catch(err => {
      console.log('Error while importing seed data:', err);
      process.exit(1);
    });
};

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    seedData();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
