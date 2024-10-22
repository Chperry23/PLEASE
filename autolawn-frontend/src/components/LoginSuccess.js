// frontend/src/pages/LoginSuccess.js

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      // Store the token (consider security implications)
      localStorage.setItem('token', token);

      // Optionally, verify the token by fetching /api/auth/verify
      fetch('http://localhost:5000/api/auth/verify', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          console.log('User data:', data);
          // Redirect to dashboard or home page
          navigate('/dashboard');
        })
        .catch((error) => {
          console.error('Error fetching user data:', error);
          // Redirect to sign-in page on error
          navigate('/signin');
        });
    } else {
      // No token found, redirect to sign-in
      navigate('/signin');
    }
  }, [navigate]);

  return <div>Logging in...</div>;
};

export default LoginSuccess;
