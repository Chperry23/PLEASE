// frontend/src/pages/PaymentSuccess.js

import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    // Optionally, you can extract query parameters from the URL if needed
    // For example, if you pass session_id or other data

    // Redirect to sign-in or dashboard after a delay
    const timer = setTimeout(() => {
      navigate('/signin');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <h1 className="text-3xl font-bold mb-4">Thank you for your purchase!</h1>
      <p className="mb-8">Your subscription has been activated.</p>
      <p>You will be redirected shortly...</p>
      <button
        onClick={() => navigate('/signin')}
        className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-md"
      >
        Go to Sign In
      </button>
    </div>
  );
};

export default PaymentSuccess;
