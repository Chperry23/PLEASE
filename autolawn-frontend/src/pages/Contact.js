import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { FaPhone, FaEnvelope, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const ContactCard = ({ icon, title, content }) => (
  <div className="bg-gradient-to-br from-surface to-gray-800 p-6 rounded-lg flex items-start space-x-4 transform hover:scale-105 transition duration-200 border border-gray-700 shadow-lg hover:shadow-xl">
    <div className="text-blue-400 text-2xl">{icon}</div>
    <div>
      <h3 className="font-semibold mb-2 text-white">{title}</h3>
      <p className="text-blue-100">{content}</p>
    </div>
  </div>
);

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    // Add your form submission logic here
    setTimeout(() => {
      setStatus('sent');
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-gradient-to-b from-gray-900 to-background text-text min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 blur-[100px] bg-gradient-to-r from-blue-500/30 to-purple-500/30 transform rotate-12"></div>
          <h1 className="relative text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Get in Touch
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto relative">
            Have questions about AUTOLAWN? We're here to help! Reach out to our team 
            and we'll get back to you as soon as possible.
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <ContactCard
            icon={<FaPhone />}
            title="Phone"
            content="(555) 123-4567"
          />
          <ContactCard
            icon={<FaEnvelope />}
            title="Email"
            content="support@autolawn.com"
          />
          <ContactCard
            icon={<FaClock />}
            title="Hours"
            content="Mon-Fri: 9AM - 5PM EST"
          />
          <ContactCard
            icon={<FaMapMarkerAlt />}
            title="Location"
            content="Atlanta, GA"
          />
        </div>

        {/* Contact Form */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-surface to-gray-800 rounded-lg p-8 border border-gray-700 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-white">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-100">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-3 rounded-md bg-white/10 border border-gray-600 focus:border-blue-400 focus:ring focus:ring-blue-400/50 text-white placeholder-gray-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-100">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-3 rounded-md bg-white/10 border border-gray-600 focus:border-blue-400 focus:ring focus:ring-blue-400/50 text-white placeholder-gray-400"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-blue-100">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full p-3 rounded-md bg-white/10 border border-gray-600 focus:border-blue-400 focus:ring focus:ring-blue-400/50 text-white placeholder-gray-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-blue-100">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="6"
                  className="w-full p-3 rounded-md bg-white/10 border border-gray-600 focus:border-blue-400 focus:ring focus:ring-blue-400/50 text-white placeholder-gray-400"
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-md font-medium hover:from-blue-600 hover:to-blue-700 transition duration-200 shadow-lg hover:shadow-blue-500/50"
                disabled={status === 'sending'}
              >
                {status === 'sending' ? 'Sending...' : 
                 status === 'sent' ? 'Message Sent!' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-gray-300 mb-4">
            Can't find what you're looking for? Check out our
            <Link to="/faq" className="text-primary hover:text-opacity-80 ml-1">
              FAQ page
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default Contact;