import React, { useEffect, useState } from 'react';
import { Tab } from '@headlessui/react';
import axiosInstance from '../utils/axiosInstance';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import GeneralTab from './GeneralTab';
import BadgesTab from './BadgesTab';
import SecurityTab from './SecurityTab';
import StatsTab from './StatsTab';
import AccountTab from './AccountTab';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const ProfileDisplay = ({ profile }) => {
  if (!profile) {
    return <div>Loading profile...</div>;
  }

  const {
    user,
    bio = 'Not provided',
    address = {},
    badges = [],
    progress = {},
    level = 1,
    experience = 0,
    setupSteps = {},
    subscriptionTier,
    subscriptionActive = false,
    services = []
  } = profile;

  const {
    name = 'Not provided',
    email = 'Not provided',
    businessInfo = {}
  } = user || {};

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">General Information</h2>
      <p><strong>Name:</strong> {name}</p>
      <p><strong>Email:</strong> {email}</p>
      <p><strong>Bio:</strong> {bio}</p>
      
      <h3 className="text-xl font-semibold">Business Information</h3>
      <p><strong>Business Name:</strong> {businessInfo.name || 'Not provided'}</p>
      <p><strong>Business Phone:</strong> {businessInfo.phone || 'Not provided'}</p>
      <p><strong>Business Website:</strong> {businessInfo.website || 'Not provided'}</p>
      <p><strong>Business Address:</strong> {businessInfo.address || 'Not provided'}</p>
      
      {/* Add more sections as needed */}
    </div>
  );
};

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    businessName: '',
    businessPhone: '',
    businessWebsite: '',
    businessAddress: '',
  });
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ name: '', description: '', price: '', duration: '' });

  useEffect(() => {
    fetchProfile();
    fetchServices();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.get('/api/profile');
      setProfile(response.data);
      setFormData({
        name: response.data.user.name,
        email: response.data.user.email,
        bio: response.data.bio || '',
        businessName: response.data.user.businessInfo?.name || '',
        businessPhone: response.data.user.businessInfo?.phone || '',
        businessWebsite: response.data.user.businessInfo?.website || '',
        businessAddress: response.data.user.businessInfo?.address || '',
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.error || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await axiosInstance.get('/api/profile/services');
      setServices(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching services:', error);
      setServices([]);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.put('/api/profile', formData);
      setProfile(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    }
  };

  const handleServiceChange = (e) => {
    setNewService({ ...newService, [e.target.name]: e.target.value });
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post('/api/profile/services', newService);
      console.log('Service added successfully:', response.data);
      setNewService({ name: '', description: '', price: '', duration: '' });
      fetchServices();
    } catch (error) {
      console.error('Error adding service:', error);
    }
  };

  const handleDeleteService = async (serviceId) => {
    try {
      await axiosInstance.delete(`/api/profile/services/${serviceId}`);
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const tabs = [
    { name: 'General', content: <ProfileDisplay profile={profile} /> },
    { name: 'Badges', content: <BadgesTab profile={profile} /> },
    { name: 'Security', content: <SecurityTab /> },
    { name: 'Stats', content: <StatsTab profile={profile} /> },
    { name: 'Account', content: <AccountTab profile={profile} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
        {loading ? (
          <div className="text-center py-12">Loading profile...</div>
        ) : error ? (
          <div className="bg-red-600 text-white p-4 rounded-md mb-6">{error}</div>
        ) : (
          <>
            <Tab.Group>
              <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
                {tabs.map((tab) => (
                  <Tab
                    key={tab.name}
                    className={({ selected }) =>
                      classNames(
                        'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                        'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                        selected
                          ? 'bg-white text-blue-700 shadow'
                          : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                      )
                    }
                  >
                    {tab.name}
                  </Tab>
                ))}
              </Tab.List>
              <Tab.Panels className="mt-2">
                {tabs.map((tab, idx) => (
                  <Tab.Panel
                    key={idx}
                    className={classNames(
                      'rounded-xl bg-gray-800 p-3',
                      'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
                    )}
                  >
                    {tab.content}
                  </Tab.Panel>
                ))}
              </Tab.Panels>
            </Tab.Group>

            {/* Services Section */}
            <div className="mt-8 bg-gray-800 p-6 rounded-xl">
              <h3 className="text-xl font-semibold mb-4">Your Services</h3>
              {Array.isArray(services) && services.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {services.map((service) => (
                      <tr key={service._id}>
                        <td className="px-6 py-4 whitespace-nowrap">{service.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{service.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap">${service.price}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{service.duration} min</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button 
                            onClick={() => handleDeleteService(service._id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-300">No services available. Add your first service below.</p>
              )}

              <form onSubmit={handleAddService} className="mt-4 space-y-4">
                <h4 className="text-lg font-medium">Add New Service</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="name"
                    value={newService.name}
                    onChange={handleServiceChange}
                    placeholder="Service Name"
                    className="rounded-md bg-gray-700 text-white px-4 py-2"
                    required
                  />
                  <input
                    type="text"
                    name="description"
                    value={newService.description}
                    onChange={handleServiceChange}
                    placeholder="Description"
                    className="rounded-md bg-gray-700 text-white px-4 py-2"
                  />
                  <input
                    type="number"
                    name="price"
                    value={newService.price}
                    onChange={handleServiceChange}
                    placeholder="Price"
                    className="rounded-md bg-gray-700 text-white px-4 py-2"
                    required
                  />
                  <input
                    type="number"
                    name="duration"
                    value={newService.duration}
                    onChange={handleServiceChange}
                    placeholder="Duration (minutes)"
                    className="rounded-md bg-gray-700 text-white px-4 py-2"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Add Service
                </button>
              </form>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Profile;