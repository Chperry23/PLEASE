// src/pages/Calendar.js
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { parse, startOfWeek, getDay, format, addDays, differenceInCalendarDays } from 'date-fns';
import axiosInstance from '../utils/axiosInstance';
import Header from '../components/Header';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import enUS from 'date-fns/locale/en-US';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const recurrenceSettings = {
  'Weekly': { intervalDays: 7, bufferDays: 4 },
  'Bi-weekly': { intervalDays: 14, bufferDays: 10 },
  'Monthly': { intervalDays: 30, bufferDays: 20 },
};

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
  const [currentView, setCurrentView] = useState('month');

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

      const tagsMap = {};
      tags.forEach((t) => {
        tagsMap[t.occurrenceId] = t.tag;
      });
      setRouteTags(tagsMap);

      const jobMap = {};
      jobs.forEach((job) => {
        job.isCompleted = job.status === 'Completed';
        jobMap[job._id] = job;
      });

      const newEvents = [];
      const startDate = addDays(new Date(), -30);
      startDate.setHours(0, 0, 0, 0);
      const endDate = addDays(new Date(), 90);

      for (let date = new Date(startDate); date <= endDate; date = addDays(date, 1)) {
        const dayOfWeek = format(date, 'EEEE');
        const dayRoutes = routes[dayOfWeek] || [];

        dayRoutes.forEach((route, i) => {
          let jobsInRoute = route.jobs || [];
          jobsInRoute = jobsInRoute
            .map((jobEntry) => jobMap[jobEntry._id || jobEntry])
            .filter(Boolean);

          const { overdueCount, dueCount, upcomingCount, completedCount } = classifyJobs(jobsInRoute, date);

          // If date is in the past and no jobs are due or overdue, skip adding the event
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (date < today && overdueCount === 0 && dueCount === 0) {
            return; // Skip this event
          }

          const start = new Date(date);
          start.setHours(7, 0, 0, 0);
          const end = new Date(date);
          end.setHours(17, 0, 0, 0);

          const occurrenceId = `${route._id}_${start.getTime()}_${i}`;
          const tag = tagsMap[occurrenceId];

          newEvents.push({
            title: route.name || 'Unnamed Route',
            start,
            end,
            allDay: false,
            occurrenceId,
            resource: {
              route,
              jobs: jobsInRoute.map((job) => ({
                ...job,
                isDue: isJobDueOnDate(job, date),
                isOverdue: isJobOverdue(job, date),
              })),
              overdueCount,
              dueCount,
              upcomingCount,
              completedCount,
            },
            tag,
          });
        });
      }

      setEvents(newEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events. Please try again.');
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const classifyJobs = (jobs, date) => {
    let overdueCount = 0;
    let dueCount = 0;
    let upcomingCount = 0;
    let completedCount = 0;

    jobs.forEach((job) => {
      const isDue = isJobDueOnDate(job, date);
      const isOverdueJob = isJobOverdue(job, date) && !job.isCompleted;
      if (job.isCompleted) {
        completedCount++;
      } else if (isOverdueJob) {
        overdueCount++;
      } else if (isDue && !isOverdueJob) {
        dueCount++;
      } else {
        upcomingCount++;
      }
    });

    return { overdueCount, dueCount, upcomingCount, completedCount };
  };

  const isJobDueOnDate = (job, date) => {
    const jobDueDate = getJobNextDueDate(job);
    if (!jobDueDate) return false;
    const jobDueDateString = format(jobDueDate, 'yyyy-MM-dd');
    const dateString = format(date, 'yyyy-MM-dd');
    return jobDueDateString <= dateString || (isJobOverdue(job, date) && !job.isCompleted);
  };

  const getJobNextDueDate = (job) => {
    if (!job.isRecurring) {
      const scheduledDate = job.scheduledDate ? new Date(job.scheduledDate) : null;
      if (scheduledDate) {
        scheduledDate.setHours(0, 0, 0, 0);
        return scheduledDate;
      }
      return null;
    }

    const setting = recurrenceSettings[job.recurrencePattern];
    if (!setting) return null;
    const { intervalDays } = setting;

    let lastServiceDate = job.lastServiceDate ? new Date(job.lastServiceDate) : null;
    if (!lastServiceDate) {
      lastServiceDate = job.startDate ? new Date(job.startDate) : new Date('2023-01-01');
    }
    lastServiceDate.setHours(0, 0, 0, 0);

    const nextDueDate = addDays(lastServiceDate, intervalDays);
    nextDueDate.setHours(0, 0, 0, 0);
    return nextDueDate;
  };

  const isJobOverdue = (job, eventDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (eventDate > today) return false;
    if (!job.isRecurring) return false;

    const setting = recurrenceSettings[job.recurrencePattern];
    if (!setting) return false;

    const { intervalDays } = setting;
    const lastServiceDate = job.lastServiceDate ? new Date(job.lastServiceDate) : null;
    if (!lastServiceDate) return true;
    lastServiceDate.setHours(0, 0, 0, 0);
    const daysSinceLast = Math.floor((eventDate - lastServiceDate) / (1000 * 60 * 60 * 24));
    return daysSinceLast >= intervalDays;
  };

  const calculateDaysSinceLastService = (lastServiceDate) => {
    if (!lastServiceDate) return 'No service yet';
    const lastService = new Date(lastServiceDate);
    const today = new Date();
    const diff = today - lastService;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  const onSelectEvent = (event) => {
    setSelectedEvent(event);
    setJobsInModal(event.resource.jobs || []);
    setCurrentJobIndex(0);
    setSelectedTag(routeTags[event.occurrenceId] || '');
  };

  const markAsCompleted = async () => {
    const currentJob = jobsInModal[currentJobIndex];
    if (!currentJob.isDue && !currentJob.isOverdue) {
      setConfirmationMessage('This job is not due yet. Are you sure you want to mark it as completed?');
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
      fetchEvents();
      const updated = [...jobsInModal];
      const idx = updated.findIndex((j) => j._id === job._id);
      if (idx !== -1) {
        updated[idx].status = 'Completed';
        updated[idx].isCompleted = true;
        setJobsInModal(updated);
      }
    } catch (error) {
      console.error('Error marking job as completed:', error);
      setError('Failed to mark job as completed. Please try again.');
    }
  };

  const markAllAsCompleted = async () => {
    const notDueJobs = jobsInModal.filter((job) => !job.isDue && !job.isOverdue);
    if (notDueJobs.length > 0) {
      setConfirmationMessage('Some jobs are not due yet. Are you sure you want to mark all jobs as completed?');
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
      const jobIds = jobsInModal.map((j) => j._id);
      await axiosInstance.post('/jobs/complete-multiple', { jobIds });
      fetchEvents();
      const updated = jobsInModal.map((j) => ({ ...j, status: 'Completed', isCompleted: true }));
      setJobsInModal(updated);
    } catch (error) {
      console.error('Error marking all jobs as completed:', error);
      setError('Failed to mark all jobs as completed. Please try again.');
    }
  };

const previousJob = () => setCurrentJobIndex((i) => Math.max(i - 1, 0));
  const nextJob = () => setCurrentJobIndex((i) => Math.min(i + 1, jobsInModal.length - 1));

  const handleEventDrop = ({ event, start, end, allDay }) => {
    setConfirmationMessage(`Are you sure you want to reschedule "${event.title}" to ${format(start, 'PPP')}?`);
    setConfirmationAction(() => async () => {
      await rescheduleRoute(event, start);
      setShowConfirmationDialog(false);
    });
    setShowConfirmationDialog(true);
  };

  const rescheduleRoute = async (event, newDate) => {
    try {
      const routeId = event.resource.route._id;
      const updatedDayOfWeek = format(newDate, 'EEEE');
      await axiosInstance.put(`/routes/${routeId}/reschedule`, { dayOfWeek: updatedDayOfWeek });
      fetchEvents();
      const oldOccurrenceId = event.occurrenceId;
      setRouteTags((prev) => {
        const newTags = { ...prev };
        delete newTags[oldOccurrenceId];
        return newTags;
      });
    } catch (error) {
      console.error('Error rescheduling route:', error);
      setError('Failed to reschedule route. Please try again.');
    }
  };

  const updateRouteTag = (newTag) => {
    const occurrenceId = selectedEvent.occurrenceId;
    setRouteTags((prev) => ({ ...prev, [occurrenceId]: newTag }));
    saveTagToDatabase(occurrenceId, newTag);
    setEvents((prevEvents) =>
      prevEvents.map((e) => (e.occurrenceId === occurrenceId ? { ...e, tag: newTag } : e))
    );
  };

  const saveTagToDatabase = async (occurrenceId, tag) => {
    try {
      await axiosInstance.post('/route-tags', { occurrenceId, tag });
      console.log('Tag saved to database');
    } catch (error) {
      console.error('Error saving tag to database:', error);
      setError('Failed to save tag. Please try again.');
    }
  };

  const getEarliestNextDueDate = (jobs) => {
    let earliest = null;
    for (const job of jobs) {
      const nd = getJobNextDueDate(job);
      if (nd && (!earliest || nd < earliest)) {
        earliest = nd;
      }
    }
    return earliest;
  };

  const eventPropGetter = (event) => {
    const { overdueCount, dueCount, upcomingCount, completedCount, jobs } = event.resource;
    const tag = event.tag;

    // Determine background color from tag only
    let backgroundColor = '#3174ad'; // default
    switch (tag) {
      case 'Weekly':
        backgroundColor = '#007bff';
        break;
      case 'Bi-weekly':
        backgroundColor = '#ffc107';
        break;
      case 'Monthly':
        backgroundColor = '#28a745';
        break;
      case 'One-time':
        backgroundColor = '#6c757d';
        break;
      case 'Other':
        backgroundColor = '#17a2b8';
        break;
      default:
        // No tag, default is #3174ad
        break;
    }

    // Determine border based on due states
  // Determine border based on due states
  let borderColor = '';
  const allJobs = jobs.length;
  const earliestNextDue = getEarliestNextDueDate(jobs);
  const eventDate = event.start;
  eventDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // All completed
  if (completedCount === allJobs) {
    borderColor = '#28a745'; // green border
  } else if (overdueCount > 0) {
    borderColor = '#dc3545'; // red border
  } else if (earliestNextDue) {
    const diffDays = differenceInCalendarDays(earliestNextDue, eventDate);
    if (diffDays === 0 && dueCount > 0) {
      borderColor = '#fd7e14'; // orange border for due today
    } else if (diffDays > 0 && diffDays <= 2 && upcomingCount > 0) {
      borderColor = '#ffc107'; // yellow border for due soon
    }
  }
    const style = { backgroundColor };
    if (borderColor) {
      style.border = `4px solid ${borderColor}`;
    }

    return { style };
  };

  const CustomEvent = ({ event, currentView }) => {
    const tag = event.tag || '';
    let tagSymbol = '';
    // Tag symbol always black
    switch (tag) {
      case 'Weekly':
        tagSymbol = '[W]';
        break;
      case 'Bi-weekly':
        tagSymbol = '[B]';
        break;
      case 'Monthly':
        tagSymbol = '[M]';
        break;
      case 'One-time':
        tagSymbol = '[O]';
        break;
      case 'Other':
        tagSymbol = '[OT]';
        break;
      default:
        tagSymbol = '';
    }

    const { overdueCount, dueCount, upcomingCount, completedCount } = event.resource;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isOverdue = overdueCount > 0 && event.start <= today;

    let display;
    if (currentView === 'month') {
      display = (
        <span>
          {tagSymbol && <span style={{ color: '#000', marginRight: 4 }}>{tagSymbol}</span>}
          {event.title}
        </span>
      );
    } else if (currentView === 'week') {
      display = (
        <span>
          {tagSymbol && <span style={{ color: '#000', marginRight: 4 }}>{tagSymbol}</span>}
          {event.title}{' - '}
          {dueCount} due, {overdueCount} overdue, {upcomingCount} upcoming
          {isOverdue && <span style={{ color: '#dc3545', marginLeft: 4 }}> (Overdue)</span>}
        </span>
      );
    } else {
      // Day view
      display = (
        <span>
          {tagSymbol && <span style={{ color: '#000', marginRight: 4 }}>{tagSymbol}</span>}
          {event.title} | Overdue: {overdueCount}, Due: {dueCount}, Upcoming: {upcomingCount}, Completed: {completedCount}
          {isOverdue && <span style={{ color: '#dc3545', marginLeft: 4 }}> (Overdue)</span>}
        </span>
      );
    }

    return display;
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
            onView={(view) => setCurrentView(view)}
            draggableAccessor={() => true}
            resizable
            onEventDrop={handleEventDrop}
            components={{
              event: (props) => (
                <CustomEvent
                  {...props}
                  routeTags={routeTags}
                  currentView={currentView}
                />
              ),
            }}
          />
        </div>

        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Legend</h2>
          <ul className="list-none space-y-1">
            <li><span className="inline-block w-4 h-4 bg-blue-500 mr-2"></span> Weekly [W]</li>
            <li><span className="inline-block w-4 h-4 bg-yellow-500 mr-2"></span> Bi-weekly [B]</li>
            <li><span className="inline-block w-4 h-4 bg-green-500 mr-2"></span> Monthly [M]</li>
            <li><span className="inline-block w-4 h-4 bg-gray-500 mr-2"></span> One-time [O]</li>
            <li><span className="inline-block w-4 h-4 bg-teal-500 mr-2"></span> Other [OT]</li>
            <li><span className="inline-block w-4 h-4 bg-[#3174ad] mr-2"></span> No Tag (Default)</li>
            <p className="mt-2">Borders indicate timing:</p>
            <li><span className="inline-block w-4 h-4 border-2 border-green-500 mr-2"></span>All Completed</li>
            <li><span className="inline-block w-4 h-4 border-2 border-red-500 mr-2"></span>Overdue</li>
            <li><span className="inline-block w-4 h-4 border-2 border-orange-500 mr-2"></span>Due Today</li>
            <li><span className="inline-block w-4 h-4 border-2 border-yellow-500 mr-2"></span>Due Soon (within 2 days)</li>
          </ul>
        </div>

        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg text-black shadow-lg max-w-md w-full">
              <h3 className="text-xl font-semibold mb-4">{selectedEvent.title}</h3>
              {jobsInModal.length > 0 ? (
                <>
                  <p><strong>Job {currentJobIndex + 1} of {jobsInModal.length}</strong></p>
                  <p><strong>Customer:</strong> {jobsInModal[currentJobIndex].customer?.name || 'No Customer'}</p>
                  <p><strong>Address:</strong> {jobsInModal[currentJobIndex].location?.address || 'No Address'}</p>
                  <p><strong>Revenue:</strong> ${jobsInModal[currentJobIndex].price || 'No Price'}</p>
                  <p><strong>Type:</strong> {jobsInModal[currentJobIndex].isRecurring ? jobsInModal[currentJobIndex].recurrencePattern : 'One-time'}</p>
                  <p><strong>Last Service Date:</strong> {jobsInModal[currentJobIndex].lastServiceDate ? new Date(jobsInModal[currentJobIndex].lastServiceDate).toLocaleDateString() : 'N/A'}</p>
                  <p><strong>Days Since Last Service:</strong> {calculateDaysSinceLastService(jobsInModal[currentJobIndex].lastServiceDate)}</p>
                  <p><strong>Status:</strong> {jobsInModal[currentJobIndex].isDue ? 'Due for Service' : 'Not Due Yet'}</p>
                  {jobsInModal[currentJobIndex].isOverdue && <p className="text-red-600 font-bold mt-2">This job is overdue!</p>}
                  <div className="mt-6 flex justify-end space-x-2">
                    <button onClick={markAsCompleted} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">Mark as Completed</button>
                    <button onClick={markAllAsCompleted} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Mark All as Completed</button>
                    <button onClick={previousJob} disabled={currentJobIndex === 0} className={`px-4 py-2 text-white rounded-md hover:bg-gray-600 ${currentJobIndex === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-500'}`}>Previous</button>
                    <button onClick={nextJob} disabled={currentJobIndex === jobsInModal.length - 1} className={`px-4 py-2 text-white rounded-md hover:bg-gray-600 ${currentJobIndex === jobsInModal.length - 1 ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-500'}`}>Next</button>
                  </div>
                </>
              ) : (
                <p>No jobs due on this date in this route.</p>
              )}
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
              </div>
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

