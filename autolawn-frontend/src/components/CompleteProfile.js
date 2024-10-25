import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import getStripe from '../utils/stripe';

const CompleteProfile = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerBaseSize, setCustomerBaseSize] = useState('');
  const [jobTypes, setJobTypes] = useState('');
  const [plan, setPlan] = useState('');
  const [priceId, setPriceId] = useState('');
  const [alert, setAlert] = useState(null);
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get plan and priceId from location.state or query params
    const statePlan = location.state?.plan;
    const statePriceId = location.state?.priceId;
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    if (token) {
      localStorage.setItem('token', token);
    }

    if (statePlan) {
      setPlan(statePlan);
      setPriceId(statePriceId);
    } else {
      navigate('/pricing');
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Update user profile with additional data
      const response = await axiosInstance.put('/api/user/update-profile', {
        phoneNumber,
        customerBaseSize,
        jobTypes,
      });
      setUser(response.data.user);

      // Proceed to Stripe checkout
      const checkoutResponse = await axiosInstance.post('/api/payment/create-checkout-session', {
        priceId,
        plan,
      });
      const { sessionId } = checkoutResponse.data;
      const stripe = await getStripe();
      await stripe.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Error completing profile:', error);
      setAlert({ type: 'error', message: 'Failed to complete profile. Please try again.' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      {/* ... UI code ... */}
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {/* Phone Number */}
        {/* Customer Base Size */}
        {/* Job Types */}
        {/* ... similar to the registration form ... */}
        {/* Submit Button */}
      </form>
    </div>
  );
};

export default CompleteProfile;
