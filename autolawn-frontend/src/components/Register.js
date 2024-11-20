import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Alert from './Alert';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(() => {
    const stored = sessionStorage.getItem('selectedPlan');
    return stored ? JSON.parse(stored) : null;
  });

  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Handle plan selection from navigation state
    if (location.state?.plan) {
      console.log('Setting plan from navigation:', location.state.plan);
      setSelectedPlan(location.state.plan);
      sessionStorage.setItem('selectedPlan', JSON.stringify(location.state.plan));
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setAlert({ type: 'error', message: 'Passwords do not match' });
      return false;
    }
    if (formData.password.length < 6) {
      setAlert({ type: 'error', message: 'Password must be at least 6 characters' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setAlert(null);

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password
      };

      console.log('Submitting registration:', { ...userData, password: '[FILTERED]' });
      const response = await register(userData);
      console.log('Registration successful:', response);

      // Always store the token
      if (response.token) {
        localStorage.setItem('token', response.token);
      }

      if (selectedPlan) {
        const url = new URL(selectedPlan.paymentLink);
        
        // Log payment setup
        console.log('Setting up payment redirect:', {
          userId: response.user._id,
          planName: selectedPlan.name,
          origin: window.location.origin
        });
        
        // Add required parameters
        url.searchParams.append('client_reference_id', response.user._id);
	url.searchParams.append(
  	     'success_url',
  	     `${window.location.origin}/payment-success?client_reference_id=${response.user._id}`
	);
	url.searchParams.append(
 	     'cancel_url',
  	     `${window.location.origin}/pricing`
	);        
        // Store user data for verification
        localStorage.setItem('pendingUserId', response.user._id);
        localStorage.setItem('pendingUserEmail', response.user.email);
        
        console.log('Redirecting to payment:', url.toString());
        window.location.href = url.toString();
      } else {
        console.log('No plan selected, redirecting to pricing');
        navigate('/pricing');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setAlert({
        type: 'error',
        message: error.response?.data?.message || 'Failed to register. Please try again.'
      });
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    if (selectedPlan) {
      sessionStorage.setItem('selectedPlan', JSON.stringify(selectedPlan));
    }
    loginWithGoogle();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold">
            Create your account
            {selectedPlan && (
              <span className="block text-lg font-medium text-gray-600 mt-2">
                Selected Plan: {selectedPlan.name}
              </span>
            )}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/signin" className="font-medium text-primary hover:text-primary-dark">
              sign in to your account
            </Link>
          </p>
        </div>

        {alert && <Alert type={alert.type} message={alert.message} />}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGoogleSignUp}
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <img
                className="h-5 w-5 mr-2"
                src="/google-icon.svg"
                alt=""
              />
              Sign up with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
