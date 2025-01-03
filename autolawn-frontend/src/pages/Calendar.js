import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Header from '../components/Header';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { WiDaySunny, WiRain, WiCloudy } from 'react-icons/wi';

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

  const JobPoolItem = ({ job, index }) => (
    <Draggable draggableId={job._id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="bg-white p-4 mb-2 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
        >
          <h4 className="font-semibold text-gray-800">{job.title}</h4>
          <p className="text-sm text-gray-600">{job.customer?.name}</p>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-green-600">${job.price}</span>
            <span className="text-gray-600">{job.duration || 60}min</span>
          </div>
        </div>
      )}
    </Draggable>
  );

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === 'jobPool') {
      const job = jobPool.find(j => j._id === draggableId);
      const date = new Date(destination.droppableId);
      
      // Create new event
      const newEvent = {
        id: `event-${Date.now()}`,
        title: job.title,
        start: date,
        end: new Date(date.getTime() + (job.duration || 60) * 60000),
        job: job,
        resource: 'route-1'
      };

      setEvents([...events, newEvent]);
      setJobPool(jobPool.filter(j => j._id !== draggableId));
    }
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-4 gap-8">
          {/* Job Pool */}
          <div className="col-span-1 bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Job Pool</h2>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="jobPool">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-2"
                  >
                    {jobPool.map((job, index) => (
                      <JobPoolItem key={job._id} job={job} index={index} />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* Calendar */}
          <div className="col-span-3 bg-white p-4 rounded-lg shadow">
            <BigCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 700 }}
              components={{
                event: EventComponent
              }}
              onSelectEvent={handleSelectEvent}
              draggableAccessor={() => true}
              selectable
              resizable
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
  );
};

export default Calendar; 