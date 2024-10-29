import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';

const BadgesTab = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const response = await axiosInstance.get('/api/profile/badges');
      setBadges(response.data);
    } catch (err) {
      setError('Failed to load badges');
      console.error('Error fetching badges:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-600 bg-opacity-25 border border-red-600 text-red-100 p-4 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6">Your Achievements</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {badges.map((badge) => (
          <div 
            key={badge.id}
            className={`p-6 rounded-lg ${
              badge.achieved 
                ? 'bg-gray-700' 
                : 'bg-gray-800 opacity-50'
            }`}
          >
            <div className="flex items-center justify-center mb-4">
              <span className="text-4xl">{badge.icon}</span>
            </div>
            <h3 className="text-lg font-semibold text-center mb-2">
              {badge.name}
            </h3>
            <p className="text-gray-400 text-center text-sm">
              {badge.description}
            </p>
            {badge.achieved && (
              <div className="mt-4 text-center text-sm text-primary">
                Earned on {new Date(badge.earnedDate).toLocaleDateString()}
              </div>
            )}
            {!badge.achieved && (
              <div className="mt-4 text-center text-sm text-gray-500">
                Progress: {badge.progress}%
              </div>
            )}
          </div>
        ))}
      </div>

      {badges.length === 0 && (
        <div className="text-center text-gray-400">
          <p>No badges available yet. Complete tasks to earn badges!</p>
        </div>
      )}
    </div>
  );
};

export default BadgesTab;
