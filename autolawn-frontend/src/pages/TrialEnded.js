import React from 'react';
import { Link } from 'react-router-dom';

const TrialEnded = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-md max-w-lg w-full text-center">
        <h1 className="text-3xl font-bold mb-4 text-yellow-400">Your Free Trial Has Ended</h1>
        <p className="mb-6 text-lg">
          Thank you for trying out <span className="text-blue-400">AUTOLAWN</span>! Your 7-day free trial has now ended.
          To continue using the application and unlock all features, please upgrade your subscription.
        </p>
        <div className="flex flex-col space-y-4">
          <Link
            to="/pricing"
            className="bg-blue-500 text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-blue-600 transition duration-300"
          >
            Upgrade Now
          </Link>
          <Link
            to="/"
            className="bg-gray-600 text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-gray-500 transition duration-300"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TrialEnded;
