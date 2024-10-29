import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireSubscription = true }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    // Save the attempted URL for redirecting after login
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (requireSubscription && !user.subscriptionActive) {
    return <Navigate to="/pricing" state={{ from: location }} replace />;
  }

  if (!user.phoneNumber || !user.customerBaseSize) {
    // Skip profile completion for certain routes if needed
    const skipProfileCompletion = ['/complete-profile', '/pricing'].includes(location.pathname);
    if (!skipProfileCompletion) {
      return <Navigate to="/complete-profile" state={{ from: location }} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
