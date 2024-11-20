// src/pages/SubscriptionSuccess.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SubscriptionSuccess = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { checkSubscription } = useAuth();

  useEffect(() => {
    const verifySession = async () => {
      try {
        // Get session_id from URL query parameters
        const searchParams = new URLSearchParams(location.search);
        const sessionId = searchParams.get('session_id');

        if (!sessionId) {
          throw new Error('No session ID found');
        }

        // Verify the session with your backend
        const response = await fetch('/api/payment/verify-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
          throw new Error('Failed to verify session');
        }

        // Update subscription status
        await checkSubscription();

        // Redirect to dashboard after short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } catch (error) {
        console.error('Error verifying subscription:', error);
        setError('Failed to verify subscription. Please contact support.');
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, [location, navigate, checkSubscription]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-lg text-white">Processing your subscription...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-green-500 text-5xl mb-4">✓</div>
        <h1 className="text-2xl font-bold text-white mb-4">Subscription Successful!</h1>
        <p className="text-gray-300 mb-4">Thank you for subscribing. Redirecting to dashboard...</p>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;
