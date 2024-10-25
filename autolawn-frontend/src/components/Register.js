// src/components/Register.js

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Alert from './Alert';
import Navbar from './Navbar';

const Register = () => {
  // State variables
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('');
  const [priceId, setPriceId] = useState('');
  const [paymentLink, setPaymentLink] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Additional fields
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerBaseSize, setCustomerBaseSize] = useState('');
  const [jobTypes, setJobTypes] = useState('');

  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    // Get plan, priceId, and paymentLink from location.state
    const statePlan = location.state?.plan;
    const statePriceId = location.state?.priceId;
    const statePaymentLink = location.state?.paymentLink;

    if (statePlan && (statePriceId || statePaymentLink)) {
      setPlan(statePlan);
      setPriceId(statePriceId);
      setPaymentLink(statePaymentLink);
    } else {
      // No plan selected, redirect to pricing page
      navigate('/pricing');
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Password validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;
    if (!passwordRegex.test(password)) {
      setPasswordError(
        'Password must be at least 8 characters, include an uppercase letter and a special character.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    // Clear password error if validation passes
    setPasswordError('');

    try {
      // Register the user
      const registeredUser = await register({
        name,
        email,
        password,
        phoneNumber,
        customerBaseSize,
        jobTypes,
        plan,
      });
  
      // Append client_reference_id to the payment link
      const url = new URL(paymentLink);
      url.searchParams.append('client_reference_id', registeredUser.id);
  
      // Redirect to the Payment Link
      window.location.href = url.toString();
    } catch (error) {
      console.error('Error during registration:', error);
      setAlert({
        type: 'error',
        message:
          error.response?.data?.error || 'Failed to register. Please check your details.',
      });
    }
  };

  return (
    <>
      <Navbar /> {/* Add Navbar to the registration page */}
      <div className="bg-background text-text min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link to="/">
            <img
              className="mx-auto h-12 w-auto"
              src="/logo.svg" // Replace with your logo path
              alt="Logo"
            />
          </Link>
          <h2 className="mt-6 text-center text-3xl font-extrabold">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm">
            Or{' '}
            <Link
              to="/signin"
              className="font-medium text-primary hover:text-primary-dark"
            >
              sign in to your account
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-surface py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {alert && <Alert type={alert.type} message={alert.message} />}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium">
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 
                    rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary 
                    focus:border-primary sm:text-sm text-gray-900"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email-address" className="block text-sm font-medium">
                  Email Address
                </label>
                <div className="mt-1">
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 
                    rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary 
                    focus:border-primary sm:text-sm text-gray-900"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 
                    rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary 
                    focus:border-primary sm:text-sm text-gray-900"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium">
                  Confirm Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 
                    rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary 
                    focus:border-primary sm:text-sm text-gray-900"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Error */}
              {passwordError && (
                <div className="text-red-500 text-sm">
                  {passwordError}
                </div>
              )}

              {/* Phone Number */}
              <div>
                <label htmlFor="phone-number" className="block text-sm font-medium">
                  Phone Number
                </label>
                <div className="mt-1">
                  <input
                    id="phone-number"
                    name="phoneNumber"
                    type="text"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 
                    rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary 
                    focus:border-primary sm:text-sm text-gray-900"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>

              {/* Customer Base Size */}
              <div>
                <label htmlFor="customer-base-size" className="block text-sm font-medium">
                  Customer Base Size
                </label>
                <div className="mt-1">
                  <input
                    id="customer-base-size"
                    name="customerBaseSize"
                    type="number"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 
                    rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary 
                    focus:border-primary sm:text-sm text-gray-900"
                    value={customerBaseSize}
                    onChange={(e) => setCustomerBaseSize(e.target.value)}
                  />
                </div>
              </div>

              {/* Job Types */}
              <div>
                <label htmlFor="job-types" className="block text-sm font-medium">
                  Job Types
                </label>
                <div className="mt-1">
                  <select
                    id="job-types"
                    name="jobTypes"
                    required
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none 
                    focus:ring-primary focus:border-primary sm:text-sm rounded-md text-gray-900"
                    value={jobTypes}
                    onChange={(e) => setJobTypes(e.target.value)}
                  >
                    <option value="">Select Job Types</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent 
                  rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Create Account
                </button>
              </div>
            </form>

            {/* Or register with Google */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-surface text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={loginWithGoogle}
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 
                  rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <img
                    src="/google-icon.svg" // Replace with your Google icon path
                    alt="Google"
                    className="h-5 w-5 mr-2"
                  />
                  Sign up with Google
                </button>
              </div>
            </div>

            {/* Back to Home Link */}
            <div className="mt-6 text-center">
              <Link
                to="/"
                className="text-sm text-primary hover:text-primary-dark"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
