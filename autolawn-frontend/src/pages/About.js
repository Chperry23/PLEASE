import React from 'react';
import Navbar from '../components/Navbar';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-surface rounded-lg shadow-xl overflow-hidden">
            {/* Hero Section */}
            <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-16 sm:px-12 sm:py-24">
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                AutoLawn Pro
              </h1>
              <p className="mt-6 max-w-3xl text-xl text-blue-100">
                Transforming lawn care management with innovative software solutions.
              </p>
            </div>

            {/* Main Content */}
            <div className="px-6 py-12 sm:px-12">
              {/* Mission Section */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
                <p className="text-gray-300 text-lg leading-relaxed">
                  At AutoLawn Pro, we're dedicated to revolutionizing the lawn care industry 
                  by providing powerful, user-friendly software solutions that help businesses 
                  grow, optimize their operations, and deliver exceptional service to their customers.
                </p>
              </section>

              {/* Benefits Section */}
              <section className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-8">Why Choose AutoLawn Pro?</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="flex items-start space-x-4">
                    <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Streamlined Operations</h3>
                      <p className="text-gray-300">
                        Simplify your daily operations with our intuitive route planning, 
                        scheduling, and job management tools.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Customer Satisfaction</h3>
                      <p className="text-gray-300">
                        Keep your customers happy with reliable service scheduling and 
                        efficient communication tools.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Team Management</h3>
                      <p className="text-gray-300">
                        Efficiently manage your crew assignments and track employee performance 
                        in real-time.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Business Growth</h3>
                      <p className="text-gray-300">
                        Scale your lawn care business with powerful analytics and reporting tools.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Contact Section */}
              <section className="bg-gray-800 rounded-lg p-8">
                <h2 className="text-3xl font-bold text-white mb-6">Get In Touch</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Contact Information</h3>
                    <div className="space-y-4 text-gray-300">
                      <p>Email: support@autolawnpro.com</p>
                      <p>Phone: (555) 123-4567</p>
                      <p>Hours: Monday - Friday, 9:00 AM - 5:00 PM EST</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4">Support</h3>
                    <p className="text-gray-300 mb-4">
                      Need help? Our support team is always ready to assist you with any questions 
                      or concerns.
                    </p>
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Contact Support
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default About;
