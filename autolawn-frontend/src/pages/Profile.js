// Profile.js
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import Header from '../components/Header';
import { CreditCard, Package, User } from 'lucide-react';

const tabs = [
  { name: 'Profile Settings', key: 'settings', icon: User },
  { name: 'Services', key: 'services', icon: Package },
  { name: 'Membership', key: 'membership', icon: CreditCard }
];

const Profile = () => {
  const [currentTab, setCurrentTab] = useState('settings');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    customerBaseSize: '',
    businessName: '',
    businessPhone: '',
    businessWebsite: '',
    businessAddress: ''
  });
  const [services, setServices] = useState([]);
  const [serviceFormData, setServiceFormData] = useState({
    name: '',
    description: '',
    defaultPrice: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        customerBaseSize: user.customerBaseSize || '',
        businessName: user.businessInfo?.name || '',
        businessPhone: user.businessInfo?.phone || '',
        businessWebsite: user.businessInfo?.website || '',
        businessAddress: user.businessInfo?.address || ''
      });
      fetchServices();
      setLoading(false);
    }
  }, [user]);

  const fetchServices = async () => {
    try {
      const response = await axiosInstance.get('/services');
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Failed to fetch services. Please try again.');
    }
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleServiceFormChange = (e) => {
    setServiceFormData({ ...serviceFormData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const response = await axiosInstance.put('/profile', formData);
      setFormData(response.data);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const response = await axiosInstance.post('/services', serviceFormData);
      setServices([...services, response.data]);
      setServiceFormData({ name: '', description: '', defaultPrice: '' });
      setSuccess('Service added successfully!');
    } catch (error) {
      console.error('Error adding service:', error);
      setError('Failed to add service. Please try again.');
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      setError('');
      try {
        await axiosInstance.delete(`/services/${serviceId}`);
        setServices(services.filter((service) => service._id !== serviceId));
        setSuccess('Service deleted successfully!');
      } catch (error) {
        console.error('Error deleting service:', error);
        setError('Failed to delete service. Please try again.');
      }
    }
  };

  const handleUpgradeSubscription = async (tier) => {
    try {
      const response = await axiosInstance.post('/subscription/create-checkout-session', {
        tier,
        successUrl: `${window.location.origin}/profile?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/profile`,
      });
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      setError('Failed to initiate upgrade. Please try again.');
    }
  };

  const handleCancelSubscription = async () => {
    if (window.confirm('Are you sure you want to cancel your subscription?')) {
      try {
        await axiosInstance.post('/subscription/cancel');
        setSuccess('Subscription cancelled successfully.');
      } catch (error) {
        console.error('Error cancelling subscription:', error);
        setError('Failed to cancel subscription. Please try again.');
      }
    }
  };

const renderSubscriptionDetails = () => {
    const plans = [
      {
        name: 'Basic',
        price: '$49.00/month',
        features: [
          'Up to 100 customers',
          'Basic job scheduling',
          'Core features',
          'Email support'
        ],
        tier: 'basic'
      },
      {
        name: 'Pro',
        price: '$79.00/month',
        features: [
          'Up to 500 customers',
          'Advanced scheduling',
          'All basic features',
          'Priority support',
          'Analytics dashboard',
          'Route optimization'
        ],
        tier: 'pro'
      },
      {
        name: 'Enterprise',
        price: '$199.00/month',
        features: [
          'Unlimited customers',
          'All pro features',
          'Custom solutions',
          'Dedicated support',
          'Advanced analytics',
          'API access',
          'Custom integrations'
        ],
        tier: 'enterprise'
      }
    ];

    return (
      <div className="space-y-6">
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold mb-4">Current Subscription</h3>
          <div className="mb-4">
            <p>
              <strong>Plan: </strong>
              {user.subscriptionTier ? 
                user.subscriptionTier.charAt(0).toUpperCase() + user.subscriptionTier.slice(1) 
                : 'Free'}
            </p>
            <p>
              <strong>Status: </strong>
              {user.subscriptionActive ? 'Active' : 'Inactive'}
            </p>
            {user.stripeSubscriptionId && (
              <p>
                <strong>Subscription ID: </strong>
                {user.stripeSubscriptionId}
              </p>
            )}
          </div>
          {user.subscriptionActive && (
            <button
              onClick={handleCancelSubscription}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Cancel Subscription
            </button>
          )}
        </div>

        <h3 className="text-xl font-bold mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.tier} className="bg-gray-800 rounded-lg p-6">
              <h4 className="text-xl font-bold mb-2">{plan.name}</h4>
              <p className="text-2xl font-bold text-blue-400 mb-4">{plan.price}</p>
              <ul className="mb-6 space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <svg className="h-5 w-5 text-green-400 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleUpgradeSubscription(plan.tier)}
                disabled={user.subscriptionTier === plan.tier && user.subscriptionActive}
                className={`w-full px-4 py-2 rounded-md ${
                  user.subscriptionTier === plan.tier && user.subscriptionActive
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {user.subscriptionTier === plan.tier && user.subscriptionActive 
                  ? 'Current Plan' 
                  : 'Upgrade'}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const renderTabContent = () => {
    switch (currentTab) {
      case 'settings':
        return (
          <>
            {isEditing ? (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleFormChange}
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="customerBaseSize" className="block text-sm font-medium">
                      Customer Base Size
                    </label>
                    <input
                      type="number"
                      name="customerBaseSize"
                      id="customerBaseSize"
                      value={formData.customerBaseSize}
                      onChange={handleFormChange}
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="businessName" className="block text-sm font-medium">
                      Business Name
                    </label>
                    <input
                      type="text"
                      name="businessName"
                      id="businessName"
                      value={formData.businessName}
                      onChange={handleFormChange}
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="businessPhone" className="block text-sm font-medium">
                      Business Phone
                    </label>
                    <input
                      type="tel"
                      name="businessPhone"
                      id="businessPhone"
                      value={formData.businessPhone}
                      onChange={handleFormChange}
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="businessWebsite" className="block text-sm font-medium">
                      Business Website
                    </label>
                    <input
                      type="url"
                      name="businessWebsite"
                      id="businessWebsite"
                      value={formData.businessWebsite}
                      onChange={handleFormChange}
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="businessAddress" className="block text-sm font-medium">
                      Business Address
                    </label>
                    <input
                      type="text"
                      name="businessAddress"
                      id="businessAddress"
                      value={formData.businessAddress}
                      onChange={handleFormChange}
                      className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-gray-800 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <p>
                    <strong>Name:</strong> {formData.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {formData.email}
                  </p>
                  <p>
                    <strong>Phone Number:</strong> {formData.phoneNumber || 'Not provided'}
                  </p>
                  <p>
                    <strong>Customer Base Size:</strong> {formData.customerBaseSize || 'Not provided'}
                  </p>
                  <p>
                    <strong>Business Name:</strong> {formData.businessName || 'Not provided'}
                  </p>
                  <p>
                    <strong>Business Phone:</strong> {formData.businessPhone || 'Not provided'}
                  </p>
                  <p>
                    <strong>Business Website:</strong> {formData.businessWebsite || 'Not provided'}
                  </p>
                  <p>
                    <strong>Business Address:</strong> {formData.businessAddress || 'Not provided'}
                  </p>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Edit Profile
                </button>
              </div>
            )}
          </>
        );
      case 'services':
        return (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Manage Services</h2>
            </div>
            {error && (
              <div className="bg-red-600 text-white p-4 rounded-md mb-6">{error}</div>
            )}
            {success && (
              <div className="bg-green-600 text-white p-4 rounded-md mb-6">{success}</div>
            )}
            <form onSubmit={handleAddService} className="space-y-4 mb-8">
              <div>
                <label htmlFor="serviceName" className="block text-sm font-medium">
                  Service Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="serviceName"
                  value={serviceFormData.name}
                  onChange={handleServiceFormChange}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                  required
                />
              </div>
              <div>
                <label htmlFor="serviceDescription" className="block text-sm font-medium">
                  Description
                </label>
                <textarea
                  name="description"
                  id="serviceDescription"
                  value={serviceFormData.description}
                  onChange={handleServiceFormChange}
                  rows="3"
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <label htmlFor="defaultPrice" className="block text-sm font-medium">
                  Default Price
                </label>
                <input
                  type="number"
                  name="defaultPrice"
                  id="defaultPrice"
                  value={serviceFormData.defaultPrice}
                  onChange={handleServiceFormChange}
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add Service
              </button>
            </form>
            <div className="space-y-4">
              {services.map((service) => (
                <div
                  key={service._id}
                  className="bg-gray-800 rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="text-lg font-bold">{service.name}</p>
                    <p className="text-gray-300">{service.description}</p>
                    <p className="text-blue-400">
                      <strong>Default Price:</strong> ${service.defaultPrice}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteService(service._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              ))}
              {services.length === 0 && (
                <p className="text-gray-400 text-center py-4">No services added yet.</p>
              )}
            </div>
          </>
        );
      case 'membership':
        return renderSubscriptionDetails();
      default:
        return null;
    }
  };

return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-md mb-6">{error}</div>
        )}
        {success && (
          <div className="bg-green-600 text-white p-4 rounded-md mb-6">{success}</div>
        )}
        
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setCurrentTab(tab.key)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                    currentTab === tab.key
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-300'
                  }`}>
                  <Icon className="w-5 h-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-gray-900 rounded-lg">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

export default Profile;
