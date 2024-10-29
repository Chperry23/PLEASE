import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Alert from './Alert';

const Register = () => {
  // State variables
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  
  // Get stored plan from session storage if coming from pricing
  const [selectedPlan, setSelectedPlan] = useState(() => {
    const stored = sessionStorage.getItem('selectedPlan');
    return stored ? JSON.parse(stored) : null;
  });

  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If plan was passed through navigation state
    if (location.state?.plan) {
      setSelectedPlan(location.state.plan);
    }
  }, [location]);

  const validatePassword = (password) => {
    const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.{8,})/;
    return regex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);

    // Validate passwords match
    if (password !== confirmPassword) {
      setAlert({
        type: 'error',
        message: 'Passwords do not match.'
      });
      setLoading(false);
      return;
    }

    // Validate password strength
    if (!validatePassword(password)) {
      setAlert({
        type: 'error',
        message: 'Password must be at least 8 characters, include an uppercase letter and a special character.'
      });
      setLoading(false);
      return;
    }

    try {
      // Register the user
      const response = await register({
        name,
        email,
        password
      });

      // Clear stored plan
      sessionStorage.removeItem('selectedPlan');

      if (selectedPlan) {
        // If there's a selected plan, create payment session
        const url = new URL(selectedPlan.paymentLink);
        url.searchParams.append('client_reference_id', response.user.id);
        url.searchParams.append('success_url', `${window.location.origin}/payment-success`);
        url.searchParams.append('cancel_url', `${window.location.origin}/pricing`);
        
        // Redirect to payment
        window.location.href = url.toString();
      } else {
        // If no plan selected, redirect to pricing
        navigate('/pricing');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setAlert({
        type: 'error',
        message: error.response?.data?.error || 'Failed to register. Please try again.'
      });
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    // Store selected plan before redirecting to Google OAuth
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
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">Confirm Password</label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
