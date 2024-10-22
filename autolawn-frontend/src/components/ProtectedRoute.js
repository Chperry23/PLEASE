import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  const isTrialExpired = user.subscriptionTier === 'Free' && new Date() > new Date(user.trialEndDate);

  if (isTrialExpired) {
    return <Navigate to="/trial-ended" replace />;
  }

  if (!user.subscriptionActive && user.subscriptionTier !== 'Free') {
    return <Navigate to="/pricing" replace />;
  }

  return children;
};

export default ProtectedRoute;