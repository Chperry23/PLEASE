import React from 'react';
import Header from '../components/Header';

const Calendar = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-white mb-6">Calendar</h1>
          <div className="bg-surface rounded-lg p-6">
            <p className="text-white">Calendar functionality coming soon!</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Calendar; 