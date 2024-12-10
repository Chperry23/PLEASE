// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Home from './pages/Home';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import Contact from './pages/Contact';
import About from './pages/About';
import PublicProfile from './pages/PublicProfile';

// Auth Pages
import SignIn from './components/SignIn';
import Register from './components/Register';
import OAuthSuccess from './pages/OAuthSuccess';
import LoginSuccess from './components/LoginSuccess';
import PaymentSuccess from './pages/PaymentSuccess';

// Protected Pages
import Dashboard from './components/Dashboard';
import Jobs from './pages/Jobs';
import Customers from './pages/Customers';
import ManageJobs from './pages/ManageJobs';
import ManageCustomers from './pages/ManageCustomers';
import Profile from './pages/Profile';
import ManageEmployees from './pages/ManageEmployees';
import Employee from './pages/Employee';
import QuoteBuilder from './components/QuoteBuilder'; // Updated import
import BuildRoutes from './pages/BuildRoutes';
import RouteAssignments from './pages/RouteAssignments';
import RouteMap from './pages/RouteMap';
import SendNotifications from './pages/SendNotifications';
import MaterialCalculator from './pages/MaterialCalculator'; // Adjust path as needed

// **Import the Calendar Page**
import CalendarPage from './pages/Calendar'; // Adjust the path if necessary

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes - No auth required */}
            <Route path="/" element={<Home />} />
            <Route path="/features" element={<Features />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/public-profile" element={<PublicProfile />} />

            {/* Auth Routes */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/register" element={<Register />} />
            <Route path="/oauth-success" element={<OAuthSuccess />} />
            <Route path="/login-success" element={<LoginSuccess />} />
            
            {/* Routes that require auth but not subscription */}
            <Route path="/pricing" element={
              <ProtectedRoute requireSubscription={false}>
                <Pricing />
              </ProtectedRoute>
            } />
            
            <Route path="/payment-success" element={
              <ProtectedRoute requireSubscription={false}>
                <PaymentSuccess />
              </ProtectedRoute>
            } />

            {/* Protected Routes - Require auth and subscription */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/material-calculator" element={
	      <ProtectedRoute>
   	        <MaterialCalculator />
 	      </ProtectedRoute>
	    } />

            {/* Route Management */}
            <Route path="/route-assignments" element={
              <ProtectedRoute>
                <RouteAssignments />
              </ProtectedRoute>
            } />
            <Route path="/build-routes" element={
              <ProtectedRoute>
                <BuildRoutes />
              </ProtectedRoute>
            } />
            <Route path="/route-map" element={
              <ProtectedRoute>
                <RouteMap />
              </ProtectedRoute>
            } />

            {/* **Add the Calendar Route** */}
            <Route path="/calendar" element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            } />

            {/* Job Management */}
            <Route path="/jobs" element={
              <ProtectedRoute>
                <Jobs />
              </ProtectedRoute>
            } />
            <Route path="/manage-jobs" element={
              <ProtectedRoute>
                <ManageJobs />
              </ProtectedRoute>
            } />
            <Route path="/quote-builder" element={
              <ProtectedRoute>
                <QuoteBuilder />
              </ProtectedRoute>
            } />

            {/* Customer Management */}
            <Route path="/customers" element={
              <ProtectedRoute>
                <Customers />
              </ProtectedRoute>
            } />
            <Route path="/manage-customers" element={
              <ProtectedRoute>
                <ManageCustomers />
              </ProtectedRoute>
            } />

            {/* Employee Management */}
            <Route path="/manage-employees" element={
              <ProtectedRoute>
                <ManageEmployees />
              </ProtectedRoute>
            } />
            <Route path="/add-employee" element={
              <ProtectedRoute>
                <Employee />
              </ProtectedRoute>
            } />

            {/* User & Notifications */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/send-notifications" element={
              <ProtectedRoute>
                <SendNotifications />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
