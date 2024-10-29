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
import SubscriptionManagement from '../components/SubscriptionManagement';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

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

  useEffect(() => {
    fetchProfile();
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

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.put('/api/profile', formData);
      setProfile(response.data);
      setIsEditing(false);
      setError('');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    }
  };

  const tabs = [
    {
      name: 'General',
      content: (
        <GeneralTab
          profile={profile}
          formData={formData}
          handleChange={handleFormChange}
          handleSubmit={handleFormSubmit}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
        />
      )
    },
    {
      name: 'Account & Subscription',
      content: (
        <div className="space-y-8">
          <AccountTab 
            profile={profile}
            onAccountUpdate={fetchProfile}
          />
          <SubscriptionManagement />
        </div>
      )
    },
    {
      name: 'Security',
      content: <SecurityTab />
    },
    {
      name: 'Stats',
      content: <StatsTab profile={profile} />
    },
    {
      name: 'Badges',
      content: <BadgesTab profile={profile} />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Your Profile</h1>
          {profile?.subscriptionTier && (
            <span className="px-4 py-2 bg-primary rounded-full text-sm font-semibold">
              {profile.subscriptionTier} Plan
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : error ? (
          <div className="bg-red-600 text-white p-4 rounded-md mb-6">{error}</div>
        ) : (
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
                    'rounded-xl bg-gray-800 p-6',
                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
                  )}
                >
                  {tab.content}
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        )}
      </main>
    </div>
  );
};

export default Profile;
