import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { parse, startOfWeek, getDay, format, addDays } from 'date-fns';
import axiosInstance from '../utils/axiosInstance';
import Header from '../components/Header';
import DayCellWrapper from '../components/DayCellWrapper';
import { DndProvider, useDrag } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
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

// Job Pool Item Component
const JobPoolItem = ({ job }) => {
  const [{ isDragging }, dragRef] = useDrag({
    type: 'JOB',
    item: { job },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={dragRef}
      className={`p-2 bg-gray-700 text-white rounded cursor-move mb-2 ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <p><strong>{job.service}</strong></p>
      <p>Customer: {job.customer?.name || 'N/A'}</p>
      <p>Price: ${job.price}</p>
    </div>
  );
};

const RouteDetailsModal = ({ route, isOpen, onClose }) => {
  if (!route) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>{route.name}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Jobs ({route.jobs?.length || 0})</h3>
          <div className="space-y-2">
            {route.jobs?.map((job) => (
              <div key={job._id} className="p-2 bg-gray-700 rounded">
                <p><strong>{job.service}</strong></p>
                <p>Customer: {job.customer?.name || 'N/A'}</p>
                <p>Price: ${job.price}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-x-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500">
              Close
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CalendarPage = () => {
  const [events, setEvents] = useState([]);
  const [jobPool, setJobPool] = useState([]);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('month');
  const [allRoutes, setAllRoutes] = useState({});
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEventsAndJobs = useCallback(async () => {
    try {
      const [routesResponse, jobsResponse] = await Promise.all([
        axiosInstance.get('/routes'),
        axiosInstance.get('/jobs/available'),
      ]);

      const routes = routesResponse.data.routes || {};
      setAllRoutes(routes);

      const today = new Date();
      const next90Days = addDays(today, 90);
      const newEvents = [];

      for (let date = new Date(today); date <= next90Days; date = addDays(date, 1)) {
        const dayOfWeek = format(date, 'EEEE');
        const dayRoutes = routes[dayOfWeek] || [];

        dayRoutes.forEach((route) => {
          newEvents.push({
            title: `${route.name} (${route.jobs?.length || 0} jobs)`,
            start: date,
            end: date,
            allDay: false,
            resource: { route, jobs: route.jobs || [] },
          });
        });
      }

      setEvents(newEvents);
      setJobPool(jobsResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data.');
    }
  }, []);

  useEffect(() => {
    fetchEventsAndJobs();
  }, [fetchEventsAndJobs]);

  const handleJobDrop = async (job, date) => {
    try {
      const dayOfWeek = format(date, 'EEEE');
      const dayRoutes = allRoutes[dayOfWeek] || [];

      let routeId;

      if (dayRoutes.length === 0) {
        // Create a new route if none exists
        const createResponse = await axiosInstance.post('/routes', {
          dayOfWeek,
          name: `Route for ${dayOfWeek}`
        });
        routeId = createResponse.data.route._id;
      } else {
        // Use existing route
        routeId = dayRoutes[0]._id;
      }

      // Add job to the route
      await axiosInstance.post(`/routes/${routeId}/jobs`, {
        jobId: job._id
      });

      // Update local state immediately
      setJobPool(prev => prev.filter(j => j._id !== job._id));
      
      // Refresh calendar data
      await fetchEventsAndJobs();
    } catch (error) {
      console.error('Error dropping job:', error);
      setError('Failed to add job to the calendar. Please try again.');
    }
  };

  const handleEventClick = (event) => {
    setSelectedRoute(event.resource.route);
    setIsModalOpen(true);
  };

  const eventPropGetter = () => {
    return {
      style: { backgroundColor: '#3174ad', borderRadius: '4px', color: 'white', cursor: 'pointer' },
    };
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-900 text-white">
        <Header />
        <main className="max-w-7xl mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold mb-4">Calendar</h1>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          
          {/* Calendar */}
          <div className="bg-white text-black rounded-lg p-4 mb-8">
            <BigCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              defaultView="month"
              style={{ height: 600 }}
              components={{
                dateCellWrapper: (props) => (
                  <DayCellWrapper {...props} onJobDrop={handleJobDrop} />
                ),
              }}
              eventPropGetter={eventPropGetter}
              onView={(view) => setCurrentView(view)}
              onSelectEvent={handleEventClick}
              selectable={true}
            />
          </div>

          {/* Route Details Modal */}
          <RouteDetailsModal
            route={selectedRoute}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedRoute(null);
            }}
          />

          {/* Job Pool */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-white">Job Pool</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobPool.length > 0 ? (
                jobPool.map((job) => <JobPoolItem key={job._id} job={job} />)
              ) : (
                <p className="text-gray-400">No available jobs in the pool.</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </DndProvider>
  );
};

export default CalendarPage;
