import React from 'react';
import Navbar from '../components/Navbar';
import { FaCalendarAlt, FaUsers, FaRoute, FaChartBar, FaMobileAlt, FaClipboardList } from 'react-icons/fa';

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-surface p-6 rounded-lg shadow-md">
    <div className="text-primary text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const Features = () => {
  const features = [
    {
      icon: <FaCalendarAlt />,
      title: "Smart Scheduling",
      description: "Efficiently manage your lawn care appointments with our intelligent scheduling system."
    },
    {
      icon: <FaUsers />,
      title: "Customer Management",
      description: "Keep track of all your customers, their properties, and service history in one place."
    },
    {
      icon: <FaRoute />,
      title: "Route Optimization",
      description: "Save time and fuel with optimized route planning for your daily service runs."
    },
    {
      icon: <FaChartBar />,
      title: "Business Analytics",
      description: "Gain insights into your business performance with detailed reports and analytics."
    },
    {
      icon: <FaMobileAlt />,
      title: "Mobile App",
      description: "Access your business on-the-go with our user-friendly mobile application."
    },
    {
      icon: <FaClipboardList />,
      title: "Job Tracking",
      description: "Keep tabs on all your jobs, from creation to completion, ensuring nothing falls through the cracks."
    }
  ];

  return (
    <div className="bg-background text-text min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-center mb-12">AUTOLAWN Features</h1>
        <p className="text-xl text-center mb-12">
          Discover how AUTOLAWN can revolutionize your lawn care business with these powerful features:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold mb-4">Ready to grow your lawn care business?</h2>
          <a 
            href="/pricing" 
            className="bg-primary text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-opacity-90 transition duration-300"
          >
            View Pricing
          </a>
        </div>
      </main>
    </div>
  );
};

export default Features;