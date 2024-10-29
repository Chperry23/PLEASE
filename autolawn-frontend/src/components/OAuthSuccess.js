// frontend/src/pages/OAuthSuccess.js

import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const OAuthSuccess = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { handleLoginSuccess } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const token = params.get('token');
    if (token) {
      handleLoginSuccess(token);
      navigate('/dashboard');
    } else {
      navigate('/signin');
    }
  }, [search, handleLoginSuccess, navigate]);

  return <div>Logging in...</div>;
};

export default OAuthSuccess;
