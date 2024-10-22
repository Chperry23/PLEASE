// src/components/Register.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Alert from './Alert';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Added plan state
  const [plan, setPlan] = useState('');
  const [password, setPassword] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    // Check if the plan is passed via state or query params
    const statePlan = location.state?.plan;
    const queryParams = new URLSearchParams(location.search);
    const queryPlan = queryParams.get('plan');

    const selectedPlan = statePlan || queryPlan;

    if (selectedPlan) {
      setPlan(selectedPlan);
    } else {
      // No plan selected, redirect to pricing page
      navigate('/pricing');
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(`Name: ${name}, Type: ${typeof name}`);
    console.log(`Email: ${email}, Type: ${typeof email}`);
    console.log(`Password: ${password}, Type: ${typeof password}`);
    console.log(`Plan: ${plan}`);
    try {
      // Pass the plan to the register function
      await register(name, email, password, plan);
      navigate('/dashboard');
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to register. Please check your details.' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-text">Create your account</h2>
          {plan && (
            <p className="mt-2 text-center text-sm text-gray-600">
              Selected Plan: <strong>{plan}</strong>
            </p>
          )}
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/" className="font-medium text-primary hover:text-primary-dark">
              go back to Home
            </Link>
          </p>
        </div>
        {alert && <Alert type={alert.type} message={alert.message} />}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Form fields */}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Name"
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
