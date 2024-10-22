// src/pages/Home.js
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Home = () => {
  return (
    <div className="bg-background text-text min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold sm:text-5xl md:text-6xl">
            Welcome to <span className="text-primary">AUTOLAWN</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base sm:text-lg md:mt-5 md:text-xl">
            Streamline your lawn care business with our easy-to-use management app.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link
                to="/pricing"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-opacity-90 md:py-4 md:text-lg md:px-10"
              >
                Get Started
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link
                to="/about"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
        
        <div className="mt-16">
          <h2 className="text-3xl font-extrabold text-center">Key Features</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div className="bg-surface p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Job Management</h3>
              <p>Easily create, track, and manage lawn care jobs.</p>
            </div>
            <div className="bg-surface p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Customer Management</h3>
              <p>Keep all your customer information organized in one place.</p>
            </div>
            <div className="bg-surface p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">Scheduling</h3>
              <p>Efficiently schedule and assign jobs to your crew.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
