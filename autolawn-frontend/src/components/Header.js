// src/components/Header.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

const Header = () => {
  const { user, logout } = useAuth();
  const [activeDropdown, setActiveDropdown] = useState(null);

  const toggleDropdown = (dropdownName) => {
    if (activeDropdown === dropdownName) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(dropdownName);
    }
  };

  return (
    <nav className="bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="font-bold text-xl text-white">AUTOLAWN</Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="text-white px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link>

            {/* Jobs Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('jobs')}
                className="text-white px-3 py-2 rounded-md text-sm font-medium focus:outline-none flex items-center space-x-1"
              >
                <span>Jobs</span>
                {activeDropdown === 'jobs' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
              </button>
              {activeDropdown === 'jobs' && (
                <div className="absolute mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                  <Link to="/jobs" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Create Job</Link>
                  <Link to="/manage-jobs" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Manage Jobs</Link>
                </div>
              )}
            </div>

            {/* Customers Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('customers')}
                className="text-white px-3 py-2 rounded-md text-sm font-medium focus:outline-none flex items-center space-x-1"
              >
                <span>Customers</span>
                {activeDropdown === 'customers' ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </button>
              {activeDropdown === 'customers' && (
                <div className="absolute mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                  <Link
                    to="/customers"
                    className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                  >
                    Create Customer
                  </Link>
                  <Link
                    to="/manage-customers"
                    className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                  >
                    Manage Customers
                  </Link>
                  <Link
                    to="/send-notifications"
                    className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                  >
                    Send Notifications
                  </Link>
                </div>
              )}
            </div>

            {/* Routes Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('routes')}
                className="text-white px-3 py-2 rounded-md text-sm font-medium focus:outline-none flex items-center space-x-1"
              >
                <span>Routes</span>
                {activeDropdown === 'routes' ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </button>
              {activeDropdown === 'routes' && (
                <div className="absolute mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                  <Link to="/build-routes" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Route Builder</Link>
                  <Link to="/route-map" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Route Map</Link>
                  <Link to="/calendar" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Calendar</Link> {/* Added Calendar Link */}
                </div>
              )}
            </div>

            {/* Employees Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('employees')}
                className="text-white px-3 py-2 rounded-md text-sm font-medium focus:outline-none flex items-center space-x-1"
              >
                <span>Employees</span>
                {activeDropdown === 'employees' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
              </button>
              {activeDropdown === 'employees' && (
                <div className="absolute mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                  <Link to="/add-employee" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Create Employee</Link>
                  <Link to="/manage-employees" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Create Crew</Link>
                  <Link to="/route-assignments" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Route Assignments</Link>
                </div>
              )}
            </div>

            {/* Tools Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('tools')}
                className="text-white px-3 py-2 rounded-md text-sm font-medium focus:outline-none flex items-center space-x-1">
                <span>Tools</span>
                {activeDropdown === 'tools' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
              </button>
              {activeDropdown === 'tools' && (
                <div className="absolute mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                  <Link to="/quote-builder" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Quote Builder</Link>
                  <Link to="/generate-report" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Generate Report</Link>
                </div>
              )}
            </div>

            {/* Profile */}
            <Link to="/profile" className="text-white px-3 py-2 rounded-md text-sm font-medium">Profile</Link>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="ml-4 bg-rose-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
