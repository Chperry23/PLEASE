import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance'; // Use axiosInstance
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/solid';

const Employee = () => {
  const [employees, setEmployees] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [totalHoursWorked, setTotalHoursWorked] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axiosInstance.get('/employees', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/employees', {
        name,
        email,
        phone,
        address,
        hireDate,
        totalHoursWorked
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchEmployees();
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setHireDate('');
      setTotalHoursWorked('');
    } catch (error) {
      console.error('Error adding employee:', error);
      setError('Failed to add employee. Please try again.');
    }
  };

  const handleDelete = async (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await axiosInstance.delete(`/employees/${employeeId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        fetchEmployees();
      } catch (error) {
        console.error('Error deleting employee:', error);
        setError('Failed to delete employee. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-text">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold mb-6 text-white">Employees</h1>
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
          
          <form onSubmit={handleSubmit} className="mb-8 bg-surface p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-white">Add New Employee</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border rounded p-2 w-full bg-background text-text"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border rounded p-2 w-full bg-background text-text"
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="text"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="border rounded p-2 w-full bg-background text-text"
                />
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium mb-1">Address</label>
                <input
                  type="text"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="border rounded p-2 w-full bg-background text-text"
                />
              </div>
              <div>
                <label htmlFor="hireDate" className="block text-sm font-medium mb-1">Hire Date</label>
                <input
                  type="date"
                  id="hireDate"
                  value={hireDate}
                  onChange={(e) => setHireDate(e.target.value)}
                  className="border rounded p-2 w-full bg-background text-text"
                />
              </div>
              <div>
                <label htmlFor="totalHoursWorked" className="block text-sm font-medium mb-1">Total Hours Worked</label>
                <input
                  type="number"
                  id="totalHoursWorked"
                  value={totalHoursWorked}
                  onChange={(e) => setTotalHoursWorked(e.target.value)}
                  className="border rounded p-2 w-full bg-background text-text"
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                type="submit"
                className="bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90 transition duration-200 flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Employee
              </button>
            </div>
          </form>

          <h2 className="text-2xl font-bold mb-4 text-white">Current Employees</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map(employee => (
              <div key={employee._id} className="bg-surface p-4 rounded-lg shadow-lg">
                <div className="text-white font-medium text-lg mb-2">{employee.name}</div>
                <div className="text-gray-400">{employee.email}</div>
                <div className="text-gray-400">{employee.phone}</div>
                <div className="text-gray-400">{employee.address}</div>
                <div className="text-gray-400">Hire Date: {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'N/A'}</div>
                <div className="text-gray-400">Average Job Rating: {employee.averageJobRating ? employee.averageJobRating.toFixed(2) : 'N/A'}</div>
                <button
                  onClick={() => handleDelete(employee._id)}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition duration-200 flex items-center"
                >
                  <TrashIcon className="h-5 w-5 mr-2" />
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Employee;
