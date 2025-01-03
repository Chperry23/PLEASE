// src/pages/Home.js
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { FaLeaf, FaChartLine, FaUsers, FaClock, FaCalendarAlt } from 'react-icons/fa';

const StatCard = ({ icon, number, text }) => (
  <div className="bg-gradient-to-br from-surface to-gray-800 p-6 rounded-lg text-center border border-gray-700 shadow-lg hover:shadow-xl transition duration-300">
    <div className="text-blue-400">{icon}</div>
    <h3 className="text-2xl font-bold mt-2 text-white">{number}</h3>
    <p className="text-blue-100">{text}</p>
  </div>
);

const TestimonialCard = ({ quote, author, company }) => (
  <div className="bg-gradient-to-br from-surface to-gray-800 p-8 rounded-lg border border-gray-700 shadow-lg hover:shadow-xl transition duration-300">
    <p className="text-blue-100 italic mb-4">"{quote}"</p>
    <p className="font-semibold text-white">{author}</p>
    <p className="text-blue-200">{company}</p>
  </div>
);

const Home = () => {
  return (
    <div className="bg-gradient-to-b from-gray-900 to-background text-text min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-20">
          <div className="relative">
            <div className="absolute inset-0 blur-[100px] bg-gradient-to-r from-blue-500/30 to-purple-500/30 transform rotate-12"></div>
            <h1 className="relative text-5xl font-extrabold sm:text-6xl md:text-7xl mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Welcome to AUTOLAWN
            </h1>
          </div>
          <p className="mt-3 max-w-lg mx-auto text-xl text-blue-100 sm:text-2xl md:mt-5 md:max-w-2xl">
            Transform your lawn care business with powerful management tools
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              to="/pricing"
              className="px-8 py-3 rounded-md bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition duration-200 shadow-lg hover:shadow-blue-500/50"
            >
              Get Started
            </Link>
            <Link
              to="/about"
              className="px-8 py-3 rounded-md bg-white/10 backdrop-blur-sm text-white font-medium hover:bg-white/20 transform hover:scale-105 transition duration-200"
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
          <h2 className="text-3xl font-bold text-center mb-12 text-blue-100">Why Choose AutoLawn?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-surface to-gray-800 p-8 rounded-lg transform hover:scale-105 transition duration-200 border border-gray-700 shadow-lg hover:shadow-xl">
              <div className="text-blue-400 text-3xl mb-4">
                <FaCalendarAlt />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">Smart Scheduling</h3>
              <p className="text-blue-100">Efficiently manage your lawn care appointments with our intelligent scheduling system.</p>
            </div>
            <div className="bg-gradient-to-br from-surface to-gray-800 p-8 rounded-lg transform hover:scale-105 transition duration-200 border border-gray-700 shadow-lg hover:shadow-xl">
              <div className="text-blue-400 text-3xl mb-4">
                <FaChartLine />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">Route Optimization</h3>
              <p className="text-blue-100">Save time and fuel with optimized route planning for your daily service runs.</p>
            </div>
            <div className="bg-gradient-to-br from-surface to-gray-800 p-8 rounded-lg transform hover:scale-105 transition duration-200 border border-gray-700 shadow-lg hover:shadow-xl">
              <div className="text-blue-400 text-3xl mb-4">
                <FaUsers />
              </div>
              <h3 className="text-xl font-semibold mb-4 text-white">Customer Management</h3>
              <p className="text-blue-100">Keep all your customer information organized and accessible in one place.</p>
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
