import React, { useState } from 'react';
import axios from 'axios';

const CustomerNotifications = ({ customers }) => {
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCustomerSelect = (customerId) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSendNotification = async () => {
    if (selectedCustomers.length === 0) {
      setError('Please select at least one customer.');
      return;
    }
    if (!message.trim()) {
      setError('Please enter a message.');
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('http://localhost:5000/api/notifications', {
        customerIds: selectedCustomers,
        message
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSuccess('Notifications sent successfully!');
      setSelectedCustomers([]);
      setMessage('');
    } catch (error) {
      setError('Failed to send notifications. Please try again.');
      console.error('Error sending notifications:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-surface p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Send Notifications</h2>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Select Customers:</h3>
        <div className="max-h-60 overflow-y-auto">
          {customers.map(customer => (
            <div key={customer._id} className="flex items-center mb-2">
              <input
                type="checkbox"
                id={customer._id}
                checked={selectedCustomers.includes(customer._id)}
                onChange={() => handleCustomerSelect(customer._id)}
                className="mr-2"
              />
              <label htmlFor={customer._id}>{customer.name}</label>
            </div>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Message:</h3>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full p-2 border rounded"
          rows="4"
        ></textarea>
      </div>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {success && <p className="text-green-500 mb-2">{success}</p>}
      <button
        onClick={handleSendNotification}
        disabled={sending}
        className={`bg-primary text-white px-4 py-2 rounded ${sending ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'}`}
      >
        {sending ? 'Sending...' : 'Send Notifications'}
      </button>
    </div>
  );
};

export default CustomerNotifications;
