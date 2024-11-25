import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance'; // Use axiosInstance
import { PlusIcon } from '@heroicons/react/24/outline';
import Header from '../components/Header';

const Jobs = () => {
  const [job, setJob] = useState({
    service: '',
    description: '',
    customer: '',
    price: '',
    status: 'Pending',
    isRecurring: false,
    recurrencePattern: 'One-time',
    estimatedDuration: '',
    location: {
      address: '',
      coordinates: []
    },
    cost: null,
    notes: '',
    scheduledDay: null
  });
  const [jobs, setJobs] = useState({ oneTime: [], recurring: [] });
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchCustomers();
    fetchJobs();
    fetchServices();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axiosInstance.get('/customers', {
      });
      const sanitizedCustomers = response.data.map(customer => ({
        ...customer,
        address: customer.address || {},
        phone: customer.phone || 'No phone',
        email: customer.email || 'No email',
        notes: customer.notes || ''
      }));
      setCustomers(sanitizedCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to fetch customers. Please try again.');
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
        const response = await axiosInstance.get('/jobs', {
        });

        // Sort jobs by createdAt date and take the last 3
        const oneTimeJobs = response.data
            .filter(job => !job.isRecurring)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);
        const recurringJobs = response.data
            .filter(job => job.isRecurring)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);

        setJobs({ oneTime: oneTimeJobs, recurring: recurringJobs });
    } catch (error) {
        console.error('Error fetching jobs:', error);
        setError('Failed to fetch jobs. Please try again.');
    }
    setLoading(false);
};

const fetchServices = async () => {
  try {
    const response = await axiosInstance.get('/profile/services');
    setServices(response.data);
  } catch (error) {
    console.error('Error fetching services:', error);
    setError('Failed to fetch services. Please try again.');
  }
};

