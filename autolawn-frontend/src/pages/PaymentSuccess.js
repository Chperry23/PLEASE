import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser, verifyToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializePaymentSuccess = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const clientReferenceId = params.get('client_reference_id') || localStorage.getItem('pendingUserId');

        if (!clientReferenceId) {
          console.error('No client reference ID found');
          setError('Missing user reference');
          setLoading(false);
          return;
        }

        // Wait for webhook to process
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Try to verify token and refresh user data
        await verifyToken();
        const userData = await refreshUser();

        if (!userData?.subscriptionActive) {
          console.error('Subscription not activated');
          setError('Subscription activation pending');
          setLoading(false);
          return;
        }

        // Clear pending user ID
        localStorage.removeItem('pendingUserId');
        
        setLoading(false);

        // Route based on profile completion
        if (!userData.phoneNumber || !userData.customerBaseSize) {
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
  }, [navigate, refreshUser, verifyToken, location]);

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
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark"
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
              Setting up your subscription...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
