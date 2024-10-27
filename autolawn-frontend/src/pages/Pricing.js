// src/pages/Pricing.jsx
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { FaCheck, FaTimes } from 'react-icons/fa';
import axiosInstance from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Component to display each pricing tier
const PricingTier = ({ tier, handleCheckout }) => (
  <div className={`bg-surface p-6 rounded-lg shadow-md ${tier.recommended ? 'border-2 border-primary' : ''}`}>
    {tier.recommended && (
      <span className="bg-primary text-white px-2 py-1 rounded-full text-sm font-semibold mb-2 inline-block">
        Recommended
      </span>
    )}
    <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
    <p className="text-3xl font-bold mb-4">
      ${tier.amount} / {tier.interval}
    </p>
    <ul className="space-y-2">
      {tier.features.map((feature, index) => (
        <li key={index} className="flex items-center">
          {feature.included ? (
            <FaCheck className="text-green-500 mr-2" />
          ) : (
            <FaTimes className="text-red-500 mr-2" />
          )}
          <span className={feature.included ? '' : 'text-gray-400'}>
            {feature.text}
          </span>
        </li>
      ))}
    </ul>
    <button
      className={`mt-6 w-full py-2 px-4 rounded ${tier.recommended ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800'} font-semibold`}
      onClick={() => handleCheckout(tier.priceId, tier.name)}
    >
      Choose Plan
    </button>
  </div>
);

const Pricing = () => {
  const [tiers, setTiers] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        console.log('Fetching prices from backend...');
        const response = await axiosInstance.get('/api/payment/prices');
        console.log('Prices response received:', response);

        const prices = response.data;

        // Map the prices to include features based on tier name
        const mappedTiers = prices.map((price) => ({
          ...price,
          features: getFeaturesForTier(price.name),
          recommended: price.name === 'Pro', // Adjust based on your preference
        }));

        setTiers(mappedTiers);
        console.log('Tiers set:', mappedTiers);
      } catch (error) {
        console.error('Error fetching prices:', error);
      }
    };

    fetchPrices();
  }, []);

  const getFeaturesForTier = (tierName) => {
    // Define features for each tier
    const features = {
      Basic: [
        { text: 'Up to 50 customers', included: true },
        { text: 'Advanced scheduling', included: true },
        { text: 'Full job tracking', included: true },
        { text: 'Email and phone support', included: true },
        { text: 'Basic route optimization', included: true },
        { text: 'Basic analytics', included: true },
        { text: 'Team management', included: false },
      ],
      Pro: [
        { text: 'Unlimited customers', included: true },
        { text: 'Advanced scheduling', included: true },
        { text: 'Full job tracking', included: true },
        { text: 'Priority support', included: true },
        { text: 'Advanced route optimization', included: true },
        { text: 'Advanced analytics', included: true },
        { text: 'Team management', included: true },
      ],
      Enterprise: [
        { text: 'Unlimited customers', included: true },
        { text: 'Advanced scheduling', included: true },
        { text: 'Full job tracking', included: true },
        { text: '24/7 dedicated support', included: true },
        { text: 'Advanced route optimization', included: true },
        { text: 'Custom analytics', included: true },
        { text: 'Advanced team management', included: true },
      ],
    };
    return features[tierName] || [];
  };

  const handleCheckout = async (priceId, tierName) => {
    console.log(`Initiating checkout for tier: ${tierName}`);
    console.log('Price ID:', priceId);

    if (!priceId) {
      console.error(`No price ID found for tier: ${tierName}`);
      alert('Selected tier is not available. Please contact support.');
      return;
    }

    if (!user) {
      console.log('User not logged in. Redirecting to registration...');
      // User is not logged in, redirect to registration with selected plan
      navigate('/register', { state: { plan: tierName, priceId } });
      return;
    }

    try {
      // Create Checkout Session on the backend
      const response = await axiosInstance.post('/create-checkout-session', { priceId });

      const { url } = response.data;

      if (url) {
        console.log('Redirecting to Stripe Checkout URL:', url);
        window.location.href = url;
      } else {
        alert('Failed to redirect to checkout.');
      }
    } catch (error) {
      console.error('Error creating Checkout session:', error);
      alert('There was an issue processing your payment. Please try again.');
    }
  };

  return (
    <div className="bg-background text-text min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-center mb-12">Choose Your Plan</h1>
        <p className="text-xl text-center mb-12">
          Select the perfect plan to grow your lawn care business with AUTOLAWN
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.length > 0 ? (
            tiers.map((tier, index) => (
              <PricingTier key={index} tier={tier} handleCheckout={handleCheckout} />
            ))
          ) : (
            <p className="text-center col-span-3">Loading pricing tiers...</p>
          )}
        </div>
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold mb-4">
            Not sure which plan is right for you?
          </h2>
          <a
            href="/contact"
            className="bg-primary text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-opacity-90 transition duration-300"
          >
            Contact Us
          </a>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
