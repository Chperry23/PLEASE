// src/pages/Calendar.js
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { useNavigate } from 'react-router-dom';
import { parse, startOfWeek, getDay, format } from 'date-fns';
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
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Fetch routes and jobs from backend
  const fetchEvents = useCallback(async () => {
    try {
      const [routesResponse, jobsResponse] = await Promise.all([
        axiosInstance.get('/routes'),
        axiosInstance.get('/jobs'),
      ]);

      const routes = routesResponse.data.routes || {};
      const jobs = jobsResponse.data || [];

      // Map jobs by ID for quick access
      const jobMap = {};
      jobs.forEach((job) => {
        jobMap[job._id] = job;
      });

      const events = [];

      // Loop over days in routes
      Object.entries(routes).forEach(([dayOfWeek, dayRoutes]) => {
        dayRoutes.forEach((route) => {
          // For each job in the route, create events
          const routeJobs = route.jobs || [];

          routeJobs.forEach((jobEntry) => {
            const jobId = jobEntry._id || jobEntry;
            const job = jobMap[jobId];
            if (job) {
              // Determine the dates when this job should occur
              const jobEvents = generateJobEvents(job, dayOfWeek, route);
              // Add route and route name to the event
              jobEvents.forEach((event) => {
                event.title = `${route.name || 'Unnamed Route'}: ${job.customer?.name || 'No Customer'}`;
                event.resource = { job: { ...job, isDue: event.isOverdue }, route };
              });
              events.push(...jobEvents);
            }
          });
        });
      });

      setEvents(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events. Please try again.');
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Function to determine if a job is due for service
  const isJobDue = (job) => {
    if (!job.isRecurring) return false;

    const now = new Date();
    const lastServiceDate = job.lastServiceDate ? new Date(job.lastServiceDate) : null;
    if (!lastServiceDate) return true; // If no last service date, it's due

    const daysSinceLastService = Math.floor((now - lastServiceDate) / (1000 * 60 * 60 * 24));

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

  // Function to generate events for a job
  const generateJobEvents = (job, dayOfWeek, route) => {
    const events = [];
    const recurrencePattern = job.recurrencePattern;
    const isRecurring = job.isRecurring;

    // Determine the start date based on the day of the week
    const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(dayOfWeek);

    // Start date is the next occurrence of the specified day
    let startDate = getNextDayOfWeek(new Date(), dayIndex);

    // For one-time jobs, create a single event
    if (!isRecurring) {
      const eventDate = new Date(job.scheduledDate || startDate);
      const isDue = isJobDue(job);

      events.push({
        title: job.title || 'No Title',
        start: eventDate,
        end: eventDate,
        allDay: true,
        status: job.status || 'Active',
        isOverdue: isDue,
        resource: { job: { ...job, isDue }, route },
      });
      return events;
    }

    // For recurring jobs, generate events based on the recurrence pattern
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3); // Generate events for the next 3 months

    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const isDue = isJobDue(job);

      events.push({
        title: job.title || 'No Title',
        start: new Date(currentDate),
        end: new Date(currentDate),
        allDay: true,
        status: job.status || 'Active',
        isOverdue: isDue,
        resource: { job: { ...job, isDue }, route },
      });

      // Increment currentDate based on recurrence pattern
      switch (recurrencePattern) {
        case 'Weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'Bi-weekly':
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case 'Monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        default:
          currentDate = new Date(endDate.getTime() + 1); // Exits the loop
          break;
      }
    }

    return events;
  };

  // Function to get the next occurrence of a specific day of the week
  const getNextDayOfWeek = (date, dayOfWeek) => {
    const resultDate = new Date(date.getTime());
    resultDate.setDate(
      date.getDate() + ((7 + dayOfWeek - date.getDay()) % 7)
    );
    return resultDate;
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

  // Handle event selection (e.g., open modal with job and route details)
  const onSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  // Function to mark job as completed
  const markAsCompleted = async () => {
    try {
      await axiosInstance.post(`/jobs/${selectedEvent.resource.job._id}/complete`);
      // Refresh events
      fetchEvents();
      // Close modal
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error marking job as completed:', error);
      setError('Failed to mark job as completed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />

      <main className="max-w-7xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-4">Calendar</h1>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="bg-white text-black rounded-lg p-4">
          <BigCalendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            onSelectEvent={onSelectEvent}
            eventPropGetter={(event) => {
              let backgroundColor = '#3174ad'; // Default color
              if (event.isOverdue) {
                backgroundColor = '#dc3545'; // Red for overdue
              } else {
                backgroundColor = '#28a745'; // Green for on schedule
              }
              return { style: { backgroundColor } };
            }}
          />
        </div>

        {/* Modal for Event Details */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg text-black shadow-lg max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4">{selectedEvent.title}</h3>
              {/* Display job and route details */}
              <p><strong>Customer:</strong> {selectedEvent.resource.job.customer?.name || 'No Customer'}</p>
              <p><strong>Address:</strong> {selectedEvent.resource.job.location?.address || 'No Address'}</p>
              <p><strong>Revenue:</strong> ${selectedEvent.resource.job.price || 'No Price'}</p>
              <p><strong>Type:</strong> {selectedEvent.resource.job.isRecurring ? selectedEvent.resource.job.recurrencePattern : 'One-time'}</p>
              <p><strong>Last Service Date:</strong> {selectedEvent.resource.job.lastServiceDate ? new Date(selectedEvent.resource.job.lastServiceDate).toLocaleDateString() : 'N/A'}</p>
              <p><strong>Days Since Last Service:</strong> {calculateDaysSinceLastService(selectedEvent.resource.job.lastServiceDate)}</p>
              <p><strong>Status:</strong> {selectedEvent.resource.job.isDue ? 'Due for Service' : 'Not Due Yet'}</p>

              {selectedEvent.isOverdue && (
                <p className="text-red-600 font-bold mt-2">This job is overdue!</p>
              )}

              <div className="mt-6 flex justify-end space-x-2">
                <button
                  onClick={markAsCompleted}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  Mark as Completed
                </button>
                <button
                  onClick={() => {
                    navigate(`/jobs/${selectedEvent.resource.job._id}`);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  View Job Details
                </button>
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
      </main>
    </div>
  );
};

export default CalendarPage;
