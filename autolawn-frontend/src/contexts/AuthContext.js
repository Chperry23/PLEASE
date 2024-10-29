import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from '../utils/axiosInstance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verify token
  const verifyToken = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      const response = await axios.get('/auth/verify');
      setUser(response.data.user);
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

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
      const response = await axios.post('/auth/login', { email, password });
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
    window.location.href = 'https://autolawn.app/api/auth/google';
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
      const response = await axios.put('/profile', profileData);
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
      const response = await axios.get('/user');
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('User refresh error:', error);
      throw error;
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    sessionStorage.removeItem('selectedPlan');
  };

  // Subscription related functions
  const checkSubscription = async () => {
    try {
      const response = await axios.get('/subscription/status');
      const { subscriptionActive, subscriptionTier } = response.data;
      setUser(prev => ({ ...prev, subscriptionActive, subscriptionTier }));
      return response.data;
    } catch (error) {
      console.error('Subscription check error:', error);
      throw error;
    }
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
    checkSubscription
  };

return (
    <AuthContext.Provider
      value={{
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
        checkSubscription
      }}
    >
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
