import React from 'react';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import {
  FaCalendarAlt, FaUsers, FaRoute, FaChartBar, 
  FaMobileAlt, FaClipboardList, FaClock, FaTools,
  FaBell, FaFileInvoiceDollar, FaMapMarkedAlt, FaUsersCog
} from 'react-icons/fa';

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-gradient-to-br from-surface to-gray-800 p-8 rounded-lg transform hover:scale-105 transition duration-200 hover:shadow-xl border border-gray-700 group">
    <div className="text-blue-400 text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">{icon}</div>
    <h3 className="text-xl font-semibold mb-3 text-white">{title}</h3>
    <p className="text-blue-100">{description}</p>
  </div>
);

const Features = () => {
  const features = [
    {
      icon: <FaCalendarAlt />,
      title: "Smart Scheduling",
      description: "AI-powered scheduling system that optimizes your team's time and maximizes efficiency."
    },
    {
      icon: <FaUsers />,
      title: "Customer Management",
      description: "Comprehensive CRM to manage customer relationships, properties, and service history."
    },
    {
      icon: <FaRoute />,
      title: "Route Optimization",
      description: "Intelligent routing algorithm that saves time and reduces fuel costs by up to 30%."
    },
    {
      icon: <FaChartBar />,
      title: "Business Analytics",
      description: "Real-time insights and reporting to make data-driven decisions for your business."
    },
    {
      icon: <FaMobileAlt />,
      title: "Mobile App",
      description: "Powerful mobile application for managing your business from anywhere, anytime."
    },
    {
      icon: <FaClipboardList />,
      title: "Job Tracking",
      description: "Real-time job status updates and progress tracking for enhanced accountability."
    },
    {
      icon: <FaClock />,
      title: "Time Management",
      description: "Track employee hours and job duration for better resource allocation."
    },
    {
      icon: <FaTools />,
      title: "Equipment Management",
      description: "Keep track of your equipment maintenance and inventory efficiently."
    },
    {
      icon: <FaBell />,
      title: "Smart Notifications",
      description: "Automated alerts for schedule changes, weather updates, and important reminders."
    },
    {
      icon: <FaFileInvoiceDollar />,
      title: "Invoicing & Payments",
      description: "Streamlined billing process with automated invoicing and online payment options."
    },
    {
      icon: <FaMapMarkedAlt />,
      title: "GPS Integration",
      description: "Real-time tracking and navigation for your service teams in the field."
    },
    {
      icon: <FaUsersCog />,
      title: "Team Management",
      description: "Efficiently manage your crew assignments and track performance metrics."
    }
  ];

  return (
    <div className="bg-gradient-to-b from-gray-900 to-background text-text min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section with gradient overlay */}
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 blur-[100px] bg-gradient-to-r from-blue-500/30 to-purple-500/30 transform -rotate-12"></div>
          <h1 className="relative text-5xl font-bold mb-6">
            Powerful Features for Your
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400"> Lawn Care Business</span>
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto relative">
            Discover how AUTOLAWN's comprehensive suite of tools can help you streamline operations, 
            increase efficiency, and grow your business.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>

        {/* Integration Section with new styling */}
        <div className="bg-gradient-to-br from-surface to-gray-800 rounded-lg p-8 text-center mb-16 border border-gray-700 shadow-lg">
          <h2 className="text-3xl font-bold mb-4 text-white">Seamless Integrations</h2>
          <p className="text-blue-100 mb-6">
            AUTOLAWN works with your favorite business tools to create a smooth workflow.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-lg text-blue-200 hover:bg-white/20 transition duration-200">Google Calendar</div>
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-lg text-blue-200 hover:bg-white/20 transition duration-200">QuickBooks</div>
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-lg text-blue-200 hover:bg-white/20 transition duration-200">Stripe</div>
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-lg text-blue-200 hover:bg-white/20 transition duration-200">Square</div>
          </div>
        </div>

        {/* CTA Section with enhanced gradient */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-12 shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm"></div>
          <div className="relative">
            <h2 className="text-3xl font-bold mb-6 text-white">Ready to Transform Your Business?</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto text-blue-100">
              Join thousands of lawn care professionals who are growing their business with AUTOLAWN.
            </p>
            <div className="flex justify-center gap-4">
              <Link 
                to="/pricing" 
                className="bg-white text-blue-600 px-8 py-3 rounded-md font-semibold hover:bg-blue-50 transition duration-200 shadow-lg"
              >
                View Pricing
              </Link>
              <Link 
                to="/contact" 
                className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-md font-semibold hover:bg-white/10 transition duration-200"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Features;