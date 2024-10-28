import React from 'react';
import Navbar from '../components/Navbar';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const tiers = [
  {
    name: 'Basic',
    price: '49.99',
    interval: 'month',
    productId: 'prod_R2TeQ4r5iOH6CG',
    paymentLink: 'https://buy.stripe.com/00gaGf36G05W84EeUU',
    features: [
      { text: 'Up to 50 customers', included: true },
      { text: 'Advanced scheduling', included: true },
      { text: 'Full job tracking', included: true },
      { text: 'Email and phone support', included: true },
      { text: 'Basic route optimization', included: true },
      { text: 'Basic analytics', included: true },
      { text: 'Team management', included: false },
    ],
    recommended: false
  },
  {
    name: 'Pro',
    price: '99.99',
    interval: 'month',
    productId: 'prod_R2TfmQYMHxix1e',
    paymentLink: 'https://buy.stripe.com/28oaGf9v47yoacMaEF',
    features: [
      { text: 'Unlimited customers', included: true },
      { text: 'Advanced scheduling', included: true },
      { text: 'Full job tracking', included: true },
      { text: 'Priority support', included: true },
      { text: 'Advanced route optimization', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Team management', included: true },
    ],
    recommended: true
  },
  {
    name: 'Enterprise',
    price: '199.99',
    interval: 'month',
    productId: 'prod_R2TgIYi0HUAYxf',
    paymentLink: 'https://buy.stripe.com/4gw29J7mWg4U98I002',
    features: [
      { text: 'Unlimited customers', included: true },
      { text: 'Advanced scheduling', included: true },
      { text: 'Full job tracking', included: true },
      { text: '24/7 dedicated support', included: true },
      { text: 'Advanced route optimization', included: true },
      { text: 'Custom analytics', included: true },
      { text: 'Advanced team management', included: true },
    ],
    recommended: false
  }
];

const PricingTier = ({ tier, handleCheckout }) => (
  <div className={`bg-surface p-6 rounded-lg shadow-md ${tier.recommended ? 'border-2 border-primary' : ''}`}>
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
      onClick={() => handleCheckout(tier)}
      className={`w-full py-2 px-4 rounded font-semibold transition-colors
        ${tier.recommended 
          ? 'bg-primary text-white hover:bg-primary-dark' 
          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
        }`}
    >
      Choose Plan
    </button>
  </div>
);

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = (tier) => {
    if (!user) {
      navigate('/register', { 
        state: { 
          plan: tier.name,
          paymentLink: tier.paymentLink 
        }
      });
      return;
    }

    // If user is logged in, append their ID to the payment link
    const url = new URL(tier.paymentLink);
    url.searchParams.append('client_reference_id', user.id);
    window.location.href = url.toString();
  };

  return (
    <div className="bg-background text-text min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-center mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl text-center mb-12">
          Select the perfect plan to grow your lawn care business with AUTOLAWN
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {tiers.map((tier, index) => (
            <PricingTier 
              key={index} 
              tier={tier} 
              handleCheckout={handleCheckout}
            />
          ))}
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">
            Not sure which plan is right for you?
          </h2>
          <a
            href="/contact"
            className="inline-block bg-primary text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-primary-dark transition-colors"
          >
            Contact Us
          </a>
        </div>
      </main>
    </div>
  );
};

export default Pricing;
