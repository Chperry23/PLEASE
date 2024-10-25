// frontend/src/pages/AccountTab.js

import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import ConfirmDialog from '../components/ConfirmDialog';

const AccountTab = ({ profile: initialProfile, onAccountUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [profile, setProfile] = useState(initialProfile);

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  const handleCancelSubscription = async () => {
    console.log('handleCancelSubscription called');
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await axiosInstance.post('/api/subscription/cancel');
      console.log('Cancellation response:', response.data);
      if (response.data && response.data.success) {
        if (response.data.cancelAt) {
          setSuccess(`Your subscription has been cancelled. You will have access to premium features until ${new Date(response.data.cancelAt).toLocaleDateString()}.`);
        } else {
          setSuccess(response.data.message);
        }
        // Update local profile state
        setProfile(prevProfile => ({
          ...prevProfile,
          subscriptionActive: false,
          subscriptionTier: null, 
          cancellationRequested: true,
          subscriptionEndDate: response.data.cancelAt
        }));
        // Call onAccountUpdate if it exists
        if (typeof onAccountUpdate === 'function') {
          onAccountUpdate();
        }
      } else {
        throw new Error(response.data.message || 'Failed to cancel subscription');
      }
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      setError(err.response?.data?.message || err.message || 'An error occurred while cancelling the subscription.');
    } finally {
      setIsLoading(false);
      setIsDialogOpen(false);
    }
  };

  const openCancelDialog = () => {
    console.log('Opening cancel dialog');
    setIsDialogOpen(true);
  };

  console.log('Current profile:', profile);

  return (
    <div className="space-y-6 text-white">
      <h2 className="text-2xl font-bold">Account Details</h2>
      <p><strong>Subscription Tier:</strong> {profile.subscriptionTier || 'None'}</p>
      <p><strong>Subscription Status:</strong> {profile.subscriptionActive ? 'Active' : 'Inactive'}</p>
      {profile.cancellationRequested && profile.subscriptionEndDate && (
        <p><strong>Subscription End Date:</strong> {new Date(profile.subscriptionEndDate).toLocaleDateString()}</p>
      )}
      
      {profile.subscriptionActive && !profile.cancellationRequested && (
        <button
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
          onClick={openCancelDialog}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Cancel Subscription'}
        </button>
      )}

      <ConfirmDialog
        isOpen={isDialogOpen}
        title="Are you sure you want to cancel?"
        message="Your subscription will be cancelled at the end of the current billing cycle. You will continue to have access to premium features until then."
        onConfirm={handleCancelSubscription}
        onCancel={() => {
          console.log('Dialog cancelled');
          setIsDialogOpen(false);
        }}
      />

      {error && (
        <div className="bg-red-600 text-white p-4 rounded-md">
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div className="bg-green-600 text-white p-4 rounded-md">
          <strong>Success:</strong> {success}
        </div>
      )}
      
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Danger Zone</h3>
        <button 
          onClick={() => {
            console.log('Delete Account clicked');
            /* Implement account deletion logic */
          }}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
};

export default AccountTab;
