import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Alert from './Alert';

const CompleteProfile = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerBaseSize, setCustomerBaseSize] = useState('');
  const [jobTypes, setJobTypes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await updateUserProfile({
        phoneNumber,
        customerBaseSize: parseInt(customerBaseSize),
        jobTypes
      });

      // Navigate to dashboard after profile completion
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold">Complete Your Profile</h2>
          <p className="mt-2 text-gray-600">
            Please provide some additional information to get started
          </p>
        </div>

        {error && <Alert type="error" message={error} />}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium">
              Phone Number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="(123) 456-7890"
            />
          </div>

          <div>
            <label htmlFor="customerBaseSize" className="block text-sm font-medium">
              Current Customer Base Size
            </label>
            <input
              id="customerBaseSize"
              type="number"
              required
              value={customerBaseSize}
              onChange={(e) => setCustomerBaseSize(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="0"
            />
          </div>

          <div>
            <label htmlFor="jobTypes" className="block text-sm font-medium">
              Job Types
            </label>
            <select
              id="jobTypes"
              required
              value={jobTypes}
              onChange={(e) => setJobTypes(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">Select job types...</option>
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Both">Both</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {loading ? 'Saving...' : 'Complete Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;

