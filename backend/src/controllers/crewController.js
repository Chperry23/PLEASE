// src/controllers/crewController.js
const Crew = require('../models/crew');
const Employee = require('../models/employee');

exports.getAllCrews = async (req, res) => {
  try {
    const crews = await Crew.find({ createdBy: req.user._id }).populate('members');
    res.json(crews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching crews', error });
  }
};

exports.createCrew = async (req, res) => {
  try {
    const crew = new Crew({ ...req.body, createdBy: req.user._id });
    await crew.save();
    res.status(201).json(crew);
  } catch (error) {
    res.status(500).json({ message: 'Error creating crew', error });
  }
};

exports.updateCrew = async (req, res) => {
  try {
    const crew = await Crew.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('members');
    res.json(crew);
  } catch (error) {
    res.status(500).json({ message: 'Error updating crew', error });
  }
};

exports.deleteCrew = async (req, res) => {
  try {
    await Crew.findByIdAndDelete(req.params.id);
    res.json({ message: 'Crew deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting crew', error });
  }
};

exports.moveEmployee = async (req, res) => {
  const { employeeId, sourceCrewId, destinationCrewId } = req.body;

  try {
    console.log('Request body:', req.body);

    if (sourceCrewId) {
      const sourceCrew = await Crew.findByIdAndUpdate(sourceCrewId, { $pull: { members: employeeId } });
      console.log('Source crew after update:', sourceCrew);
    }

    if (destinationCrewId) {
      const destCrew = await Crew.findByIdAndUpdate(destinationCrewId, { $addToSet: { members: employeeId } });
      console.log('Destination crew after update:', destCrew);
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId, 
      { crew: destinationCrewId || null },
      { new: true }
    );
    console.log('Updated employee:', updatedEmployee);

    if (!updatedEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.status(200).json({ message: 'Employee moved successfully', employee: updatedEmployee });
  } catch (error) {
    console.error('Error moving employee:', error);
    res.status(500).json({ message: 'Error moving employee', error: error.toString(), stack: error.stack });
  }
};