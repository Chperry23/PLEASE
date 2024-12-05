// src/pages/Calendar.js
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { parse, startOfWeek, getDay, format, addDays } from 'date-fns';
import axiosInstance from '../utils/axiosInstance';
import Header from '../components/Header';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Import date-fns locales
import enUS from 'date-fns/locale/en-US';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [jobsInModal, setJobsInModal] = useState([]);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [confirmationAction, setConfirmationAction] = useState(null);
  const [routeTags, setRouteTags] = useState({});
  const [selectedTag, setSelectedTag] = useState('');

  // Recurrence settings with intervals and buffer days
  const recurrenceSettings = {
    'Weekly': { intervalDays: 7, bufferDays: 4 },
    'Bi-weekly': { intervalDays: 14, bufferDays: 10 },
    'Monthly': { intervalDays: 30, bufferDays: 20 }, // Adjust bufferDays as needed
    // Add other recurrence patterns if any
  };

  // Fetch routes, jobs, and tags from backend
  const fetchEvents = useCallback(async () => {
    try {
      const [routesResponse, jobsResponse, tagsResponse] = await Promise.all([
        axiosInstance.get('/routes'),
        axiosInstance.get('/jobs'),
        axiosInstance.get('/route-tags'),
      ]);

      const routes = routesResponse.data.routes || {};
      const jobs = jobsResponse.data || [];
      const tags = tagsResponse.data || [];

      // Map tags by occurrenceId
      const tagsMap = {};
      tags.forEach((tag) => {
        tagsMap[tag.occurrenceId] = tag.tag;
      });
      setRouteTags(tagsMap);

      // Map jobs by ID for quick access
      const jobMap = {};
      jobs.forEach((job) => {
        jobMap[job._id] = job;
      });

      const events = [];

      // Define the date range (next 3 months)
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0); // Remove time components
      const endDate = addDays(startDate, 90); // 90 days ahead

      // Generate events for each day in the date range
      for (let date = new Date(startDate); date <= endDate; date = addDays(date, 1)) {
        const dayOfWeek = format(date, 'EEEE'); // Get day name, e.g., 'Monday'
        const dayRoutes = routes[dayOfWeek] || [];

        dayRoutes.forEach((route) => {
          // Collect all jobs in the route
          let jobsInRoute = route.jobs || [];

          // Map job IDs to job details
          jobsInRoute = jobsInRoute
            .map((jobEntry) => {
              const jobId = jobEntry._id || jobEntry;
              return jobMap[jobId];
            })
            .filter(Boolean); // Filter out undefined jobs

          // Filter jobsInRoute to only include jobs that are due on this date
          jobsInRoute = jobsInRoute.filter((job) => isJobDueOnDate(job, date));

          // If there are any jobs due on this date in the route, create an event
          if (jobsInRoute.length > 0) {
            const event = generateRouteEvent(route, date, jobsInRoute);
            events.push(event);
          }
        });
      }

      setEvents(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events. Please try again.');
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Function to determine if a job is due on a specific date
  const isJobDueOnDate = (job, date) => {
    const jobDueDate = getJobNextDueDate(job);

    if (!jobDueDate) {
      console.log(`Job ${job._id} has no next due date.`);
      return false;
    }

    // Remove time components from dates
    const jobDueDateString = format(jobDueDate, 'yyyy-MM-dd');
    const dateString = format(date, 'yyyy-MM-dd');

    // Job is due if the due date is on or before the current date
    const isDue = jobDueDateString <= dateString;
    // console.log(
    //   `Job ${job._id} due date: ${jobDueDateString}, current date: ${dateString}, isDue: ${isDue}`
    // );

    return isDue;
  };

  // Function to get the next due date of a job
  const getJobNextDueDate = (job) => {
    if (!job.isRecurring) {
      // For one-time jobs, return the scheduledDate if it's in the future
      const scheduledDate = job.scheduledDate ? new Date(job.scheduledDate) : null;
      if (scheduledDate) {
        scheduledDate.setHours(0, 0, 0, 0); // Remove time components
        return scheduledDate;
      }
      return null;
    }

    const recurrenceSetting = recurrenceSettings[job.recurrencePattern];
    if (!recurrenceSetting) return null; // Unknown recurrence pattern

    const { intervalDays } = recurrenceSetting;

    let lastServiceDate = job.lastServiceDate ? new Date(job.lastServiceDate) : null;
    if (lastServiceDate) {
      lastServiceDate.setHours(0, 0, 0, 0); // Remove time components
    } else {
      // If no last service date, use the job's start date or a default date
      lastServiceDate = job.startDate ? new Date(job.startDate) : new Date('2023-01-01');
      lastServiceDate.setHours(0, 0, 0, 0);
    }

    const nextDueDate = addDays(lastServiceDate, intervalDays);
    nextDueDate.setHours(0, 0, 0, 0); // Ensure time components are zeroed
    return nextDueDate;
  };

  // Function to determine if a job is overdue as of a specific date
  const isJobDue = (job, onDate = new Date()) => {
    if (!job.isRecurring) return false;

    onDate.setHours(0, 0, 0, 0); // Remove time components
    const lastServiceDate = job.lastServiceDate ? new Date(job.lastServiceDate) : null;
    if (!lastServiceDate) return true; // If no last service date, it's due

    lastServiceDate.setHours(0, 0, 0, 0); // Remove time components

    const recurrenceSetting = recurrenceSettings[job.recurrencePattern];
    if (!recurrenceSetting) return false; // Unknown recurrence pattern

    const { intervalDays } = recurrenceSetting;

    const daysSinceLastService = Math.floor((onDate - lastServiceDate) / (1000 * 60 * 60 * 24));

    return daysSinceLastService >= intervalDays;
  };

  // Function to generate an event for a route
  const generateRouteEvent = (route, eventDate, jobsInRoute) => {
    // Set default start and end times (7 AM to 5 PM)
    const start = new Date(eventDate);
    start.setHours(7, 0, 0, 0); // 7 AM

    const end = new Date(eventDate);
    end.setHours(17, 0, 0, 0); // 5 PM

    // Determine if any job in the route is overdue as of the event date
    const isOverdue = jobsInRoute.some((job) => isJobDue(job, eventDate));

    const routeId = route._id;
    const occurrenceId = `${routeId}_${format(eventDate, 'yyyyMMdd')}`; // Unique ID for the occurrence
    const tag = routeTags[occurrenceId];

    // Create a symbol or tag based on assigned tag
    let tagSymbol = '';
    switch (tag) {
      case 'Weekly':
        tagSymbol = ' [W]';
        break;
      case 'Bi-weekly':
        tagSymbol = ' [B]';
        break;
      case 'Monthly':
        tagSymbol = ' [M]';
        break;
      case 'One-time':
        tagSymbol = ' [O]';
        break;
      case 'Other':
        tagSymbol = ' [OT]';
        break;
      default:
        tagSymbol = '';
    }

    return {
      title: `${route.name || 'Unnamed Route'}${tagSymbol}`,
      start,
      end,
      allDay: false,
      isOverdue,
      occurrenceId, // Add occurrenceId to identify this event uniquely
      resource: {
        route,
        jobs: jobsInRoute.map((job) => ({
          ...job,
          isDue: isJobDueOnDate(job, eventDate),
          isOverdue: isJobDue(job, eventDate),
        })),
      },
    };
  };

  // Function to calculate days since last service
  const calculateDaysSinceLastService = (lastServiceDate) => {
    if (!lastServiceDate) return 'No service yet';

    const lastService = new Date(lastServiceDate);
    const today = new Date();
    const timeDiff = today - lastService;
    const daysSinceLastService = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    return `${daysSinceLastService} day${daysSinceLastService !== 1 ? 's' : ''} ago`;
  };

  // Handle event selection (e.g., open modal with route and job details)
  const onSelectEvent = (event) => {
    setSelectedEvent(event);
    setJobsInModal(event.resource.jobs || []);
    setCurrentJobIndex(0);

    // Set the selectedTag to the current tag of the occurrence
    const occurrenceId = event.occurrenceId;
    setSelectedTag(routeTags[occurrenceId] || '');
  };

  // Function to mark job as completed with confirmation if not due
  const markAsCompleted = async () => {
    const currentJob = jobsInModal[currentJobIndex];

    if (!currentJob.isDue) {
      setConfirmationMessage(
        'This job is not due yet. Are you sure you want to mark it as completed?'
      );
      setConfirmationAction(() => async () => {
        await completeJob(currentJob);
        setShowConfirmationDialog(false);
      });
      setShowConfirmationDialog(true);
      return;
    }

    await completeJob(currentJob);
  };

  const completeJob = async (job) => {
    try {
      await axiosInstance.post(`/jobs/${job._id}/complete`);
      // Refresh events
      fetchEvents();
      // Update job status in modal
      const updatedJobs = [...jobsInModal];
      const index = updatedJobs.findIndex((j) => j._id === job._id);
      if (index !== -1) {
        updatedJobs[index].status = 'Completed';
        setJobsInModal(updatedJobs);
      }
    } catch (error) {
      console.error('Error marking job as completed:', error);
      setError('Failed to mark job as completed. Please try again.');
    }
  };

  const markAllAsCompleted = async () => {
    const notDueJobs = jobsInModal.filter((job) => !job.isDue);

    if (notDueJobs.length > 0) {
      setConfirmationMessage(
        'Some jobs are not due yet. Are you sure you want to mark all jobs as completed?'
      );
      setConfirmationAction(() => async () => {
        await completeAllJobs();
        setShowConfirmationDialog(false);
      });
      setShowConfirmationDialog(true);
      return;
    }

    await completeAllJobs();
  };

  const completeAllJobs = async () => {
    try {
      const jobIds = jobsInModal.map((job) => job._id);
      await axiosInstance.post('/jobs/complete-multiple', { jobIds });
      // Refresh events
      fetchEvents();
      // Update job statuses in modal
      const updatedJobs = jobsInModal.map((job) => ({ ...job, status: 'Completed' }));
      setJobsInModal(updatedJobs);
    } catch (error) {
      console.error('Error marking all jobs as completed:', error);
      setError('Failed to mark all jobs as completed. Please try again.');
    }
  };

  const previousJob = () => {
    setCurrentJobIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };
const nextJob = () => {
    setCurrentJobIndex((prevIndex) => Math.min(prevIndex + 1, jobsInModal.length - 1));
  };

  // Handle event drop (rescheduling)
  const handleEventDrop = ({ event, start, end, allDay }) => {
    // Prompt for confirmation
    setConfirmationMessage(
      `Are you sure you want to reschedule "${event.title}" to ${format(
        start,
        'PPP'
      )}?`
    );
    setConfirmationAction(() => async () => {
      await rescheduleRoute(event, start);
      setShowConfirmationDialog(false);
    });
    setShowConfirmationDialog(true);
  };

  const rescheduleRoute = async (event, newDate) => {
    try {
      // Update the route's scheduled day
      const routeId = event.resource.route._id;
      const updatedDayOfWeek = format(newDate, 'EEEE'); // Get the day name

      await axiosInstance.put(`/routes/${routeId}/reschedule`, {
        dayOfWeek: updatedDayOfWeek,
      });

      // Refresh events
      fetchEvents();

      // Remove any tags associated with the old occurrence
      const oldOccurrenceId = event.occurrenceId;
      setRouteTags((prevTags) => {
        const newTags = { ...prevTags };
        delete newTags[oldOccurrenceId];
        return newTags;
      });
    } catch (error) {
      console.error('Error rescheduling route:', error);
      setError('Failed to reschedule route. Please try again.');
    }
  };

  // Event styling based on assigned tags
  const eventPropGetter = (event) => {
    let backgroundColor = '#3174ad'; // Default color

    // Get the tag for the event occurrence from state
    const occurrenceId = event.occurrenceId;
    const tag = routeTags[occurrenceId];

    // Assign colors based on tags
    if (tag) {
      switch (tag) {
        case 'Weekly':
          backgroundColor = '#007bff'; // Blue
          break;
        case 'Bi-weekly':
          backgroundColor = '#ffc107'; // Yellow
          break;
        case 'Monthly':
          backgroundColor = '#28a745'; // Green
          break;
        case 'One-time':
          backgroundColor = '#6c757d'; // Gray
          break;
        case 'Other':
          backgroundColor = '#17a2b8'; // Teal
          break;
        default:
          backgroundColor = '#3174ad'; // Default color
      }
    }

    // If the route has overdue jobs, override the color to red
    if (event.isOverdue) {
      backgroundColor = '#dc3545'; // Red
    }

    return { style: { backgroundColor } };
  };

  // Function to update the route's tag
  const updateRouteTag = (newTag) => {
    const occurrenceId = selectedEvent.occurrenceId; // Use occurrenceId

    // Update the tag in state
    setRouteTags((prevTags) => ({
      ...prevTags,
      [occurrenceId]: newTag,
    }));

    // Save the tag to the database
    saveTagToDatabase(occurrenceId, newTag);

    // Optionally, update the event in the events array to reflect the new tag
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.occurrenceId === occurrenceId ? { ...event, tag: newTag } : event
      )
    );
  };

  // Function to save tag to the database
  const saveTagToDatabase = async (occurrenceId, tag) => {
    try {
      await axiosInstance.post('/route-tags', {
        occurrenceId,
        tag,
      });
      console.log('Tag saved to database');
    } catch (error) {
      console.error('Error saving tag to database:', error);
      setError('Failed to save tag. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />

      <main className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-4">Calendar</h1>

        {error && <div className="bg-red-500 text-white p-4 rounded-lg mb-4">{error}</div>}

        <div className="bg-white text-black rounded-lg p-4">
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            defaultDate={new Date()}
            style={{ height: 600 }}
            onSelectEvent={onSelectEvent}
            eventPropGetter={eventPropGetter}
            draggableAccessor={() => true}
            resizable
            onEventDrop={handleEventDrop}
          />
        </div>

        {/* Legend */}
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Legend</h2>
          <ul className="list-none">
            <li>
              <span className="inline-block w-4 h-4 bg-blue-500 mr-2"></span> Weekly [W]
            </li>
            <li>
              <span className="inline-block w-4 h-4 bg-yellow-500 mr-2"></span> Bi-weekly [B]
            </li>
            <li>
              <span className="inline-block w-4 h-4 bg-green-500 mr-2"></span> Monthly [M]
            </li>
            <li>
              <span className="inline-block w-4 h-4 bg-gray-500 mr-2"></span> One-time [O]
            </li>
            <li>
              <span className="inline-block w-4 h-4 bg-teal-500 mr-2"></span> Other [OT]
            </li>
            <li>
              <span className="inline-block w-4 h-4 bg-red-500 mr-2"></span> Overdue
            </li>
          </ul>
        </div>

        {/* Modal for Route and Job Details */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg text-black shadow-lg max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4">{selectedEvent.title}</h3>

              {jobsInModal.length > 0 ? (
                <>
                  {/* Display current job details */}
                  <p>
                    <strong>
                      Job {currentJobIndex + 1} of {jobsInModal.length}
                    </strong>
                  </p>
                  <p>
                    <strong>Customer:</strong>{' '}
                    {jobsInModal[currentJobIndex].customer?.name || 'No Customer'}
                  </p>
                  <p>
                    <strong>Address:</strong>{' '}
                    {jobsInModal[currentJobIndex].location?.address || 'No Address'}
                  </p>
                  <p>
                    <strong>Revenue:</strong> $
                    {jobsInModal[currentJobIndex].price || 'No Price'}
                  </p>
                  <p>
                    <strong>Type:</strong>{' '}
                    {jobsInModal[currentJobIndex].isRecurring
                      ? jobsInModal[currentJobIndex].recurrencePattern
                      : 'One-time'}
                  </p>
                  <p>
                    <strong>Last Service Date:</strong>{' '}
                    {jobsInModal[currentJobIndex].lastServiceDate
                      ? new Date(
                          jobsInModal[currentJobIndex].lastServiceDate
                        ).toLocaleDateString()
                      : 'N/A'}
                  </p>
                  <p>
                    <strong>Days Since Last Service:</strong>{' '}
                    {calculateDaysSinceLastService(
                      jobsInModal[currentJobIndex].lastServiceDate
                    )}
                  </p>
                  <p>
                    <strong>Status:</strong>{' '}
                    {jobsInModal[currentJobIndex].isDue ? 'Due for Service' : 'Not Due Yet'}
                  </p>

                  {jobsInModal[currentJobIndex].isOverdue && (
                    <p className="text-red-600 font-bold mt-2">This job is overdue!</p>
                  )}

                  {/* Action buttons */}
                  <div className="mt-6 flex justify-end space-x-2">
                    <button
                      onClick={markAsCompleted}
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                    >
                      Mark as Completed
                    </button>
                    <button
                      onClick={markAllAsCompleted}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      Mark All as Completed
                    </button>
                    <button
                      onClick={previousJob}
                      disabled={currentJobIndex === 0}
                      className={`px-4 py-2 text-white rounded-md hover:bg-gray-600 ${
                        currentJobIndex === 0
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gray-500'
                      }`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={nextJob}
                      disabled={currentJobIndex === jobsInModal.length - 1}
                      className={`px-4 py-2 text-white rounded-md hover:bg-gray-600 ${
                        currentJobIndex === jobsInModal.length - 1
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gray-500'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <p>No jobs due on this date in this route.</p>
              )}

              {/* Tag Selection */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Assign Tag:</label>
                <select
                  value={selectedTag}
                  onChange={(e) => {
                    const newTag = e.target.value;
                    setSelectedTag(newTag);
                    updateRouteTag(newTag);
                  }}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">Select a tag</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Bi-weekly">Bi-weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="One-time">One-time</option>
                  <option value="Other">Other</option>
                </select>
                {/* Removed the "Update Tag" button */}
              </div>

              {/* Always display the Close button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirmationDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg text-black shadow-lg max-w-md w-full">
              <p>{confirmationMessage}</p>
              <div className="mt-6 flex justify-end space-x-2">
                <button
                  onClick={() => {
                    confirmationAction();
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowConfirmationDialog(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CalendarPage;
