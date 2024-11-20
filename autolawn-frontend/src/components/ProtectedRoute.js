import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ 
  children, 
  requireSubscription = true
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Authentication check
  if (!user) {
    return <Navigate 
      to="/signin" 
      state={{ 
        from: location,
        message: "Please sign in to continue"
      }} 
      replace 
    />;
  }

  // Subscription check
  if (requireSubscription && !user.subscriptionActive) {
    return <Navigate 
      to="/pricing" 
      state={{ 
        from: location,
        message: "A subscription is required to access this feature"
      }} 
      replace 
    />;
  }

  return children;
};

export default ProtectedRoute;
