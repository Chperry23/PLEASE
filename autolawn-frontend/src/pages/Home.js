// src/pages/Home.js
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FaLeaf, FaChartLine, FaUsers, FaClock } from 'react-icons/fa';

const StatCard = ({ icon, number, text }) => (
  <div className="bg-surface p-6 rounded-lg text-center">
    {icon}
    <h3 className="text-2xl font-bold mt-2">{number}</h3>
    <p className="text-gray-400">{text}</p>
  </div>
);

const TestimonialCard = ({ quote, author, company }) => (
  <div className="bg-surface p-6 rounded-lg">
    <p className="text-gray-300 italic mb-4">"{quote}"</p>
    <p className="font-semibold">{author}</p>
    <p className="text-gray-400 text-sm">{company}</p>
  </div>
);

const Home = () => {
  return (
    <div className="bg-background text-text min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-20">
          <h1 className="text-5xl font-extrabold sm:text-6xl md:text-7xl mb-8">
            Welcome to <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">AUTOLAWN</span>
          </h1>
          <p className="mt-3 max-w-lg mx-auto text-xl text-gray-300 sm:text-2xl md:mt-5 md:max-w-2xl">
            Transform your lawn care business with powerful management tools
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              to="/pricing"
              className="px-8 py-3 rounded-md bg-primary text-white font-medium hover:bg-opacity-90 transform hover:scale-105 transition duration-200"
            >
              Get Started
            </Link>
            <Link
              to="/about"
              className="px-8 py-3 rounded-md bg-surface text-white font-medium hover:bg-opacity-90 transform hover:scale-105 transition duration-200"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard 
              icon={<FaLeaf className="text-primary text-4xl mx-auto" />}
              number="1000+"
              text="Lawns Managed"
            />
            <StatCard 
              icon={<FaChartLine className="text-primary text-4xl mx-auto" />}
              number="30%"
              text="Average Growth"
            />
            <StatCard 
              icon={<FaUsers className="text-primary text-4xl mx-auto" />}
              number="500+"
              text="Happy Clients"
            />
            <StatCard 
              icon={<FaClock className="text-primary text-4xl mx-auto" />}
              number="5hrs"
              text="Saved Weekly"
            />
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose AutoLawn?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-surface p-8 rounded-lg transform hover:scale-105 transition duration-200">
              <h3 className="text-xl font-semibold mb-4">Smart Scheduling</h3>
              <p className="text-gray-300">Efficiently manage your lawn care appointments with our intelligent scheduling system.</p>
            </div>
            <div className="bg-surface p-8 rounded-lg transform hover:scale-105 transition duration-200">
              <h3 className="text-xl font-semibold mb-4">Route Optimization</h3>
              <p className="text-gray-300">Save time and fuel with optimized route planning for your daily service runs.</p>
            </div>
            <div className="bg-surface p-8 rounded-lg transform hover:scale-105 transition duration-200">
              <h3 className="text-xl font-semibold mb-4">Customer Management</h3>
              <p className="text-gray-300">Keep all your customer information organized and accessible in one place.</p>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="py-16">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard 
              quote="AutoLawn has completely transformed how we manage our lawn care business. The efficiency gains are incredible."
              author="John Smith"
              company="Green Thumb Services"
            />
            <TestimonialCard 
              quote="The route optimization alone has saved us countless hours and significantly reduced our fuel costs."
              author="Sarah Johnson"
              company="Perfect Lawns LLC"
            />
            <TestimonialCard 
              quote="Customer management has never been easier. Our client satisfaction has improved dramatically."
              author="Mike Wilson"
              company="Elite Lawn Care"
            />
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Business?</h2>
          <Link
            to="/pricing"
            className="inline-block px-8 py-3 rounded-md bg-primary text-white font-medium hover:bg-opacity-90 transform hover:scale-105 transition duration-200"
          >
            Start Your Free Trial
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Home;
