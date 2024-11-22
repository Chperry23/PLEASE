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
    const response = await axios.post('/auth/login', { email, password });
    console.log('Full login response:', response);
    console.log('Response data structure:', {
      hasUser: !!response.data.user,
      hasToken: !!response.data.token,
      fullData: response.data
    });

    // Destructure after logging
    const { user, token } = response.data;

    // Additional debug logging
    console.log('Extracted data:', {
      userExists: !!user,
      tokenExists: !!token,
      userData: user,
    });

    if (!user) {
      throw new Error('User data missing from response');
    }

    if (!token) {
      throw new Error('Authentication token missing from response');
    }

    // Update auth state
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);

    // Log final state
    console.log('Auth state updated:', {
      userSet: !!user,
      tokenSet: !!localStorage.getItem('token'),
      authHeader: !!axios.defaults.headers.common['Authorization']
    });

    return {
      user,
      token,
      needsSubscription: !user.subscriptionTier,
    };
  } catch (error) {
    console.error('Login error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      fullError: error
    });
    
    if (error.response?.status === 400) {
      throw new Error('Invalid email or password');
    }
    
    throw new Error(error.message || 'Unable to sign in. Please try again.');
  }
};

  // Utility function to update token
  const updateToken = useCallback((token) => {
    if (token) {
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  }, []);

  // Google OAuth login
  const loginWithGoogle = () => {
    sessionStorage.setItem('redirectPath', window.location.pathname);
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/google`;
  };


  // Handle OAuth success
  const handleOAuthSuccess = async (token) => {
    try {
      if (!token) {
        throw new Error('No token provided');
      }
      updateToken(token);
      const userData = await verifyToken();

      const redirectPath = sessionStorage.getItem('redirectPath');
      sessionStorage.removeItem('redirectPath');

      return {
        user: userData,
        redirectPath,
        needsSubscription: !userData.subscriptionTier,
      };
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
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get('/user');

      if (!response.data) {
        throw new Error('No user data received');
      }

      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error('User refresh error:', error);
      updateToken(null);
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
      const response = await axios.get('/auth/verify');

      if (!response.data?.user) {
        throw new Error('Invalid token response');
      }

      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('Token verification failed:', error);
      updateToken(null);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [updateToken]);

  // Check access status
  const checkAccess = useCallback(() => ({
    isAuthenticated: !!user,
    hasSubscription: !!user?.subscriptionTier,
    requiresAction: user
      ? !user.subscriptionTier
        ? 'subscription'
        : null
      : 'auth',
    subscriptionTier: user?.subscriptionTier || null,
    isSubscriptionActive: user?.subscriptionActive || false,
  }), [user]);

  // Check subscription status
  const checkSubscription = async () => {
    try {
      const response = await axios.get('/payment/subscription-status');
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
    updateToken(null);
    setUser(null);
    sessionStorage.clear();
  };

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
