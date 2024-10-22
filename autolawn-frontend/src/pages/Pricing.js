// src/pages/Pricing.js

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { FaCheck, FaTimes } from 'react-icons/fa';
import axiosInstance from '../utils/axiosInstance'; // Use axiosInstance
import getStripe from '../utils/stripe';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

const PricingTier = ({ tier, handleCheckout }) => (
  <div
    className={`bg-surface p-6 rounded-lg shadow-md ${
      tier.recommended ? 'border-2 border-primary' : ''
    }`}
  >
    {tier.recommended && (
      <span className="bg-primary text-white px-2 py-1 rounded-full text-sm font-semibold mb-2 inline-block">
        Recommended
      </span>
    )}
    <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
    <p className="text-3xl font-bold mb-4">
      ${tier.priceAmount}
      <span className="text-sm font-normal">/{tier.priceInterval}</span>
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
      className={`mt-6 w-full py-2 px-4 rounded ${
        tier.recommended ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800'
      } font-semibold`}
      onClick={() => handleCheckout(tier.priceId, tier.name)}
    >
      {tier.name === 'Free' ? 'Select Free' : 'Choose Plan'}
    </button>
  </div>
);

const Pricing = () => {
  const [tiers, setTiers] = useState([]);
  const { setSubscriptionTier } = useAuth(); // Use setSubscriptionTier from AuthContext
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await axiosInstance.get(
          `${process.env.REACT_APP_API_URL}/api/payment/prices`
        );
        const prices = response.data;

        // Map prices to tiers
        const priceTiers = prices.map((price) => {
          const tierName = price.nickname || price.product.name;
          const tierFeatures = getFeaturesForTier(tierName);

          return {
            name: tierName,
            priceAmount: (price.unit_amount / 100).toFixed(2),
            priceInterval: price.recurring ? price.recurring.interval : 'one-time',
            priceId: price.id,
            recommended: tierName === 'Pro',
            features: tierFeatures,
          };
        });

        // Define the Free tier manually
        const freeTier = {
          name: 'Free',
          priceAmount: '0.00',
          priceInterval: 'month',
          priceId: null,
          recommended: false,
          features: getFeaturesForTier('Free'),
        };

        // Arrange tiers in the desired order
        const orderedTiers = [freeTier, ...priceTiers].sort((a, b) => {
          const order = ['Free', 'Basic', 'Pro', 'Enterprise'];
          return order.indexOf(a.name) - order.indexOf(b.name);
        });

        setTiers(orderedTiers);
      } catch (error) {
        console.error('Error fetching prices:', error);
        alert(
          'An error occurred while fetching pricing information. Please try again later.'
        );
      }
    };

    fetchPrices();
  }, []);

  const getFeaturesForTier = (tierName) => {
    // Define features for each tier
    const features = {
      Free: [
        { text: 'Up to 10 customers', included: true },
        { text: 'Basic scheduling', included: true },
        { text: 'Limited job tracking', included: true },
        { text: 'Email support', included: true },
        { text: 'Route optimization', included: false },
        { text: 'Advanced analytics', included: false },
        { text: 'Team management', included: false },
      ],
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
    if (tierName === 'Free') {
      // Directly set user's subscription to Free without payment
      try {
        const response = await axiosInstance.post(
          `${process.env.REACT_APP_API_URL}/api/auth/set-subscription-tier`,
          { tier: 'Free' },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`, // Include token if required
            },
          }
        );
        if (response.data.user) {
          // Update AuthContext
          setSubscriptionTier(response.data.user);
          alert('Successfully set to Free tier.');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error setting Free tier:', error);
        alert('An error occurred. Please try again.');
      }
    } else {
      try {
        const response = await axiosInstance.post(
          `${process.env.REACT_APP_API_URL}/api/payment/create-checkout-session`,
          { priceId, plan: tierName }, // Include 'plan' here
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`, // Include token if required
            },
          }
        );
        const { sessionId } = response.data;
        const stripe = await getStripe();
        const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
        if (stripeError) {
          console.error('Stripe redirect error:', stripeError);
          alert('An error occurred during checkout. Please try again.');
        }
      } catch (error) {
        console.error('Error redirecting to checkout:', error);
        alert('An error occurred. Please try again.');
      }
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {tiers.map((tier, index) => (
            <PricingTier key={index} tier={tier} handleCheckout={handleCheckout} />
          ))}
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
