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
      localStorage.setItem('token', token);
      setUser(user);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      throw error;
    }
  };

  // Regular login
  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  };

  // Google OAuth login
  const loginWithGoogle = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/google`;
  };

  // Handle OAuth success
  const handleOAuthSuccess = async (token) => {
    try {
      if (!token) {
        throw new Error('No token provided');
      }
      localStorage.setItem('token', token);
      await verifyToken();
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
      const response = await axios.get('/api/user');
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('User refresh error:', error);
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
      const response = await axios.get('/api/auth/verify');
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('token');
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Verify token on mount
  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  // Check subscription status
  const checkSubscription = async () => {
    try {
      const response = await axios.get('/api/subscription/status');
      const { subscriptionActive, subscriptionTier } = response.data;
      setUser(prev => ({ ...prev, subscriptionActive, subscriptionTier }));
      return response.data;
    } catch (error) {
      console.error('Subscription check error:', error);
      throw error;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    sessionStorage.clear();
  };

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
    checkSubscription,
    verifyToken,
    setError
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
