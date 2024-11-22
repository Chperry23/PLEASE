import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from '../utils/axiosInstance';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'

  useEffect(() => {
    const initializePaymentSuccess = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const sessionId = params.get('session_id');

        if (!sessionId) {
          console.error('No session ID found');
          setError('Missing payment information');
          setStatus('error');
          setLoading(false);
          return;
        }

        console.log('Processing payment success:', { sessionId });

        // Wait for webhook to process (3 second delay)
        await new Promise(resolve => setTimeout(resolve, 3000));

        try {
          // Verify the session status
          const response = await axios.post('/payment/verify-session', {
            sessionId
          });

          if (response.data.success) {
            console.log('Payment verified successfully');
            setStatus('success');
          } else {
            console.error('Payment verification failed');
            throw new Error('Payment verification failed');
          }
        } catch (verifyError) {
          console.error('Verification error:', verifyError);
          throw new Error('Unable to verify payment');
        }

        // Clear token and show success
        localStorage.removeItem('token');
        setLoading(false);

        // Delay before redirect
        setTimeout(() => {
          navigate('/signin', {
            state: { 
              message: 'Payment successful! Please sign in to continue.',
              paymentComplete: true
            },
            replace: true
          });
        }, 2000);

      } catch (error) {
        console.error('Payment success error:', error);
        setError(error.message || 'Error processing payment');
        setStatus('error');
        setLoading(false);
      }
    };

    initializePaymentSuccess();
  }, [navigate, location.search]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-gray-500">
            Processing your subscription...
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-y-4">
            <button
              onClick={() => navigate('/pricing')}
              className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors"
            >
              Return to Pricing
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="block w-full text-gray-600 hover:text-gray-900 mt-2"
            >
              Contact Support
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="success-animation">
          <div className="checkmark-circle mx-auto">
            <div className="text-green-500 text-6xl">✓</div>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Redirecting you to sign in...
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto px-4">
        <h1 className="text-4xl font-bold mb-4 text-primary">
          {status === 'success' ? 'Payment Successful!' : 'Processing Payment...'}
        </h1>
        <p className="text-xl mb-8 text-gray-600">
          {status === 'success' 
            ? 'Thank you for subscribing to AutoLawn'
            : 'Please wait while we confirm your payment...'}
        </p>
        {renderContent()}
      </div>
    </div>
  );
};

export default PaymentSuccess;
