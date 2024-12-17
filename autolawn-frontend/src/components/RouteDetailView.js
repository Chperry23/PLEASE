// src/components/RouteDetailView.js
import React, { useState } from 'react';
import Modal from './Modal';
import { fetchWithAuth } from '../components/utils';

const RouteDetailView = ({ route, date, onClose, onPushRoute, onDataChange }) => {
  const allJobs = Object.values(route.jobs || {}).flat();
  const [expandedJobs, setExpandedJobs] = useState({});
  const [pushOptions, setPushOptions] = useState({ show: false, selectedJob: null });

  const toggleJob = (jobId) => {
    setExpandedJobs(prev => ({ ...prev, [jobId]: !prev[jobId] }));
  };

  const removeJob = async (jobId) => {
    try {
      await fetchWithAuth(`/routes/${route._id}/jobs/${jobId}`, 'DELETE');
      onDataChange();
    } catch (error) {
      console.error('Error removing job:', error);
    }
  };

  const removeRoute = async () => {
    try {
      await fetchWithAuth(`/routes/${route._id}`, 'DELETE');
      onDataChange();
      onClose();
    } catch (error) {
      console.error('Error removing route:', error);
    }
  };

  const handlePush = (interval, unit, type, jobId = null) => {
    onPushRoute(interval, unit, type, jobId);
    setPushOptions({ show: false, selectedJob: null });
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">{route.name || 'Unnamed Route'} - {date.toDateString()}</h2>
      
      <div className="space-y-4">
        {allJobs.length > 0 ? (
          allJobs.map(job => {
            const isExpanded = expandedJobs[job._id];
            const tag = job.isRecurring 
              ? (job.recurrencePattern === 'Weekly' ? '{W}' :
                 job.recurrencePattern === 'Bi-weekly' ? '{BW}' :
                 job.recurrencePattern === 'Monthly' ? '{M}' : '{O}')
              : '{O}';

            return (
              <div key={job._id} className="bg-gray-700 p-4 rounded-lg shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white">{job.customer?.name || 'No Customer'}</span>
                      <span className="text-blue-300 text-sm">{tag}</span>
                      {job.price && <span className="text-green-300">${job.price}</span>}
                    </div>
                    <div className="text-gray-300 text-sm">{job.service}</div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => toggleJob(job._id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                    >
                      {isExpanded ? 'Hide' : 'Details'}
                    </button>
                    <button 
                      onClick={() => setPushOptions({ show: true, selectedJob: job._id })}
                      className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600 text-sm"
                    >
                      Move
                    </button>
                    <button 
                      onClick={() => removeJob(job._id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 pl-4 border-l-2 border-gray-600 space-y-1 text-sm">
                    {job.isRecurring && (
                      <div className="flex justify-between text-blue-200">
                        <span>Recurrence:</span>
                        <span>{job.recurrencePattern}</span>
                      </div>
                    )}
                    {job.lastServiceDate && (
                      <div className="flex justify-between text-yellow-200">
                        <span>Last Service:</span>
                        <span>{new Date(job.lastServiceDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {job.location?.address && (
                      <div className="flex justify-between text-gray-300">
                        <span>Location:</span>
                        <span>{job.location.address}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-300">
                      <span>Status:</span>
                      <span>{job.status}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-gray-400 text-center py-4">No jobs in this route yet.</p>
        )}
      </div>

      <div className="mt-6 border-t border-gray-600 pt-4">
        <h3 className="font-bold mb-3">Route Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-300">Push Route</h4>
            <div className="flex flex-col space-y-2">
              <button 
                onClick={() => setPushOptions({ show: true, selectedJob: null })}
                className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600 text-white text-sm"
              >
                Push Options
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-300">Danger Zone</h4>
            <button
              onClick={removeRoute}
              className="w-full bg-red-500 px-4 py-2 rounded hover:bg-red-600 text-white text-sm"
            >
              Delete Route
            </button>
          </div>
        </div>
      </div>

      {pushOptions.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">
              Push {pushOptions.selectedJob ? "Job" : "Route"}
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Push by One Day</h4>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePush(1, 'day', 'single', pushOptions.selectedJob)}
                    className="flex-1 bg-blue-500 px-4 py-2 rounded hover:bg-blue-600"
                  >
                    This Only
                  </button>
                  <button
                    onClick={() => handlePush(1, 'day', 'future', pushOptions.selectedJob)}
                    className="flex-1 bg-indigo-500 px-4 py-2 rounded hover:bg-indigo-600"
                  >
                    Future Events
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Push by One Week</h4>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePush(7, 'day', 'single', pushOptions.selectedJob)}
                    className="flex-1 bg-blue-500 px-4 py-2 rounded hover:bg-blue-600"
                  >
                    This Only
                  </button>
                  <button
                    onClick={() => handlePush(7, 'day', 'future', pushOptions.selectedJob)}
                    className="flex-1 bg-indigo-500 px-4 py-2 rounded hover:bg-indigo-600"
                  >
                    Future Events
                  </button>
                </div>
              </div>

              <button
                onClick={() => setPushOptions({ show: false, selectedJob: null })}
                className="w-full mt-4 bg-gray-600 px-4 py-2 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default RouteDetailView;
