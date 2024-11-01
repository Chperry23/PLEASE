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
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 5000; // 5 seconds

  useEffect(() => {
    const initializePaymentSuccess = async () => {
      try {
        // Get identifiers
        const params = new URLSearchParams(location.search);
        const clientReferenceId = params.get('client_reference_id') || localStorage.getItem('pendingUserId');
        const pendingEmail = localStorage.getItem('pendingUserEmail');
        const token = localStorage.getItem('token');

        console.log('Payment Success Initialization:', {
          clientReferenceId,
          hasEmail: !!pendingEmail,
          hasToken: !!token,
          retryCount
        });

        if (!token) {
          console.error('No auth token found');
          setError('Authentication required');
          setLoading(false);
          return;
        }

        if (!clientReferenceId && !pendingEmail) {
          console.error('No user reference found');
          setError('Missing user reference');
          setLoading(false);
          return;
        }

        // Initial wait for webhook
        console.log('Waiting for webhook processing...');
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));

        try {
          // Verify token and refresh user data
          console.log('Verifying token...');
          await verifyToken();
          
          console.log('Refreshing user data...');
          const userData = await refreshUser();
          console.log('User data received:', userData);

          if (!userData?.subscriptionActive) {
            console.log(`Subscription not active, attempt ${retryCount + 1} of ${MAX_RETRIES}`);
            
            if (retryCount < MAX_RETRIES) {
              setRetryCount(prev => prev + 1);
              return; // This will trigger another useEffect run
            } else {
              throw new Error('Subscription activation failed after retries');
            }
          }

          // Success path
          console.log('Subscription activated successfully');
          localStorage.removeItem('pendingUserId');
          localStorage.removeItem('pendingUserEmail');
          
          setLoading(false);

          // Route based on profile completion
          if (!userData.phoneNumber || !userData.customerBaseSize) {
            console.log('Redirecting to complete profile...');
            navigate('/complete-profile');
          } else {
            console.log('Redirecting to dashboard...');
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

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">{error}</h1>
          <p className="text-gray-600 mb-4">
            Please contact support if this issue persists.
          </p>
          <button
            onClick={() => navigate('/pricing')}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors"
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
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-gray-500">
              {retryCount > 0 
                ? `Setting up your subscription (attempt ${retryCount}/${MAX_RETRIES})...`
                : 'Setting up your subscription...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
