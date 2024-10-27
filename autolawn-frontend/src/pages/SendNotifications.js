// src/pages/SendNotifications.js
import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance'; // Use axiosInstance
import Header from '../components/Header';

const SendNotifications = () => {
  const [customers, setCustomers] = useState([]);
  const [message, setMessage] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [notificationType, setNotificationType] = useState('email');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axiosInstance.get('http://autolawn.app/api/customers', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setError(
        `Failed to fetch customers. ${error.response?.data?.message || 'Please try again.'}`
      );
    }
  };

  const handleSelectCustomer = (customerId) => {
    setSelectedCustomers((prev) =>
      prev.includes(customerId)
        ? prev.filter((id) => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSelectAll = () => {
    setSelectedCustomers(
      selectedCustomers.length === customers.length
        ? []
        : customers.map((customer) => customer._id)
    );
  };

  const handleSendNotification = async () => {
    try {
      const response = await axiosInstance.post(
        'http://autolawn.app/api/notifications/send', // Ensure this matches your server route
        {
          customerIds: selectedCustomers,
          message,
          type: notificationType,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
  
      setResult({
        success: true,
        message: 'Notifications sent successfully!',
        details: response.data.results,
      });
    } catch (error) {
      console.error('Error sending notifications:', error);
      setResult({
        success: false,
        message: 'Failed to send notifications. Please try again.',
        error: error.response?.data?.message || error.message,
      });
    } finally {
      setSending(false);
    }
  };  

  return (
    <div className="min-h-screen bg-background text-gray-800">
      <Header />
      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-bold mb-4 text-white">Send Notifications</h1>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <div className="bg-gray-900 shadow-md rounded-lg p-6">
            <div className="mb-4">
              <label className="block text-white mb-2">Notification Type</label>
              <div className="flex space-x-4">
                <button
                  className={`px-4 py-2 rounded ${
                    notificationType === 'email'
                      ? 'bg-primary text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                  onClick={() => setNotificationType('email')}
                >
                  Email
                </button>
                <button
                  className={`px-4 py-2 rounded ${
                    notificationType === 'sms'
                      ? 'bg-primary text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                  onClick={() => setNotificationType('sms')}
                >
                  SMS
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="message" className="block text-white mb-2">
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 text-gray-800 border rounded-lg focus:outline-none focus:border-primary"
                rows="4"
                placeholder="Enter your message here..."
                maxLength={notificationType === 'sms' ? 160 : undefined}
              ></textarea>
              {notificationType === 'sms' && (
                <p className="text-sm text-gray-400">
                  {160 - message.length} characters remaining.
                </p>
              )}
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-white">Select Customers</label>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-primary hover:underline"
                >
                  {selectedCustomers.length === customers.length
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto bg-gray-800 rounded-lg p-2">
                {customers.map((customer) => (
                  <div key={customer._id} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id={customer._id}
                      checked={selectedCustomers.includes(customer._id)}
                      onChange={() => handleSelectCustomer(customer._id)}
                      className="mr-2"
                    />
                    <label htmlFor={customer._id} className="text-white cursor-pointer">
                      {customer.name} (
                      {notificationType === 'email' ? customer.email : customer.phone})
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleSendNotification}
              disabled={sending}
              className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition duration-300"
            >
              {sending ? 'Sending...' : 'Send Notification'}
            </button>

            {result && (
              <div
                className={`mt-4 p-3 rounded ${
                  result.success ? 'bg-green-600' : 'bg-red-600'
                } text-white`}
              >
                {result.message}
                {result.details && (
                  <ul className="mt-2">
                    {result.details.map((item) => (
                      <li key={item.customerId}>
                        Customer ID: {item.customerId} - Status: {item.status}
                        {item.error && ` - Error: ${item.error}`}
                      </li>
                    ))}
                  </ul>
                )}
                {result.error && <p>Error: {result.error}</p>}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SendNotifications;
