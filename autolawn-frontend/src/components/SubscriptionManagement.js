import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';

const SubscriptionManagement = () => {
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/subscription/details');
      setSubscription(response.data.subscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setError('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setLoading(true);
      await axiosInstance.post('/api/subscription/cancel');
      await fetchSubscription();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      setError('Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Subscription Management</h2>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      )}

      {subscription && (
        <div>
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded mb-4">
            <div>
              <h3 className="font-semibold text-lg">
                {subscription.tier || 'No Active Plan'} Plan
              </h3>
              <p className="text-gray-600">
                Status: {subscription.active ? 'Active' : 'Inactive'}
              </p>
              {subscription.currentPeriodEnd && (
                <p className="text-gray-600">
                  Next billing: {new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="space-x-4">
              <button
                onClick={handleUpgrade}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
              >
                Upgrade Plan
              </button>
              {subscription.active && (
                <button
                  onClick={handleCancelSubscription}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel Plan
                </button>
              )}
            </div>
          </div>

          {subscription.cancelAtPeriodEnd && (
            <div className="bg-yellow-50 text-yellow-700 p-4 rounded">
              Your subscription will end on {new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;
