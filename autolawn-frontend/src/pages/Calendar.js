import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMinutes } from 'date-fns';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import '../styles/calendar.css';
import Header from '../components/Header';

const DnDCalendar = withDragAndDrop(BigCalendar);

const JobPoolItem = ({ job }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'JOB',
    item: { type: 'JOB', job },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`bg-white p-4 mb-2 rounded-lg shadow hover:shadow-lg transition-shadow cursor-move
        ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <h4 className="font-semibold text-gray-800">{job.title}</h4>
      <p className="text-sm text-gray-600">{job.customer?.name}</p>
      <div className="flex justify-between mt-2 text-sm">
        <span className="text-green-600">${job.price}</span>
        <span className="text-gray-600">{job.duration || 60}min</span>
      </div>
    </div>
  );
};

const locales = {
  'en-US': require('date-fns/locale/en-US')
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const Calendar = () => {
  const [jobs, setJobs] = useState([]);
  const [events, setEvents] = useState([]);
  const [jobPool, setJobPool] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showWeather, setShowWeather] = useState(true);

  // Fetch active jobs for the job pool
  useEffect(() => {
    const fetchActiveJobs = async () => {
      try {
        const response = await fetch('/api/jobs/active');
        const data = await response.json();
        setJobPool(data);
      } catch (error) {
        console.error('Error fetching active jobs:', error);
      }
    };

    fetchActiveJobs();
  }, []);

  const [, drop] = useDrop({
    accept: 'JOB',
    drop: (item, monitor) => {
      const dropPoint = monitor.getClientOffset();
      const calendarElement = document.querySelector('.rbc-calendar');
      const calendarRect = calendarElement.getBoundingClientRect();
      
      // Calculate relative position in calendar
      const relativeX = dropPoint.x - calendarRect.left;
      const relativeY = dropPoint.y - calendarRect.top;
      
      // Convert position to date/time
      // This is a simplified version - you'll need to adjust based on your calendar's view
      const date = new Date(); // Calculate proper date based on drop position
      
      const newEvent = {
        id: `event-${Date.now()}`,
        title: item.job.title,
        start: date,
        end: addMinutes(date, item.job.duration || 60),
        job: item.job
      };

      setEvents(prev => [...prev, newEvent]);
      setJobPool(prev => prev.filter(j => j._id !== item.job._id));
    }
  });

  const moveEvent = ({ event, start, end }) => {
    setEvents(prev => prev.map(ev => 
      ev.id === event.id ? { ...ev, start, end } : ev
    ));
  };

  const EventComponent = ({ event }) => (
    <div className="bg-blue-500 text-white p-2 rounded">
      <div className="font-semibold">{event.title}</div>
      <div className="text-sm">{event.job?.customer?.name}</div>
    </div>
  );

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  const EventDetailsModal = ({ event, onClose }) => {
    if (!event) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold mb-4 text-gray-800">{event.title}</h2>
          <div className="space-y-4">
            <div>
              <p className="text-gray-600">Customer: {event.job?.customer?.name}</p>
              <p className="text-gray-600">Duration: {event.job?.duration || 60} minutes</p>
              <p className="text-green-600">Price: ${event.job?.price}</p>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => {
                  setJobPool([...jobPool, event.job]);
                  setEvents(events.filter(e => e.id !== event.id));
                  onClose();
                }}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Remove
              </button>
              <button
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-4 gap-8">
            {/* Job Pool */}
            <div className="col-span-1 bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Job Pool</h2>
              <div className="space-y-2">
                {jobPool.map((job) => (
                  <JobPoolItem key={job._id} job={job} />
                ))}
              </div>
            </div>

            {/* Calendar */}
            <div ref={drop} className="col-span-3 bg-white p-4 rounded-lg shadow">
              <DnDCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 700 }}
                onEventDrop={moveEvent}
                onEventResize={moveEvent}
                resizable
                selectable
                popup
              />
            </div>
          </div>

          {selectedEvent && (
            <EventDetailsModal
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
            />
          )}
        </div>
      </div>
    </DndProvider>
  );
};

export default Calendar; 