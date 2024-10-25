// src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

const Navbar = () => {
  const { user, logout } = useAuth(); // Use the auth context

  return (
    <nav className="bg-surface text-text">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="text-2xl font-bold">AUTOLAWN</Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary hover:text-white">Home</Link>
                <Link to="/features" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary hover:text-white">Features</Link>
                <Link to="/pricing" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary hover:text-white">Pricing</Link>
                <Link to="/contact" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary hover:text-white">Contact</Link>
                <Link to="/about" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-primary hover:text-white">About</Link>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {user ? (
                <>
                  <Link to="/dashboard" className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90">Dashboard</Link>
                  <button onClick={logout} className="ml-3 bg-secondary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/signin" className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90">Sign In</Link>
                  <Link to="/register" className="ml-3 bg-secondary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90">Register</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;