// frontend/src/pages/Pricing.js

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { FaCheck, FaTimes } from 'react-icons/fa';
import axiosInstance from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
      Choose Plan
    </button>
  </div>
);

const Pricing = () => {
  const [tiers, setTiers] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Define payment links as variables
  const basicLink = 'https://buy.stripe.com/00gaGf36G05W84EeUU';
  const proLink = 'https://buy.stripe.com/28oaGf9v47yoacMaEF';
  const enterpriseLink = 'https://buy.stripe.com/4gw29J7mWg4U98I002';

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await axiosInstance.get('/api/payment/prices');
        const prices = response.data;

        // Map prices to tiers
        const priceTiers = prices.map((price) => {
          const tierName = price.nickname || price.product.name;
          let paymentLink;

          // Assign payment link based on tier name
          if (tierName === 'Basic') {
            paymentLink = basicLink;
          } else if (tierName === 'Pro') {
            paymentLink = proLink;
          } else if (tierName === 'Enterprise') {
            paymentLink = enterpriseLink;
          }

          return {
            name: tierName,
            priceAmount: (price.unit_amount / 100).toFixed(2),
            priceInterval: price.recurring ? price.recurring.interval : 'one-time',
            priceId: price.id,
            recommended: tierName === 'Pro',
            features: getFeaturesForTier(tierName),
            paymentLink, // Ensure this is correctly set
          };
        });

        const filteredTiers = priceTiers.filter((tier) => tier.name !== 'Free');

        // Arrange tiers in the desired order
        const orderedTiers = filteredTiers.sort((a, b) => {
          const order = ['Basic', 'Pro', 'Enterprise'];
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

  const handleCheckout = (priceId, tierName) => {
    let paymentLink;

    // Set the correct payment link based on the tier
    if (tierName === 'Basic') {
      paymentLink = basicLink;
    } else if (tierName === 'Pro') {
      paymentLink = proLink;
    } else if (tierName === 'Enterprise') {
      paymentLink = enterpriseLink;
    }

    if (!paymentLink) {
      console.error('Error: Payment link is missing for', tierName);
      return;
    }

    if (!user) {
      // User is not logged in, redirect to registration with selected plan
      navigate('/register', { state: { plan: tierName, priceId, paymentLink } });
      return;
    }

    try {
      // Append client_reference_id to the payment link
      const url = new URL(paymentLink);
      url.searchParams.append('client_reference_id', user.id);

      // Redirect to the Payment Link with user ID
      window.location.href = url.toString();
    } catch (error) {
      console.error('Error constructing URL:', error);
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
