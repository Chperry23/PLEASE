import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../components/utils';
import Header from '../components/Header';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  UserIcon,
  UsersIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';

const RouteAssignments = () => {
  const [routes, setRoutes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRoutes, setExpandedRoutes] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [routesResponse, jobsResponse, employeesResponse, crewsResponse] = await Promise.all([
          fetchWithAuth('/routes'),
          fetchWithAuth('/jobs'),
          fetchWithAuth('/employees'),
          fetchWithAuth('/crews'),
        ]);

        const fetchedRoutes = routesResponse.routes || {};
        const fetchedJobs = jobsResponse || [];
        const fetchedEmployees = employeesResponse || [];
        const fetchedCrews = crewsResponse || [];

        // Log the fetched data
        console.log('Fetched Routes:', fetchedRoutes);
        console.log('Fetched Jobs:', fetchedJobs);
        console.log('Fetched Employees:', fetchedEmployees);
        console.log('Fetched Crews:', fetchedCrews);

        // Process the data to include job details and assignments
        processRoutesData(fetchedRoutes, fetchedJobs, fetchedEmployees, fetchedCrews);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const processRoutesData = (fetchedRoutes, fetchedJobs, fetchedEmployees, fetchedCrews) => {
    // Create lookup maps
    const jobMap = {};
    fetchedJobs.forEach(job => {
      jobMap[job._id] = job;
    });
  
    const employeeMap = {};
    fetchedEmployees.forEach(employee => {
      employeeMap[employee._id] = employee;
    });
  
    const crewMap = {};
    fetchedCrews.forEach(crew => {
      crewMap[crew._id] = crew;
    });
  
    // Process routes
    const processedRoutes = {};
  
    for (const [day, dayRoutes] of Object.entries(fetchedRoutes)) {
      processedRoutes[day] = dayRoutes.map(route => {
        // Flatten jobs if they are grouped
        let fullJobs = [];
        if (Array.isArray(route.jobs)) {
          fullJobs = route.jobs.map(job => (typeof job === 'string' ? jobMap[job] : job)).filter(job => job);
        } else if (typeof route.jobs === 'object' && route.jobs !== null) {
          const jobGroups = Object.values(route.jobs).flat();
          fullJobs = jobGroups.map(job => (typeof job === 'string' ? jobMap[job] : job)).filter(job => job);
        }
  
        // Get assigned employee or crew
        let assignedEmployee = null;
        let assignedCrew = null;
  
        if (route.employee) {
          if (typeof route.employee === 'string') {
            assignedEmployee = employeeMap[route.employee];
          } else if (typeof route.employee === 'object' && route.employee._id) {
            assignedEmployee = employeeMap[route.employee._id] || route.employee;
          }
        }
  
        if (route.crew) {
          if (typeof route.crew === 'string') {
            assignedCrew = crewMap[route.crew];
          } else if (typeof route.crew === 'object' && route.crew._id) {
            assignedCrew = crewMap[route.crew._id] || route.crew;
          }
        }
  
        return {
          ...route,
          jobs: fullJobs,
          employee: assignedEmployee,
          crew: assignedCrew,
        };
      });
    }
  
    setRoutes(processedRoutes);

    // Log the processed routes
    console.log('Processed Routes:', processedRoutes);
  };

  const toggleRouteExpansion = (day, index) => {
    setExpandedRoutes(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [index]: !prev[day]?.[index]
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-500 text-2xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <Header />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8 text-white">Route Assignments</h1>
        {Object.entries(routes).map(([day, dayRoutes]) => (
          <div key={day} className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-white border-b border-gray-700 pb-2">
              {day}
            </h2>
            {dayRoutes && dayRoutes.length > 0 ? (
              dayRoutes.map((route, index) => (
                <div key={index} className="bg-gray-800 shadow rounded-lg mb-6">
                  {/* Route Header */}
                  <div className="px-4 py-5 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <BriefcaseIcon className="h-6 w-6 text-blue-400 mr-2" />
                        <div className="text-xl font-bold text-blue-400">
                          {route.name || `Route ${index + 1}`}
                        </div>
                      </div>
                      <div className="flex items-center">
                        {route.employee ? (
                          <div className="flex items-center text-green-400">
                            <UserIcon className="h-5 w-5 mr-1" />
                            {route.employee.name}
                          </div>
                        ) : route.crew ? (
                          <div className="flex items-center text-green-400">
                            <UsersIcon className="h-5 w-5 mr-1" />
                            {route.crew.name}
                          </div>
                        ) : (
                          <div className="flex items-center text-red-400">
                            <UserIcon className="h-5 w-5 mr-1" />
                            Unassigned
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm text-gray-300">
                        {route.jobs.length} Job{route.jobs.length !== 1 ? 's' : ''}
                      </p>
                      <button
                        onClick={() => toggleRouteExpansion(day, index)}
                        className="flex items-center text-sm text-blue-400 hover:text-blue-300"
                      >
                        {expandedRoutes[day]?.[index] ? 'Hide Details' : 'Show Details'}
                        {expandedRoutes[day]?.[index] ? (
                          <ChevronUpIcon className="ml-1 h-5 w-5" />
                        ) : (
                          <ChevronDownIcon className="ml-1 h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  {/* Route Details */}
                  {expandedRoutes[day]?.[index] && (
                    <div className="border-t border-gray-700 px-4 py-5 sm:px-6">
                      <h4 className="text-lg font-medium text-white mb-4">Jobs:</h4>
                      <ul>
                        {route.jobs.map((job, jobIndex) => (
                          <li key={jobIndex} className="bg-gray-700 rounded-md p-4 mb-4">
                            <div className="flex items-center justify-between">
                              <p className="text-lg font-semibold text-blue-300">
                                {job.title || 'Untitled Job'}
                              </p>
                              <p className="text-sm text-gray-400">
                                {job.customer?.name || 'No Customer'}
                              </p>
                            </div>
                            <p className="mt-1 text-sm text-gray-300">
                              {job.location?.address || 'No Address'}
                            </p>
                            <div className="mt-2 grid grid-cols-2 gap-4">
                              <p className="text-sm text-gray-300">
                                <span className="font-semibold">Cost:</span> ${job.cost || 'N/A'}
                              </p>
                              <p className="text-sm text-gray-300">
                                <span className="font-semibold">Status:</span> {job.status || 'Unknown'}
                              </p>
                              <p className="text-sm text-gray-300">
                                <span className="font-semibold">Last Service Date:</span>{' '}
                                {job.lastServiceDate
                                  ? new Date(job.lastServiceDate).toLocaleDateString()
                                  : 'N/A'}
                              </p>
                              <p className="text-sm text-gray-300">
                                <span className="font-semibold">Recurrence:</span>{' '}
                                {job.isRecurring ? job.recurrencePattern : 'One-time'}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-400">No routes available for {day}.</p>
            )}
          </div>
        ))}
      </main>
    </div>
  );
};

export default RouteAssignments;