const handleChange = (e) => {
  const { name, value } = e.target;
  if (name === 'service') {
    setJob(prevJob => ({
      ...prevJob,
      service: value
    }));
  } else if (name === 'customer') {
    const selectedCustomer = customers.find(customer => customer._id === value);
    if (selectedCustomer) {
      setJob(prevJob => ({
        ...prevJob,
        customer: value,
        location: {
          address: selectedCustomer.address ? 
            `${selectedCustomer.address.street || ''}, ${selectedCustomer.address.city || ''}, ${selectedCustomer.address.state || ''} ${selectedCustomer.address.zipCode || ''}`.trim() : 
            'Address not available',
          coordinates: selectedCustomer.address?.coordinates || []
        }
      }));
    }
  } else if (name === 'isRecurring') {
    setJob(prevJob => ({
      ...prevJob,
      isRecurring: value === 'true',
      recurrencePattern: value === 'true' ? 'Weekly' : 'One-time'
    }));
  } else if (name === 'scheduledDay') {
    setJob(prevJob => ({
      ...prevJob,
      scheduledDay: value === '' ? null : value  // Set to null if empty string
    }));
  } else if (name.includes('.')) {
    const [parent, child] = name.split('.');
    setJob(prevJob => ({
      ...prevJob,
      [parent]: {
        ...prevJob[parent],
        [child]: value
      }
    }));
  } else {
    setJob(prevJob => ({ ...prevJob, [name]: value }));
  }
};

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setSuccess('');
  setLoading(true);

  try {
    const jobData = { ...job };
    if (!jobData.scheduledDay) {
      delete jobData.scheduledDay;  // Remove scheduledDay if it's null
    }
    
    console.log('Sending job data:', jobData);  // Log the job data before sending

    const response = await axiosInstance.post('/jobs', jobData);
    console.log('Job created:', response.data);  // Log the response data
    setSuccess('Job created successfully!');
    setJob({
      service: '',
      description: '',
      customer: '',
      price: '',
      status: 'Pending',
      isRecurring: false,
      recurrencePattern: 'One-time',
      estimatedDuration: '',
      location: {
        address: '',
        coordinates: []
      },
      cost: '',
      notes: '',
      scheduledDay: null
    });
    fetchJobs();
    setShowForm(false);
  } catch (error) {
    console.error('Error creating job:', error.response?.data || error.message);
    setError(error.response?.data?.message || 'Failed to create job. Please try again.');
  }
  setLoading(false);
};

  const renderJobTable = (jobList, title) => (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="overflow-x-auto mt-4">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Job</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              {title === "Recurring Jobs" && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Recurrence</th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Scheduled Day</th>
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-700">
            {jobList.map((job) => (
              <tr key={job._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{job.service}</div>
                  <div className="text-sm text-gray-400">{job.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">{job.customer?.name || 'No customer assigned'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">${job.price || 0}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${job.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                      job.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 
                      job.status === 'Canceled' ? 'bg-red-100 text-red-800' : 
                      job.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'}`}>
                    {job.status}
                  </span>
                </td>
                {title === "Recurring Jobs" && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{job.recurrencePattern}</div>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">{job.scheduledDay || 'Not Scheduled'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">
                    {job.location?.address || 'Address not available'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );  

  return (
    <div className="min-h-screen bg-background text-text">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-semibold">Jobs</h1>
            <div className="space-x-2">
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <PlusIcon className="h-5 w-5 inline-block mr-1" />
                {showForm ? 'Hide Form' : 'New Job'}
              </button>
            </div>
          </div>
          
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
          {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{success}</div>}
          
          {showForm && (
            <div className="bg-surface shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Create New Job</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="service" className="block text-sm font-medium">Service</label>
                  <select
                    id="service"
                    name="service"
                    value={job.service}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 text-black"
                    required
                  >
                    <option value="">Select a service</option>
                    {services.map((service) => (
                      <option key={service._id} value={service.name}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="customer" className="block text-sm font-medium">Customer</label>
                  <select
                    id="customer"
                    name="customer"
                    value={job.customer}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 text-black"
                    required
                  >
                    <option value="">Select a customer</option>
                    {customers.map((customer) => (
                      <option key={customer._id} value={customer._id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="price" className="block text-sm font-medium">Price</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={job.price}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 text-black"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={job.status}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 text-black"
                    required
                  >
                    <option value="Pending">Pending</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Canceled">Canceled</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="isRecurring" className="block text-sm font-medium">Job Type</label>
                  <select
                    id="isRecurring"
                    name="isRecurring"
                    value={job.isRecurring.toString()}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 text-black"
                    required
                  >
                    <option value="false">One-time</option>
                    <option value="true">Recurring</option>
                  </select>
                </div>
                {job.isRecurring && (
                  <div>
                    <label htmlFor="recurrencePattern" className="block text-sm font-medium">Recurrence Pattern</label>
                    <select
                      id="recurrencePattern"
                      name="recurrencePattern"
                      value={job.recurrencePattern}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 text-black"
                      required
                    >
                      <option value="Weekly">Weekly</option>
                      <option value="Bi-weekly">Bi-weekly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>
                )}
                <div>
                  <label htmlFor="estimatedDuration" className="block text-sm font-medium">Estimated Duration (minutes)</label>
                  <input
                    type="number"
                    id="estimatedDuration"
                    name="estimatedDuration"
                    value={job.estimatedDuration}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 text-black"
                  />
                </div>
                <div>
                  <label htmlFor="cost" className="block text-sm font-medium">Cost</label>
                  <input
                    type="number"
                    id="cost"
                    name="cost"
                    value={job.cost}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 text-black"
                  />
                </div>
                <div>
                  <label htmlFor="scheduledDay" className="block text-sm font-medium">Scheduled Day (Optional)</label>
                  <select
                    id="scheduledDay"
                    name="scheduledDay"
                    value={job.scheduledDay || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 text-black"
                  >
                    <option value="">Not scheduled</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="location.address" className="block text-sm font-medium">Location Address</label>
                <input
                  type="text"
                  id="location.address"
                  name="location.address"
                  value={job.location.address}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 text-black"
                  readOnly
                />
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={job.notes}
                  onChange={handleChange}
                  rows="4"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 text-black"
                ></textarea>
              </div>
              <button
                type="submit"
                className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Job'}
              </button>
            </form>
          </div>
          )}

          {loading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-white">Loading jobs...</p>
            </div>
          ) : (
            <>
              {renderJobTable(jobs.oneTime, "One-Time Jobs")}
              {renderJobTable(jobs.recurring, "Recurring Jobs")}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Jobs;
