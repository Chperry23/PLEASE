import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      localStorage.setItem('token', token);
      
      fetch('https://autolawn.app/api/auth/verify', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          console.log('User data:', data);
          // Check for subscription before redirecting
          if (!data.user.subscriptionTier) {
            navigate('/pricing', {
              state: { message: 'Please select a subscription plan to continue.' }
            });
          } else {
            navigate('/dashboard');
          }
        })
        .catch((error) => {
          console.error('Error fetching user data:', error);
          navigate('/signin');
        });
    } else {
      navigate('/signin');
    }
  }, [navigate]);

  return <div>Logging in...</div>;
};

export default LoginSuccess;
