import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    const initializePaymentSuccess = async () => {
      try {
        // Refresh user data to get updated subscription status
        await refreshUser();

        // Set timeout for redirect
        const timer = setTimeout(() => {
          // If profile is incomplete, go to profile completion
          if (!user?.phoneNumber || !user?.customerBaseSize) {
            navigate('/complete-profile');
          } else {
            navigate('/dashboard');
          }
        }, 5000);

        return () => clearTimeout(timer);
      } catch (error) {
        console.error('Error processing payment success:', error);
        navigate('/pricing');
      }
    };

    initializePaymentSuccess();
  }, [navigate, user, refreshUser]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-primary">
          Payment Successful!
        </h1>
        <p className="text-xl mb-8 text-gray-600">
          Thank you for subscribing to AutoLawn
        </p>
        <div className="animate-pulse">
          <p className="text-sm text-gray-500">
            You will be redirected automatically...
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
