import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializePaymentSuccess = async () => {
      try {
        // Get token from URL or localStorage
        const params = new URLSearchParams(location.search);
        const urlToken = params.get('token');
        if (urlToken) {
          localStorage.setItem('token', urlToken);
        }

        // Wait for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Refresh user data with token
        await refreshUser();

        setLoading(false);

        // Check user's subscription status
        const user = await refreshUser();
        console.log('User subscription status:', user?.subscriptionTier, user?.subscriptionActive);

        if (!user?.subscriptionTier || !user?.subscriptionActive) {
          console.error('Subscription not activated after payment');
          navigate('/pricing');
          return;
        }

        if (!user?.phoneNumber || !user?.customerBaseSize) {
          navigate('/complete-profile');
        } else {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Payment success error:', error);
        setError('Error verifying subscription');
        setLoading(false);
      }
    };

    initializePaymentSuccess();
  }, [navigate, refreshUser, location]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">{error}</h1>
          <p className="text-gray-600 mb-4">
            There was an issue activating your subscription.
          </p>
          <button
            onClick={() => navigate('/pricing')}
            className="bg-primary text-white px-4 py-2 rounded"
          >
            Return to Pricing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-primary">
          Payment Successful!
        </h1>
        <p className="text-xl mb-8 text-gray-600">
          Thank you for subscribing to AutoLawn
        </p>
        {loading && (
          <div className="animate-pulse">
            <p className="text-sm text-gray-500">
              Setting up your subscription...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
