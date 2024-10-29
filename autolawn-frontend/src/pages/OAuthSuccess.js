import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const OAuthSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleOAuthSuccess } = useAuth();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        
        if (!token) {
          console.error('No token received');
          navigate('/signin');
          return;
        }

        await handleOAuthSuccess(token);
        navigate('/dashboard');
      } catch (error) {
        console.error('Authentication error:', error);
        navigate('/signin');
      }
    };

    handleAuth();
  }, [location, handleOAuthSuccess, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center text-white">
        <h2 className="text-xl font-semibold mb-2">Processing Login</h2>
        <p>Please wait while we complete your authentication...</p>
      </div>
    </div>
  );
};

export default OAuthSuccess;
