// Pricing component file

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key (ensure this is stored securely)
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const tiers = [
  {
    name: 'Basic',
    price: '49.99',
    interval: 'month',
    productId: 'prod_R2TeQ4r5iOH6CG',
    priceId: 'price_1QAOgoE1a6rnB8cNdwUVro0S', // Replace paymentLink with priceId
    features: [
      { text: 'Up to 50 customers', included: true },
      { text: 'Advanced scheduling', included: true },
      { text: 'Full job tracking', included: true },
      { text: 'Email and phone support', included: true },
      { text: 'Basic route optimization', included: true },
      { text: 'Basic analytics', included: true },
      { text: 'Team management', included: false },
    ],
    recommended: false,
  },
  {
    name: 'Pro',
    price: '99.99',
    interval: 'month',
    productId: 'prod_R2TfmQYMHxix1e',
    priceId: 'price_1QAOhxE1a6rnB8cN0Ceo9AXM', // Replace paymentLink with priceId
    features: [
      { text: 'Unlimited customers', included: true },
      { text: 'Advanced scheduling', included: true },
      { text: 'Full job tracking', included: true },
      { text: 'Priority support', included: true },
      { text: 'Advanced route optimization', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Team management', included: true },
    ],
    recommended: true,
  },
  {
    name: 'Enterprise',
    price: '199.99',
    interval: 'month',
    productId: 'prod_R2TgIYi0HUAYxf',
    priceId: 'price_1QAOisE1a6rnB8cNlvqaNaAN', // Replace paymentLink with priceId
    features: [
      { text: 'Unlimited customers', included: true },
      { text: 'Advanced scheduling', included: true },
      { text: 'Full job tracking', included: true },
      { text: '24/7 dedicated support', included: true },
      { text: 'Advanced route optimization', included: true },
      { text: 'Custom analytics', included: true },
      { text: 'Advanced team management', included: true },
    ],
    recommended: false,
  },
];

const PricingTier = ({ tier, onSelect }) => (
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
      ${tier.price}
      <span className="text-sm font-normal">/{tier.interval}</span>
    </p>
    <ul className="space-y-2 mb-6">
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
      onClick={() => onSelect(tier)}
      className={`w-full py-2 px-4 rounded font-semibold transition-colors ${
        tier.recommended
          ? 'bg-primary text-white hover:bg-primary-dark'
          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
      }`}
    >
      Select Plan
    </button>
  </div>
);

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Function to create a checkout session
  const createCheckoutSession = async (priceId) => {
    try {
      const response = await fetch('/api/payment/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies if using cookie-based auth
        body: JSON.stringify({ priceId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }
      return data.sessionId;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  };

  const handleTierSelect = async (tier) => {
    try {
      if (!user) {
        // Store selected plan in session storage
        sessionStorage.setItem('selectedPlan', JSON.stringify(tier));
        // Redirect to register
        navigate('/register');
        return;
      }

      // Initialize Stripe.js
      const stripe = await stripePromise;

      // Create a Checkout Session
      const sessionId = await createCheckoutSession(tier.priceId);

      // Redirect to Stripe Checkout
      const result = await stripe.redirectToCheckout({ sessionId });

      if (result.error) {
        // Display error to the user
        console.error(result.error.message);
      }
    } catch (error) {
      console.error('Error selecting tier:', error);
    }
  };

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Choose Your Plan
          </h1>
          <p className="mt-5 text-xl text-gray-500">
            Select the perfect plan to grow your lawn care business
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
          {tiers.map((tier) => (
            <PricingTier key={tier.name} tier={tier} onSelect={handleTierSelect} />
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-base text-gray-500">
            Need help choosing?{' '}
            <a href="/contact" className="text-primary hover:text-primary-dark">
              Contact our sales team
            </a>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
