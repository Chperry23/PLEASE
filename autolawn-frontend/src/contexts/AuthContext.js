import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axiosInstance from '../utils/axiosInstance';

const AuthContext = createContext(null);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('token');
  }, []);

  const updateUserSubscription = async (userId) => {
    try {
      const response = await axiosInstance.get(`${API_URL}/api/user/${userId}/subscription`);
      return response.data;
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      return {
        subscriptionTier: 'Free',
        subscriptionActive: false,
        trialEndDate: new Date().toISOString()
      };
    }
  };
  
  const setSubscriptionTier = async (tier) => {
    try {
      const response = await axiosInstance.post(`${API_URL}/api/user/set-subscription-tier`, { tier });
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('Error setting subscription tier:', error);
      throw error;
    }
  };

  const verifyToken = useCallback(async (token) => {
    try {
      const response = await axiosInstance.get(`${API_URL}/api/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = response.data.user;
      const subscriptionData = await updateUserSubscription(userData._id);
      setUser({ ...userData, ...subscriptionData });
    } catch (error) {
      console.error('Token verification failed', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, [verifyToken]);

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post(`${API_URL}/api/auth/login`, { email, password });
      const { user: userData, token } = response.data;
      const subscriptionData = await updateUserSubscription(userData._id);
      const updatedUser = { ...userData, ...subscriptionData };
      setUser(updatedUser);
      localStorage.setItem('token', token);
      return updatedUser;
    } catch (error) {
      console.error('Login failed', error.response?.data || error.message);
      throw error;
    }
  };

  // Register with name, email, password, and plan
  const register = async (name, email, password, plan) => {
    try {
      const response = await axiosInstance.post(`${API_URL}/api/auth/register`, {
        name,
        email,
        password,
        plan,
      });
      const { user, token } = response.data;
      setUser(user);
      localStorage.setItem('token', token);
      return user;
    } catch (error) {
      console.error('Registration failed', error.response?.data || error.message);
      throw error;
    }
  };

  // Initiate Google OAuth login
  const loginWithGoogle = () => {
    window.location.href = `${API_URL}/api/auth/google`;
  };

  // Handle login success by storing token and verifying it
  const handleLoginSuccess = useCallback(async (token) => {
    localStorage.setItem('token', token);
    await verifyToken(token);
  }, [verifyToken]);

  return (
    <AuthContext.Provider
      value={{ user, login, loginWithGoogle, handleLoginSuccess, register, logout, loading, setUser,updateUserSubscription,
        setSubscriptionTier }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

