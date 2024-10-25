// frontend/src/contexts/AuthContext.js

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axiosInstance from '../utils/axiosInstance';
// AuthContext.js

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('token');
  }, []);

  const verifyToken = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/api/auth/verify`);
      const userData = response.data.user;
      setUser(userData);
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
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [verifyToken]);

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post(`/api/auth/login`, { email, password });
      const { user: userData, token } = response.data;
      localStorage.setItem('token', token); // Store token first
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Login failed', error.response?.data || error.message);
      throw error;
    }
  };

  // Register with name, email, password, and plan
  const register = async (userData) => {
    try {
      const response = await axiosInstance.post('/api/auth/register', userData);
      const { user, token } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
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
    await verifyToken();
  }, [verifyToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithGoogle,
        handleLoginSuccess,
        register,
        logout,
        loading,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
