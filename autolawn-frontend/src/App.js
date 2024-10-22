// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import SignIn from './components/SignIn';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Features from './pages/Features';
import Pricing from './pages/Pricing';
import Contact from './pages/Contact';
import ProtectedRoute from './components/ProtectedRoute';
import Jobs from './pages/Jobs';
import Customers from './pages/Customers';
import ManageJobs from './pages/ManageJobs';
import LoginSuccess from './components/LoginSuccess';
import ManageCustomers from './pages/ManageCustomers';
import Profile from './pages/Profile';
import ManageEmployees from './pages/ManageEmployees';
import Employee from './pages/Employee';
import QuoteTool from './components/QuoteTool';
import BuildRoutes from './pages/BuildRoutes';
import RouteAssignments from './pages/RouteAssignments';
import RouteMap from './pages/RouteMap';
import SendNotifications from './pages/SendNotifications';
import TrialEnded from './pages/TrialEnded';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/register" element={<Register />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login-success" element={<LoginSuccess />} />
            <Route path="/trial-ended" element={<TrialEnded />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/route-assignments"
              element={
                <ProtectedRoute>
                  <RouteAssignments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs"
              element={
                <ProtectedRoute>
                  <Jobs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <Customers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage-jobs"
              element={
                <ProtectedRoute>
                  <ManageJobs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage-customers"
              element={
                <ProtectedRoute>
                  <ManageCustomers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage-employees"
              element={
                <ProtectedRoute>
                  <ManageEmployees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-employee"
              element={
                <ProtectedRoute>
                  <Employee />
                </ProtectedRoute>
              }
            />
            <Route
              path="/send-notifications"
              element={
                <ProtectedRoute>
                  <SendNotifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quote-tool"
              element={
                <ProtectedRoute>
                  <QuoteTool />
                </ProtectedRoute>
              }
            />
            <Route
              path="/build-routes"
              element={
                <ProtectedRoute>
                  <BuildRoutes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/route-map"
              element={
                <ProtectedRoute>
                  <RouteMap />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
