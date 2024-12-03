import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { CheckIcon } from '@heroicons/react/24/solid';
import {
  API_BASE_URL,
  DAYS_OF_WEEK,
  defaultRoutes,
  validateRoutesStructure,
  fetchWithAuth,
} from '../components/utils';
import Header from '../components/Header';
import debounce from 'lodash/debounce';
import { ClipLoader } from 'react-spinners';

const BuildRoutes = () => {
  const [routes, setRoutes] = useState(defaultRoutes);
  const [jobPool, setJobPool] = useState([]);
  const [selectedDay, setSelectedDay] = useState(DAYS_OF_WEEK[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
   const [successMessage, setSuccessMessage] = useState('');  // New state for success messages
  const [visibleRoutesRange, setVisibleRoutesRange] = useState({ start: 0, end: 3 });
  const [expandedJobs, setExpandedJobs] = useState({});
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [crews, setCrews] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, routeIndex: null });
  const [showRouteNameModal, setShowRouteNameModal] = useState(false);
  const [newRouteName, setNewRouteName] = useState('');
  const [confirmCompleteJobsDialog, setConfirmCompleteJobsDialog] = useState({
    isOpen: false,
    activeJobIds: [],
    inactiveJobIds: [],
  });
  const [expandedRoutes, setExpandedRoutes] = useState({});

  const initializeData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        fetchedRoutesResponse,
        fetchedJobsResponse,
        fetchedEmployeesResponse,
        fetchedCrewsResponse,
      ] = await Promise.all([
        fetchWithAuth('/routes'),
        fetchWithAuth('/jobs'),
        fetchWithAuth('/employees'),
        fetchWithAuth('/crews'),
      ]);
  
      const fetchedRoutes = fetchedRoutesResponse?.routes || defaultRoutes;
      const fetchedJobs = fetchedJobsResponse || [];
      const fetchedEmployees = fetchedEmployeesResponse || [];
      const fetchedCrews = fetchedCrewsResponse || [];
  
      const validatedRoutes = validateRoutesStructure(fetchedRoutes);
  
      // Create a job map for easy lookup
      const jobMap = {};
      fetchedJobs.forEach(job => {
        jobMap[job._id] = job;
      });
  
      // Prepare current date
      const now = new Date();
      const normalizeDate = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const today = normalizeDate(now);
  
      // Function to determine if a job is due for service
      const isJobDue = (job) => {
        // Filter out completed jobs
        if (job.status === 'Completed') {
          return false;
        }
  
        // Jobs without lastServiceDate are due
        if (!job.lastServiceDate) {
          return true;
        }
  
        const lastServiceDate = normalizeDate(new Date(job.lastServiceDate));
        const daysSinceLastService = Math.floor((today - lastServiceDate) / (1000 * 60 * 60 * 24));
  
        // Apply recurrence pattern logic
        if (job.isRecurring) {
          switch (job.recurrencePattern) {
            case 'Weekly':
              return daysSinceLastService >= 7;
            case 'Bi-weekly':
              return daysSinceLastService >= 14;
            case 'Monthly':
              return daysSinceLastService >= 30;
            default:
              return false;
          }
        } else {
          // One-time jobs are due if they haven't been serviced yet
          return true;
        }
      };
  
      // Update jobs in routes with full job data and determine if they are due
      const processedRoutes = Object.fromEntries(
        Object.entries(validatedRoutes).map(([day, dayRoutes]) => [
          day,
          dayRoutes.map(route => {
            // Initialize recurrence groups, including one-time jobs
            const jobs = {
              oneTime: [],
              weekly: [],
              biWeekly: [],
              monthly: [],
            };
  
            route.jobs.forEach(jobEntry => {
              const jobId = typeof jobEntry === 'string' ? jobEntry : jobEntry._id;
              const fullJob = jobMap[jobId];
              if (fullJob) {
                const isDue = isJobDue(fullJob);
                const jobWithStatus = { ...fullJob, isDue };
  
                // Place the job into the correct recurrence group
                if (fullJob.isRecurring) {
                  switch (fullJob.recurrencePattern) {
                    case 'Weekly':
                      jobs.weekly.push(jobWithStatus);
                      break;
                    case 'Bi-weekly':
                      jobs.biWeekly.push(jobWithStatus);
                      break;
                    case 'Monthly':
                      jobs.monthly.push(jobWithStatus);
                      break;
                    default:
                      // Handle other recurrence patterns if necessary
                      break;
                  }
                } else {
                  // One-time jobs go into the oneTime group
                  jobs.oneTime.push(jobWithStatus);
                }
              }
            });
  
            return {
              ...route,
              jobs,
            };
          }),
        ])
      );
  
      // Prepare the job pool by including jobs not in any route
      const jobsInRoutes = new Set(
        Object.values(processedRoutes).flatMap(dayRoutes =>
          dayRoutes.flatMap(route =>
            Object.values(route.jobs).flat().map(job => job._id)
          )
        )
      );
  
      const jobPoolJobs = fetchedJobs
        .filter(job => {
          // Exclude jobs that are already scheduled in routes
          if (jobsInRoutes.has(job._id)) {
            return false;
          }
          // Exclude jobs that are completed
          if (job.status === 'Completed') {
            return false;
          }
          return true; // Include all other jobs
        })
        .map(job => ({
          ...job,
          isDue: isJobDue(job),
        }));
  
      setRoutes(processedRoutes);
      setJobPool(jobPoolJobs);
      setEmployees(fetchedEmployees);
      setCrews(fetchedCrews);
  
      console.log('Initialized data:', {
        routes: processedRoutes,
        jobPool: jobPoolJobs,
        employees: fetchedEmployees,
        crews: fetchedCrews,
      });
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load routes, jobs, employees, and crews. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, []);  
  
  useEffect(() => {
    initializeData();
  }, [initializeData]);

  const saveRoutes = useCallback(async (updatedRoutes = routes) => {
    setSaving(true);
    try {
      const routesToSave = Object.entries(updatedRoutes).reduce((acc, [day, dayRoutes]) => {
        acc[day] = dayRoutes.map(route => ({
          index: route.index,
          name: route.name || '',
          // Flatten the grouped jobs into a single array of job IDs
          jobs: Object.values(route.jobs)
            .flat()
            .map(job => (typeof job === 'string' ? job : job._id)),
          employee: route.employee?._id || null,
          crew: route.crew?._id || null,
        }));
        return acc;
      }, {});
  
      await fetchWithAuth('/routes', 'PUT', { routes: routesToSave });
      console.log('Routes saved successfully:', routesToSave);
    } catch (err) {
      console.error('Error saving routes:', err);
      setError('Failed to save routes. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [routes]);  

  const debouncedSaveRoutes = useCallback(debounce(saveRoutes, 1000), [saveRoutes]);

  const onDragEnd = useCallback((result) => {
    const { source, destination } = result;
  
    if (!destination) {
      return;
    }
  
    const sourceId = source.droppableId.split('-');
    const destId = destination.droppableId.split('-');
  
    const sourceRouteIndex = sourceId[0] === 'route' ? parseInt(sourceId[1], 10) : null;
    const sourcePattern = sourceId[2];
    const destRouteIndex = destId[0] === 'route' ? parseInt(destId[1], 10) : null;
    const destPattern = destId[2];
  
    setRoutes(prevRoutes => {
      const updatedRoutes = { ...prevRoutes };
  
      // Moving from job pool to a route
      if (source.droppableId.startsWith('jobPool') && destRouteIndex !== null) {
        const job = jobPool[source.index];
        if (!job) return updatedRoutes;
  
        // Determine the recurrence pattern of the job
        const pattern = !job.isRecurring
          ? 'oneTime'
          : job.recurrencePattern === 'Weekly' ? 'weekly'
          : job.recurrencePattern === 'Bi-weekly' ? 'biWeekly'
          : job.recurrencePattern === 'Monthly' ? 'monthly'
          : null;
  
        if (!pattern) return updatedRoutes;
  
        // Add job to the destination route's recurrence group
        updatedRoutes[selectedDay][destRouteIndex].jobs[pattern].splice(destination.index, 0, job);
  
        // Remove from job pool
        const updatedJobPool = [...jobPool];
        updatedJobPool.splice(source.index, 1);
        setJobPool(updatedJobPool);
      }
  
      // Moving within a route or between routes
      if (sourceRouteIndex !== null && destRouteIndex !== null) {
        const sourceJobs = updatedRoutes[selectedDay][sourceRouteIndex].jobs[sourcePattern];
        const destJobs = updatedRoutes[selectedDay][destRouteIndex].jobs[destPattern];
  
        const [movedJob] = sourceJobs.splice(source.index, 1);
        destJobs.splice(destination.index, 0, movedJob);
      }
  
      return updatedRoutes;
    });
  
    debouncedSaveRoutes();
  }, [jobPool, selectedDay, debouncedSaveRoutes]);  

  const addNewRoute = useCallback(async (routeName) => {
    if (!routeName) {
      // If no name is provided, assign a default name
      routeName = `Route ${routes[selectedDay].length + 1}`;
    }
    const newRoute = {
      index: routes[selectedDay].length,
      name: routeName,
      jobs: {
        oneTime: [],
        weekly: [],
        biWeekly: [],
        monthly: [],
      },
      employee: null,
      crew: null,
    };
  
    const newRouteState = {
      ...routes,
      [selectedDay]: [...routes[selectedDay], newRoute],
    };
    setRoutes(newRouteState);
    await saveRoutes(newRouteState);
  }, [routes, selectedDay, saveRoutes]);
  

  const toggleRouteExpansion = (routeIndex) => {
    setExpandedRoutes((prevState) => ({
      ...prevState,
      [routeIndex]: !prevState[routeIndex],
    }));
  };

  const deleteRoute = useCallback(async (routeIndex) => {
    try {
      setRoutes(prevRoutes => {
        const updatedRoutes = { ...prevRoutes };
        const deletedRoute = updatedRoutes[selectedDay].splice(routeIndex, 1)[0];
  
        // Collect all incomplete jobs from the deleted route's job groups
        const incompleteJobs = Object.values(deletedRoute.jobs)
          .flat()
          .filter(job => job.status !== 'Completed');
  
        setJobPool(prevJobPool => [...prevJobPool, ...incompleteJobs]);
  
        updatedRoutes[selectedDay] = updatedRoutes[selectedDay].map((route, idx) => ({
          ...route,
          index: idx,
        }));
  
        return updatedRoutes;
      });
  
      await fetchWithAuth(`/routes/${selectedDay}/${routeIndex}`, 'DELETE');
  
      await saveRoutes(); // Ensure routes are saved to keep consistent state
    } catch (error) {
      console.error('Error deleting route:', error);
      setError('Failed to delete route. Please try again.');
    }
  }, [selectedDay, saveRoutes]);  

  const removeJobFromRoute = (routeIndex, pattern, jobIndex) => {
    setRoutes(prevRoutes => {
      const updatedRoutes = { ...prevRoutes };
      const route = updatedRoutes[selectedDay][routeIndex];
  
      // Remove the job from the correct job group
      const removedJob = route.jobs[pattern].splice(jobIndex, 1)[0];
  
      // Add the removed job back to the job pool only if it's not completed
      if (removedJob.status !== 'Completed') {
        setJobPool(prevJobPool => [...prevJobPool, removedJob]);
      }
  
      return updatedRoutes;
    });
  
    debouncedSaveRoutes();
  };
  
  

  const [assigningRoutes, setAssigningRoutes] = useState({});
  const assignRoute = async (routeIndex, assigneeId) => {
    const [type, id] = assigneeId.split('-');
    setAssigningRoutes(prev => ({ ...prev, [routeIndex]: true }));
  
    try {
      console.log(`Assigning ${type} with ID: ${id} to route ${routeIndex} for day ${selectedDay}`);
      
      // Sending the appropriate payload to the API
      const response = await fetchWithAuth(`/routes/${selectedDay}/${routeIndex}/assign`, 'PUT', {
        [type]: id,
      });
  
      // Since fetchWithAuth returns parsed data directly, no need to check response.ok or status
      console.log('Response from server:', response);
  
      // Ensure the response contains the expected fields, otherwise consider it an error
      if (!response || !response._id) {
        throw new Error('Invalid response format');
      }
  
      // Assuming the response is valid and contains the updated route
      const updatedRoute = response; // Use the response directly since fetchWithAuth returns the data
      setRoutes((prevRoutes) => {
        const updatedDayRoutes = prevRoutes[selectedDay].map((route) => {
          if (route.index === routeIndex) {
            return {
              ...route,
              employee: type === 'employee' ? { _id: id, name: employees.find(e => e._id === id)?.name } : null,
              crew: type === 'crew' ? { _id: id, name: crews.find(c => c._id === id)?.name } : null,
            };
          }
          return route;
        });
  
        return {
          ...prevRoutes,
          [selectedDay]: updatedDayRoutes,
        };
      });
      console.log(`Route assigned successfully: day ${selectedDay}, index ${routeIndex}, ${type}: ${id}`);
    } catch (error) {
      console.error('Error assigning route:', error);
      setError('Failed to assign route. Please try again.');
    } finally {
      setAssigningRoutes(prev => ({ ...prev, [routeIndex]: false }));
    }
  };
  
  const handleJobSelection = (job) => {
    setSelectedJobs(prevSelectedJobs => {
      if (prevSelectedJobs.includes(job._id)) {
        return prevSelectedJobs.filter(id => id !== job._id);
      } else {
        return [...prevSelectedJobs, job._id];
      }
    });
  };

  const toggleJobExpansion = (jobId) => {
    setExpandedJobs((prev) => ({ ...prev, [jobId]: !prev[jobId] }));
  };

  const changeSelectedDay = (direction) => {
    setSelectedDay((prevDay) => {
      const currentIndex = DAYS_OF_WEEK.indexOf(prevDay);
      const newIndex = (currentIndex + direction + DAYS_OF_WEEK.length) % DAYS_OF_WEEK.length;
      return DAYS_OF_WEEK[newIndex];
    });
    setVisibleRoutesRange({ start: 0, end: 3 });
  };

  const cycleVisibleRoutes = (direction) => {
    setVisibleRoutesRange((prevRange) => {
      const totalRoutes = routes[selectedDay].length;
      const newStart = (prevRange.start + direction + totalRoutes) % totalRoutes;
      const newEnd = Math.min(newStart + 3, totalRoutes);
      return { start: newStart, end: newEnd };
    });
  };

  const renderLegend = () => (
    <div className="mt-2 p-2 bg-gray-800 rounded-lg text-white">
      <h3 className="font-bold mb-2">Job Legend</h3>
      <ul className="space-y-1">
        <li className="flex items-center">
          <span className="w-4 h-4 inline-block bg-green-600 mr-2" /> One-time job
        </li>
        <li className="flex items-center">
          <span className="w-4 h-4 inline-block bg-blue-600 mr-2" /> Weekly recurring job
        </li>
        <li className="flex items-center">
          <span className="w-4 h-4 inline-block bg-teal-600 mr-2" /> Bi-weekly recurring job
        </li>
        <li className="flex items-center">
          <span className="w-4 h-4 inline-block bg-purple-600 mr-2" /> Monthly recurring job
        </li>
        <li className="flex items-center">
          <span className="w-4 h-4 inline-block bg-gray-600 mr-2" /> Other recurring job
        </li>
        <li className="flex items-center">
          <span className="w-4 h-4 inline-block bg-white opacity-100 mr-2 border" /> Due for service
        </li>
        <li className="flex items-center">
          <span className="w-4 h-4 inline-block bg-white opacity-50 mr-2 border" /> Not due yet
        </li>
      </ul>
    </div>
  );
  

  const shouldReturnToPool = (job, now) => {
    if (!job.isRecurring) return false;
    
    const normalizeDate = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const lastServiceDate = normalizeDate(new Date(job.lastServiceDate));
    const today = normalizeDate(now);
    
    const daysSinceLastService = Math.floor((today - lastServiceDate) / (1000 * 60 * 60 * 24));
    
    switch (job.recurrencePattern) {
      case 'Weekly':
        return daysSinceLastService >= 7;
      case 'Bi-weekly':
        return daysSinceLastService >= 14;
      case 'Monthly':
        return daysSinceLastService >= 30;
      default:
        return false;
    }
  };
  
  
  // Updated handleCompleteJob function
  const handleCompleteJob = async (jobIds) => {
    // Collect all jobs from jobPool and routes
    const allJobs = [
      ...jobPool,
      ...Object.values(routes).flatMap(dayRoutes =>
        dayRoutes.flatMap(route =>
          Object.values(route.jobs).flat()
        )
      ),
    ];
  
    // Filter the selected jobs
    const selectedJobs = allJobs.filter(job => jobIds.includes(job._id));
  
    // Separate active and inactive jobs
    const activeJobs = selectedJobs.filter(job => job.isDue);
    const inactiveJobs = selectedJobs.filter(job => !job.isDue);
  
    if (inactiveJobs.length > 0) {
      // Open confirmation dialog
      setConfirmCompleteJobsDialog({
        isOpen: true,
        activeJobIds: activeJobs.map(job => job._id),
        inactiveJobIds: inactiveJobs.map(job => job._id),
      });
    } else {
      // Proceed with completing active jobs
      await completeJobs(jobIds);
    }
  };
  
  const completeJobs = async (jobIds) => {
    try {
      await Promise.all(
        jobIds.map(async (jobId) => {
          await fetchWithAuth(`/jobs/${jobId}/complete`, 'POST', {});
        })
      );
  
      // Re-fetch data to update the state
      await initializeData();
  
      setSelectedJobs([]);
      setSuccessMessage("Jobs completed successfully!");
    } catch (error) {
      console.error('Error completing jobs:', error);
      setError(`Failed to complete jobs: ${error.message}`);
    }
  };
  
  
  const renderJobCard = (job, isInRoute = false, routeIndex, pattern, jobIndex) => {
    if (!job) return null;
  
    const isExpanded = expandedJobs[job._id];
    const isSelected = selectedJobs.includes(job._id);
  
    const customerName = job.customer?.name || 'No Customer';
    const jobTitle = job.service || 'No Service';
  
    // Calculate days since last service
    const now = new Date();
    const lastServiceDate = job.lastServiceDate ? new Date(job.lastServiceDate) : null;
    const daysSinceLastService = lastServiceDate
      ? Math.floor((now - lastServiceDate) / (1000 * 60 * 60 * 24))
      : 'N/A';
  
    // Prepare display text for days since last service
    const daysSinceText = daysSinceLastService !== 'N/A'
      ? `${daysSinceLastService} day${daysSinceLastService !== 1 ? 's' : ''} ago`
      : 'No service yet';
  
    // Determine job color based on recurrence pattern
    const jobColors = {
      oneTime: 'bg-green-600 hover:bg-green-700',
      weekly: 'bg-blue-600 hover:bg-blue-700',
      biWeekly: 'bg-teal-600 hover:bg-teal-700',
      monthly: 'bg-purple-600 hover:bg-purple-700',
    };
  
    const baseColor = jobColors[pattern] || 'bg-gray-600 hover:bg-gray-700';
  
    const opacityClass = job.isDue ? 'opacity-100' : 'opacity-50';
  
    const jobStyle = {
      border: isSelected ? '2px solid white' : 'none',
    };
  
    return (
      <div
        className={`p-2 rounded-md shadow-md ${baseColor} ${opacityClass}`}
        style={{ border: jobStyle.border }}
        onClick={() => handleJobSelection(job)}
      >
        <div className="flex justify-between items-center">
          {/* Display customer name and days since last service */}
          <div>
            <p className="font-bold text-white">{customerName}</p>
            <p className="text-sm text-gray-200">{daysSinceText}</p>
          </div>
          <div className="flex items-center space-x-2">
            {isInRoute && (
              <button
                onClick={(e) => { e.stopPropagation(); removeJobFromRoute(routeIndex, pattern, jobIndex); }}
                className="text-red-500 hover:text-red-700"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); toggleJobExpansion(job._id); }}>
              {isExpanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {isExpanded && (
          <div className="mt-2">
            <p className="text-gray-300">{jobTitle}</p>
            <p className="text-gray-400">{job.location?.address || 'No Address'}</p>
            <p className="text-gray-400">Revenue: ${job.price || 'No Price'}</p>
            <p className="text-gray-400">Type: {job.isRecurring ? job.recurrencePattern : 'One-time'}</p>
            <p className="text-gray-400">Last Service Date: {lastServiceDate ? lastServiceDate.toLocaleDateString() : 'N/A'}</p>
            <p className="text-gray-400">Days Since Last Service: {daysSinceText}</p>
            <p className="text-gray-400">
              Status: {job.isDue ? 'Due for Service' : 'Not Due Yet'}
            </p>
          </div>
        )}
      </div>
    );
  };  
  
  const handleCompleteRoute = async (routeIndex) => {
    const route = routes[selectedDay][routeIndex];
  
    // Collect all job IDs from the route
    const jobIds = Object.values(route.jobs).flat().map(job => job._id);
  
    if (jobIds.length === 0) {
      setError('No jobs to complete in this route.');
      return;
    }
  
    try {
      await handleCompleteJob(jobIds);
    } catch (error) {
      console.error('Error completing route jobs:', error);
      setError(`Failed to complete route jobs: ${error.message}`);
    }
  };  
  
  const renderDroppableArea = (id, route, isJobPool = false) => {
    const routeIndex = parseInt(id.split('-')[1], 10);
  
    return (
      <div className="bg-gray-800 p-4 rounded-lg">
        {!isJobPool && (
          <div className="mb-4">
            <select
              className="w-full p-2 bg-gray-700 text-white rounded"
              onChange={(e) => assignRoute(routeIndex, e.target.value)}
              value={
                route.employee ? `employee-${route.employee._id}` :
                route.crew ? `crew-${route.crew._id}` :
                ''
              }
              disabled={assigningRoutes[routeIndex]}
            >
              <option value="">Assign to...</option>
              <optgroup label="Employees">
                {employees.map((employee) => (
                  <option key={employee._id} value={`employee-${employee._id}`}>{employee.name}</option>
                ))}
              </optgroup>
              <optgroup label="Crews">
                {crews.map((crew) => (
                  <option key={crew._id} value={`crew-${crew._id}`}>{crew.name}</option>
                ))}
              </optgroup>
            </select>
          </div>
        )}
  
        {/* Render jobs by recurrence pattern, including one-time jobs */}
        {['oneTime', 'weekly', 'biWeekly', 'monthly'].map(pattern => (
          <div key={pattern}>
            <h3 className="text-lg font-semibold text-white capitalize">
              {pattern === 'oneTime' ? 'One-Time Jobs' : pattern.replace('biWeekly', 'Bi-weekly') + ' Jobs'}
            </h3>
            <Droppable droppableId={`${id}-${pattern}`}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-2 mt-2"
                >
                  {route.jobs[pattern].length > 0 ? (
                    route.jobs[pattern].map((job, index) => (
                      <Draggable key={job._id} draggableId={job._id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            {renderJobCard(job, true, routeIndex, pattern, index)}
                          </div>
                        )}
                      </Draggable>
                    ))
                  ) : (
                    <p className="text-gray-400">No {pattern === 'oneTime' ? 'one-time' : pattern.replace('biWeekly', 'bi-weekly')} jobs</p>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    );
  };
  
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white text-xl">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center space-y-4">
        <p className="text-red-500 text-xl">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
        >
          Refresh Page
        </button>
      </div>
    );
  }  

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
  
      <main className="max-w-7xl mx-auto py-8 px-4">
  
        {/* Success and Error Messages */}
        {successMessage && (
          <div className="bg-green-500 text-white p-4 rounded-lg mb-4">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-4">
            {error}
          </div>
        )}
  
        {/* Navigation for selecting days */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => changeSelectedDay(-1)}
            className="p-2 bg-blue-500 rounded-md hover:bg-blue-600 transition"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold">{selectedDay}</h1>
          <button
            onClick={() => changeSelectedDay(1)}
            className="p-2 bg-blue-500 rounded-md hover:bg-blue-600 transition"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </div>
  
        {/* Buttons to cycle routes and add new routes */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => cycleVisibleRoutes(-1)}
            className="p-2 bg-blue-500 rounded-md hover:bg-blue-600 transition"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <button
            onClick={() => setShowRouteNameModal(true)}
            className="px-4 py-2 bg-green-500 rounded-md hover:bg-green-600 transition flex items-center space-x-2">
            <PlusIcon className="w-5 h-5" />
            <span>Add Route</span>
          </button>
          <button
            onClick={() => cycleVisibleRoutes(1)}
            className="p-2 bg-blue-500 rounded-md hover:bg-blue-600 transition"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        </div>
  
        <DragDropContext onDragEnd={onDragEnd}>
          {/* Render Routes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {routes[selectedDay]
              .slice(visibleRoutesRange.start, visibleRoutesRange.end)
              .map((route) => {
                // Calculate total revenue for weekly jobs
                const weeklyJobs = route.jobs['weekly'] || [];
                const totalWeeklyRevenue = weeklyJobs.reduce((sum, job) => {
                  const jobPrice = parseFloat(job.price || 0);
                  return sum + (isNaN(jobPrice) ? 0 : jobPrice);
                }, 0);
  
                // Calculate total revenue for bi-weekly jobs
                const biWeeklyJobs = route.jobs['biWeekly'] || [];
                const totalBiWeeklyRevenue = biWeeklyJobs.reduce((sum, job) => {
                  const jobPrice = parseFloat(job.price || 0);
                  return sum + (isNaN(jobPrice) ? 0 : jobPrice);
                }, 0);
  
                // Total revenue from weekly and bi-weekly jobs
                const totalWeeklyAndBiWeeklyRevenue = totalWeeklyRevenue + totalBiWeeklyRevenue;
  
                // Check if the route is expanded
                const isExpanded = expandedRoutes[route.index];
  
                return (
                  <div key={route.index} className="bg-gray-800 p-4 rounded-lg shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <button
                          onClick={() => toggleRouteExpansion(route.index)}
                          className="text-white mr-2 bg-blue-500 p-2 rounded-md flex items-center hover:bg-blue-600"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUpIcon className="w-6 h-6" />
                              <span className="ml-1">Collapse</span>
                            </>
                          ) : (
                            <>
                              <ChevronDownIcon className="w-6 h-6" />
                              <span className="ml-1">Expand</span>
                            </>
                          )}
                        </button>
                        <h2 className="text-xl font-semibold ml-2">{route.name || `Route ${route.index + 1}`}</h2>
                      </div>
                      <button
                        onClick={() => deleteRoute(route.index)}
                        className="p-2 bg-red-500 rounded-md hover:bg-red-600 transition"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
  
                    {/* Assignment Select Box moved back below the header */}
                    <div className="mb-4">
                      <select
                        className="w-full p-2 bg-gray-700 text-white rounded"
                        onChange={(e) => assignRoute(route.index, e.target.value)}
                        value={
                          route.employee ? `employee-${route.employee._id}` :
                          route.crew ? `crew-${route.crew._id}` :
                          ''
                        }
                        disabled={assigningRoutes[route.index]}
                      >
                        <option value="">Assign to...</option>
                        <optgroup label="Employees">
                          {employees.map((employee) => (
                            <option key={employee._id} value={`employee-${employee._id}`}>{employee.name}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Crews">
                          {crews.map((crew) => (
                            <option key={crew._id} value={`crew-${crew._id}`}>{crew.name}</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
  
                    {/* Render jobs only if the route is expanded */}
                    {isExpanded && (
                      <>
                        {/* Render jobs by recurrence pattern */}
                        {['oneTime', 'weekly', 'biWeekly', 'monthly'].map((pattern) => (
                          <div key={pattern}>
                            <h3 className="text-lg font-semibold text-white capitalize">
                              {pattern === 'oneTime' ? 'One-Time Jobs' : pattern.replace('biWeekly', 'Bi-weekly') + ' Jobs'}
                            </h3>
                            <Droppable droppableId={`route-${route.index}-${pattern}`}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className="space-y-2 mt-2"
                                >
                                  {route.jobs[pattern] && route.jobs[pattern].length > 0 ? (
                                    route.jobs[pattern].map((job, index) => (
                                      <Draggable key={job._id} draggableId={job._id} index={index}>
                                        {(provided) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                          >
                                            {renderJobCard(job, true, route.index, pattern, index)}
                                          </div>
                                        )}
                                      </Draggable>
                                    ))
                                  ) : (
                                    <p className="text-gray-400">
                                      No {pattern === 'oneTime' ? 'one-time' : pattern.replace('biWeekly', 'bi-weekly')} jobs
                                    </p>
                                  )}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </div>
                        ))}
                      </>
                    )}
  
                    {/* Complete Route Button and Revenue at the bottom of each route */}
                    <div className="mt-4 flex justify-between items-center">
                      <div className="text-white">
                        <p>
                          WR: {totalWeeklyRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </p>
                        <p>
                          WBR: {totalWeeklyAndBiWeeklyRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCompleteRoute(route.index)}
                        className="bg-green-500 text-white px-2 py-1 rounded-md hover:bg-green-600 transition"
                      >
                        Complete Route
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
  
          {/* Job Pool */}
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 flex justify-between items-center">
              Job Pool
              {selectedJobs.length > 0 && (
                <div className="flex space-x-4">
                  <button
                    onClick={() => setSelectedJobs([])}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                  >
                    Clear Selection
                  </button>
                  <button
                    onClick={() => handleCompleteJob(selectedJobs)}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
                  >
                    Complete Selected Jobs
                  </button>
                </div>
              )}
            </h2>
            <p className="text-sm text-gray-400 mb-2">
              Click on jobs to select multiple, then drag to a route or complete.
            </p>
  
            {/* Job Color Legend */}
            <div className="mt-2 p-2 bg-gray-800 rounded-lg text-white">
              <h3 className="font-bold mb-2">Job Color Legend</h3>
              <ul className="flex space-x-8">
                <li className="flex items-center">
                  <span className="w-4 h-4 inline-block bg-green-600 mr-2" /> One-time job
                </li>
                <li className="flex items-center">
                  <span className="w-4 h-4 inline-block bg-blue-600 mr-2" /> Weekly job
                </li>
                <li className="flex items-center">
                  <span className="w-4 h-4 inline-block bg-teal-600 mr-2" /> Bi-weekly job
                </li>
                <li className="flex items-center">
                  <span className="w-4 h-4 inline-block bg-purple-600 mr-2" /> Monthly job
                </li>
              </ul>
            </div>
  
            {/* Updated Job Pool Rendering */}
            <Droppable droppableId="jobPool-0">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4"
                >
                  {jobPool.length > 0 ? (
                    jobPool.map((job, index) => (
                      <Draggable key={job._id} draggableId={job._id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            {renderJobCard(job)}
                          </div>
                        )}
                      </Draggable>
                    ))
                  ) : (
                    <p className="text-white text-center">No jobs available</p>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        </DragDropContext>
  
        {saving && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
            <ClipLoader color="#ffffff" loading={saving} size={50} />
            <p className="text-white mt-4">Saving...</p>
          </div>
        )}
  
        {/* Confirmation Dialog for Completing Selected Jobs */}
        {confirmCompleteJobsDialog.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-gray-800 p-6 rounded-lg text-white shadow-lg">
              <h3 className="text-xl font-semibold">Confirm Job Completion</h3>
              <p className="mt-4">
                You have selected {confirmCompleteJobsDialog.inactiveJobIds.length} inactive job(s).
                Are you sure you want to complete them?
              </p>
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={() =>
                    setConfirmCompleteJobsDialog({ isOpen: false, activeJobIds: [], inactiveJobIds: [] })
                  }
                  className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    // Proceed with completing all jobs
                    await completeJobs([
                      ...confirmCompleteJobsDialog.activeJobIds,
                      ...confirmCompleteJobsDialog.inactiveJobIds,
                    ]);
                    setConfirmCompleteJobsDialog({ isOpen: false, activeJobIds: [], inactiveJobIds: [] });
                  }}
                  className="px-4 py-2 bg-green-500 rounded-md hover:bg-green-600"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
  
        {/* Confirmation Dialog for Completing a Route */}
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-gray-800 p-6 rounded-lg text-white shadow-lg">
              <h3 className="text-xl font-semibold">Confirm Route Completion</h3>
              <p className="mt-4">
                Are you sure you want to complete all jobs in this route? This includes inactive jobs.
              </p>
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={() => setConfirmDialog({ isOpen: false, routeIndex: null })}
                  className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await handleCompleteRoute(confirmDialog.routeIndex);
                    setConfirmDialog({ isOpen: false, routeIndex: null }); // Close after confirming
                  }}
                  className="px-4 py-2 bg-green-500 rounded-md hover:bg-green-600"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
  
        {/* Modal for Adding Route Name */}
        {showRouteNameModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-gray-800 p-6 rounded-lg text-white shadow-lg">
              <h3 className="text-xl font-semibold">Create New Route</h3>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Route Name:</label>
                <input
                  type="text"
                  className="w-full p-2 bg-gray-700 text-white rounded"
                  value={newRouteName}
                  onChange={(e) => setNewRouteName(e.target.value)}
                />
              </div>
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowRouteNameModal(false);
                    setNewRouteName('');
                  }}
                  className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    addNewRoute(newRouteName);
                    setShowRouteNameModal(false);
                    setNewRouteName('');
                  }}
                  className="px-4 py-2 bg-green-500 rounded-md hover:bg-green-600"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
  
      </main>
    </div>
  );  
};

export default BuildRoutes;
