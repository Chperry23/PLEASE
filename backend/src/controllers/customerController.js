const Customer = require('../models/customer');
const Job = require('../models/job');
const csv = require('csv-parser');
const multer = require('multer');
const upload = multer();
const fs = require('fs');

exports.createCustomer = async (req, res) => {
  try {
    const customer = new Customer({
      ...req.body,
      createdBy: req.user._id,
      createdAt: new Date()
    });
    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.importCustomers = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const results = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        const customersToSave = results.map(customer => ({
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: {
            street: customer.street,
            city: customer.city,
            state: customer.state,
            zipCode: customer.zipCode,
            coordinates: customer.coordinates ? customer.coordinates.split(',').map(Number) : undefined
          },
          notes: customer.notes,
          createdBy: req.user._id
        }));

        await Customer.insertMany(customersToSave);
        fs.unlinkSync(req.file.path);

        res.status(200).json({ message: `${customersToSave.length} customers imported successfully` });
      } catch (error) {
        console.error('Error importing customers:', error);
        res.status(500).json({ message: 'Error importing customers' });
      }
    });
};

exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ createdBy: req.user._id });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true }
    );
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCustomerLifetimeValue = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const jobs = await Job.find({ customer: customer._id, status: 'Completed' });
    const lifetimeValue = jobs.reduce((sum, job) => sum + job.price, 0);

    res.json({ lifetimeValue });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating customer lifetime value' });
  }
};

exports.updateCustomerStatus = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    customer.status = req.body.status;
    if (req.body.status === 'Discontinued') {
      customer.endDate = new Date();
    }

    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
  } catch (error) {
    res.status(400).json({ message: 'Error updating customer status' });
  }
};
