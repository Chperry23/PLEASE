import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser, verifyToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const MAX_RETRIES = 6; // Increased retries
  const RETRY_DELAY = 3000; // Reduced to 3 seconds

  useEffect(() => {
    const initializePaymentSuccess = async () => {
      try {
        // Get identifiers
        const params = new URLSearchParams(location.search);
        const sessionId = params.get('session_id');
        const token = localStorage.getItem('token');

        console.log('Payment Success Initialization:', {
          sessionId,
          hasToken: !!token,
          retryCount,
          timestamp: new Date().toISOString()
        });

        if (!sessionId) {
          console.error('No session ID found');
          setError('Missing payment information');
          setLoading(false);
          navigate('/pricing');
          return;
        }

        if (!token) {
          console.error('No auth token found');
          setError('Authentication required');
          setLoading(false);
          navigate('/signin');
          return;
        }

        // Initial wait for webhook
        console.log('Waiting for webhook processing...');
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));

        try {
          // Check subscription status
          const userData = await refreshUser();
          console.log('User data received:', userData);

          if (!userData?.subscriptionActive || !userData?.subscriptionTier) {
            console.log(`Subscription not active, attempt ${retryCount + 1} of ${MAX_RETRIES}`);
            if (retryCount < MAX_RETRIES) {
              setRetryCount(prev => prev + 1);
              return; // This will trigger another useEffect run
            } else {
              throw new Error('Subscription activation not detected after maximum retries');
            }
          }

          // Success path
          console.log('Subscription activated successfully:', {
            tier: userData.subscriptionTier,
            active: userData.subscriptionActive
          });

          setLoading(false);

          // Route based on profile completion
          if (!userData.phoneNumber || !userData.customerBaseSize) {
            navigate('/complete-profile');
          } else {
            navigate('/dashboard');
          }
        } catch (error) {
          console.error('Authentication error:', error);
          setError('Authentication failed');
          setLoading(false);
          navigate('/signin');
        }
      } catch (error) {
        console.error('Payment success error:', error);
        setError(error.message || 'Error verifying subscription');
        setLoading(false);
      }
    };

    if (loading) {
      initializePaymentSuccess();
    }
  }, [navigate, refreshUser, verifyToken, location, loading, retryCount]);

  // Keep showing loading state until redirect
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto px-4">
        <h1 className="text-4xl font-bold mb-4 text-primary">
          Payment Successful!
        </h1>
        <p className="text-xl mb-8 text-gray-600">
          Thank you for subscribing to AutoLawn
        </p>
        {loading ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-gray-500">
              {retryCount > 0 
                ? `Activating your subscription (attempt ${retryCount}/${MAX_RETRIES})...`
                : 'Activating your subscription...'}
            </p>
          </div>
        ) : error ? (
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/pricing')}
              className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors"
            >
              Return to Pricing
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PaymentSuccess;
