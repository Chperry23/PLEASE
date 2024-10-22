// src/controllers/employeeController.js
const Employee = require('../models/employee');
const Job = require('../models/job');

exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({ createdBy: req.user._id }).populate('crew');
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employees', error });
  }
};

exports.createEmployee = async (req, res) => {
  try {
    const employee = new Employee({ ...req.body, createdBy: req.user._id });
    await employee.save();
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Error creating employee', error });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Error updating employee', error });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting employee', error });
  }
};

exports.getEmployeePerformance = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const completedJobs = await Job.find({ 
      assignedTo: employee._id, 
      status: 'Completed'
    });

    const performance = {
      jobsCompleted: employee.jobsCompleted,
      totalHoursWorked: employee.totalHoursWorked,
      averageJobRating: employee.averageJobRating,
      efficiency: completedJobs.length > 0 ? 
        employee.jobsCompleted / completedJobs.length : 0
    };

    res.json(performance);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employee performance', error });
  }
};