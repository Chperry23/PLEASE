const mongoose = require('mongoose');
const User = require('./src/models/user');
const Customer = require('./src/models/customer');
const Employee = require('./src/models/employee');
const Job = require('./src/models/job');
const Crew = require('./src/models/crew');
const Route = require('./src/models/route');

const MONGODB_URI = 'mongodb+srv://chperry66:qs3XLRaPR50mnyFC@rbdb.umkoeqi.mongodb.net/test';

async function seedData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB test database');

    // Use the existing user
    const userId = '66a5265a3a3f1427f805aa80';
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Create sample customers
    const customers = await Customer.create([
      { name: 'John Doe', email: 'john@example.com', createdBy: user._id, startDate: new Date('2024-01-01') },
      { name: 'Jane Smith', email: 'jane@example.com', createdBy: user._id, startDate: new Date('2024-02-15') },
      { name: 'Bob Johnson', email: 'bob@example.com', createdBy: user._id, startDate: new Date('2024-03-20') },
      { name: 'Alice Brown', email: 'alice@example.com', createdBy: user._id, startDate: new Date('2024-04-10') },
      { name: 'Charlie Green', email: 'charlie@example.com', createdBy: user._id, startDate: new Date('2024-05-05') }
    ]);

    // Create sample employees
    const employees = await Employee.create([
      { name: 'Alice Worker', email: 'alice@example.com', createdBy: user._id },
      { name: 'Charlie Tech', email: 'charlie@example.com', createdBy: user._id },
      { name: 'David Builder', email: 'david@example.com', createdBy: user._id },
      { name: 'Eve Gardener', email: 'eve@example.com', createdBy: user._id }
    ]);

    // Create sample crew
    const crew = await Crew.create({
      name: 'Main Crew',
      members: [employees[0]._id, employees[1]._id, employees[2]._id, employees[3]._id],
      createdBy: user._id
    });

    // Create sample jobs
    const jobs = await Job.create([
      { 
        customer: customers[0]._id, 
        title: 'Lawn Mowing', 
        status: 'Completed', 
        price: 100, 
        createdBy: user._id,
        assignedTo: employees[0]._id,
        completionDate: new Date('2024-06-01'),
        customerRating: 4
      },
      { 
        customer: customers[1]._id, 
        title: 'Hedge Trimming', 
        status: 'Completed', 
        price: 150, 
        createdBy: user._id,
        assignedTo: employees[1]._id,
        completionDate: new Date('2024-06-15'),
        customerRating: 5
      },
      { 
        customer: customers[2]._id, 
        title: 'Fertilizing', 
        status: 'Pending', 
        price: 200, 
        createdBy: user._id,
        assignedTo: employees[0]._id,
        scheduledDate: new Date('2024-07-10')
      },
      {
        customer: customers[3]._id,
        title: 'Leaf Removal',
        status: 'Scheduled',
        price: 120,
        createdBy: user._id,
        assignedTo: employees[2]._id,
        scheduledDate: new Date('2024-07-15')
      },
      {
        customer: customers[4]._id,
        title: 'Weed Control',
        status: 'In Progress',
        price: 180,
        createdBy: user._id,
        assignedTo: employees[3]._id,
        scheduledDate: new Date('2024-07-20')
      },
      {
        customer: customers[0]._id,
        title: 'Tree Pruning',
        status: 'Completed',
        price: 250,
        createdBy: user._id,
        assignedTo: employees[1]._id,
        completionDate: new Date('2024-06-20'),
        customerRating: 5
      }
    ]);

    // Create a sample route
    await Route.create({
      name: 'Monday Route',
      jobs: [jobs[0]._id, jobs[1]._id, jobs[5]._id],
      crew: crew._id,
      createdBy: user._id
    });

    // Update customer stats
    for (let customer of customers) {
      const customerJobs = jobs.filter(job => job.customer.toString() === customer._id.toString());
      const completedJobs = customerJobs.filter(job => job.status === 'Completed');
      const totalRevenue = completedJobs.reduce((sum, job) => sum + job.price, 0);
      const lastServiceDate = completedJobs.length > 0 ? 
        Math.max(...completedJobs.map(job => job.completionDate)) : 
        null;

      await Customer.findByIdAndUpdate(customer._id, {
        totalJobsCompleted: completedJobs.length,
        totalRevenue: totalRevenue,
        lastServiceDate: lastServiceDate
      });
    }

    console.log('Data seeded successfully for user Cole Perry in the test database');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedData();
