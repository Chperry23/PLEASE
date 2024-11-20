import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from '../utils/axiosInstance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Register new user
  const register = async (userData) => {
    try {
      console.log('Sending registration request:', userData);
      const response = await axios.post('/auth/register', userData);
      console.log('Registration response:', response.data);

      const { token, user } = response.data;

      // Store token and set user
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);

      return {
        ...response.data,
        needsSubscription: !user.subscriptionTier,
      };
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      throw error;
    }
  };

  // Regular login
  const login = async (email, password) => {
    try {
      console.log('Login attempt:', { email });
      const response = await axios.post('/api/auth/login', { email, password });
      console.log('Login response:', response.data);

      const { token, user } = response.data;
      if (!token || !user) {
        throw new Error('Invalid server response');
      }

      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);

      return {
        ...response.data,
        needsSubscription: !user.subscriptionTier,
        needsProfile: !user.phoneNumber || !user.customerBaseSize,
      };
    } catch (error) {
      console.error('Login error:', error.response?.data || error);
      if (error.response?.status === 400) {
        throw new Error('Invalid email or password');
      }
      throw new Error('Unable to sign in. Please try again.');
    }
  };

  // Google OAuth login
  const loginWithGoogle = () => {
    sessionStorage.setItem('redirectPath', window.location.pathname);
    window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/google`;
  };

  // Handle OAuth success
  const handleOAuthSuccess = async (token) => {
    try {
      if (!token) {
        throw new Error('No token provided');
      }
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const userData = await verifyToken();

      const redirectPath = sessionStorage.getItem('redirectPath');
      sessionStorage.removeItem('redirectPath');

      return {
        user: userData,
        redirectPath,
        needsSubscription: !userData.subscriptionTier,
        needsProfile: !userData.phoneNumber || !userData.customerBaseSize,
      };
    } catch (error) {
      console.error('OAuth success handling error:', error);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (profileData) => {
    try {
      const response = await axios.put('/api/profile', profileData);
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get('/api/user');

      if (!response.data) {
        throw new Error('No user data received');
      }

      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('User refresh error:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      throw error;
    }
  };

  // Verify token
  const verifyToken = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return null;
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get('/api/auth/verify');

      if (!response.data?.user) {
        throw new Error('Invalid token response');
      }

      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check access status
  const checkAccess = useCallback(() => ({
    isAuthenticated: !!user,
    hasSubscription: !!user?.subscriptionTier,
    isProfileComplete: !!(user?.phoneNumber && user?.customerBaseSize),
    requiresAction: user
      ? !user.subscriptionTier
        ? 'subscription'
        : !user.phoneNumber
        ? 'profile'
        : null
      : 'auth',
    subscriptionTier: user?.subscriptionTier || null,
    isSubscriptionActive: user?.subscriptionActive || false,
  }), [user]);

  // Check subscription status
  const checkSubscription = async () => {
    try {
      const response = await axios.get('/api/payment/subscription-status');
      const { active, tier } = response.data;

      setUser((prev) => ({
        ...prev,
        subscriptionActive: active,
        subscriptionTier: tier,
      }));

      return response.data;
    } catch (error) {
      console.error('Subscription check error:', error);
      throw error;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    sessionStorage.clear();
  };

  // Verify token on mount
  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  const value = {
    user,
    loading,
    error,
    register,
    login,
    loginWithGoogle,
    handleOAuthSuccess,
    updateUserProfile,
    refreshUser,
    logout,
    checkAccess,
    checkSubscription,
    verifyToken,
    setError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
