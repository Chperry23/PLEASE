import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance'; // Use axiosInstance
import { Link } from 'react-router-dom';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';
import Header from '../components/Header';
import InputMask from 'react-input-mask'; // Import InputMask for formatting

const ManageCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [filter, setFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [customersPerPage] = useState(10);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (filter === '') {
      setFilteredCustomers(customers);
    } else {
      setFilteredCustomers(
        customers.filter(
          (customer) =>
            customer.name?.toLowerCase().includes(filter.toLowerCase()) ||
            customer.email?.toLowerCase().includes(filter.toLowerCase()) ||
            customer.phone?.toLowerCase().includes(filter.toLowerCase()) ||
            customer.address?.street?.toLowerCase().includes(filter.toLowerCase()) ||
            customer.address?.city?.toLowerCase().includes(filter.toLowerCase()) ||
            customer.address?.state?.toLowerCase().includes(filter.toLowerCase()) ||
            customer.address?.zipCode?.toLowerCase().includes(filter.toLowerCase()) ||
            customer.notes?.toLowerCase().includes(filter.toLowerCase())
        )
      );
    }
  }, [filter, customers]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('http://localhost:5000/api/customers', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setCustomers(response.data);
      setFilteredCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError('Failed to fetch customers. Please try again.');
    }
    setLoading(false);
  };

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await axiosInstance.delete(`http://localhost:5000/api/customers/${customerId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setCustomers(customers.filter((customer) => customer._id !== customerId));
      } catch (error) {
        console.error('Error deleting customer:', error);
        setError('Failed to delete customer. Please try again.');
      }
    }
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer({ ...customer });
  };

  const handleUpdateCustomer = async () => {
    try {
      const response = await axiosInstance.put(
        `http://localhost:5000/api/customers/${editingCustomer._id}`,
        editingCustomer,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      setCustomers(
        customers.map((customer) =>
          customer._id === editingCustomer._id ? response.data : customer
        )
      );
      setEditingCustomer(null);
    } catch (error) {
      console.error('Error updating customer:', error);
      setError('Failed to update customer. Please try again.');
    }
  };

  const handleStatusChange = async (customerId, newStatus) => {
    try {
      await axiosInstance.put(
        `http://localhost:5000/api/customers/${customerId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setCustomers(
        customers.map((customer) =>
          customer._id === customerId ? { ...customer, status: newStatus } : customer
        )
      );
    } catch (error) {
      console.error('Error updating customer status:', error);
      setError('Failed to update customer status. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setEditingCustomer(prev => ({ ...prev, [name]: checked }));
    } else if (name.includes('.')) {
      const [objectKey, nestedKey] = name.split('.');
      setEditingCustomer(prev => ({
        ...prev,
        [objectKey]: {
          ...prev[objectKey],
          [nestedKey]: value
        }
      }));
    } else {
      setEditingCustomer(prev => ({ ...prev, [name]: value }));
    }
  };

  // Pagination Logic
  const indexOfLastCustomer = currentPage * customersPerPage;
  const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
  const currentCustomers = filteredCustomers.slice(
    indexOfFirstCustomer,
    indexOfLastCustomer
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen bg-background text-gray-800">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-bold mb-4">Manage Customers</h1>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="mb-4">
            <input
              type="text"
              placeholder="Filter customers..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border rounded p-2 w-full md:w-1/3 bg-background text-text"
            />
          </div>

          {loading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4">Loading customers...</p>
            </div>
          ) : filteredCustomers.length > 0 ? (
            <div className="bg-surface shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-500">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900 divide-y divide-gray-200">
                  {currentCustomers.map((customer) => (
                    <tr key={customer._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-text">{customer.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text">{customer.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text">{customer.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text">
                          {customer.address && (
                            <>
                              {customer.address.street}, {customer.address.city},{' '}
                              {customer.address.state} {customer.address.zipCode}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text">{customer.notes}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={customer.status}
                          onChange={(e) =>
                            handleStatusChange(customer._id, e.target.value)
                          }
                          className="text-sm text-white border rounded p-1 bg-primary"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Discontinued">Discontinued</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditCustomer(customer)}
                          className="text-indigo-600 hover:text-indigo-900 mr-2"
                        >
                          <PencilIcon className="h-5 w-5 inline" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-6 py-4 bg-gray-900">
                <Pagination
                  customersPerPage={customersPerPage}
                  totalCustomers={filteredCustomers.length}
                  paginate={paginate}
                />
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500">No customers found.</p>
          )}

          <Link
            to="/dashboard"
            className="mt-6 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-200"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div
          className="fixed z-10 inset-0 overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
            ></div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3
                  className="text-lg leading-6 font-medium text-gray-900"
                  id="modal-title"
                >
                  Edit Customer
                </h3>
                <div className="mt-2">
                  {/* Name */}
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editingCustomer.name}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 mb-2 text-black"
                    placeholder="Customer Name"
                  />
                  {/* Email */}
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editingCustomer.email}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 mb-2 text-black"
                    placeholder="Email"
                  />
                  {/* Phone with InputMask */}
                  <label className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <InputMask
                    mask="(999) 999-9999"
                    value={editingCustomer.phone}
                    onChange={handleInputChange}
                  >
                    {(inputProps) => (
                      <input
                        {...inputProps}
                        type="tel"
                        name="phone"
                        className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 mb-2 text-black"
                        placeholder="Phone"
                      />
                    )}
                  </InputMask>
                  {/* Address Fields */}
                  <label className="block text-sm font-medium text-gray-700">
                    Street
                  </label>
                  <input
                    type="text"
                    name="address.street"
                    value={editingCustomer.address?.street || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 mb-2 text-black"
                    placeholder="Street"
                  />
                  <label className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    name="address.city"
                    value={editingCustomer.address?.city || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 mb-2 text-black"
                    placeholder="City"
                  />
                  <label className="block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <input
                    type="text"
                    name="address.state"
                    value={editingCustomer.address?.state || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 mb-2 text-black"
                    placeholder="State"
                  />
                  <label className="block text-sm font-medium text-gray-700">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    name="address.zipCode"
                    value={editingCustomer.address?.zipCode || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 mb-2 text-black"
                    placeholder="Zip Code"
                  />
                  {/* Notes */}
                  <label className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <input
                    type="text"
                    name="notes"
                    value={editingCustomer.notes || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 mb-2 text-black"
                    placeholder="Notes"
                  />
                  {/* Additional Fields */}
                  <label className="block text-sm font-medium text-gray-700">
                    Total Jobs Completed
                  </label>
                  <input
                    type="number"
                    name="totalJobsCompleted"
                    value={editingCustomer.totalJobsCompleted || 0}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 mb-2 text-black"
                    placeholder="Total Jobs Completed"
                  />
                  <label className="block text-sm font-medium text-gray-700">
                    Total Revenue
                  </label>
                  <input
                    type="number"
                    name="totalRevenue"
                    value={editingCustomer.totalRevenue || 0}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500 mb-2 text-black"
                    placeholder="Total Revenue"
                  />
                  <label className="block text-sm font-medium text-gray-700">
                    Average Job Rating
                  </label>
                  <input
                  type="checkbox"
                  name="landscapingPotential"
                  checked={editingCustomer.landscapingPotential || false}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm font-medium text-gray-700">
                  Landscaping Potential
                </label>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleUpdateCustomer}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setEditingCustomer(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Pagination = ({ customersPerPage, totalCustomers, paginate }) => {
  const pageNumbers = [];

  for (let i = 1; i <= Math.ceil(totalCustomers / customersPerPage); i++) {
    pageNumbers.push(i);
  }

  return (
    <nav className="mt-4">
      <ul className="pagination flex justify-center">
        {pageNumbers.map((number) => (
          <li key={number} className="page-item">
            <a
              onClick={() => paginate(number)}
              href="#!"
              className="page-link mx-1 px-3 py-1 border rounded text-blue-600 hover:bg-blue-600 hover:text-white transition duration-200"
            >
              {number}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default ManageCustomers;
