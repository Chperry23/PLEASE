import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Header from '../components/Header';
import { generateRecurringSeries, RECURRENCE_TYPES, updateSeriesOccurrence } from '../utils/recurringEvents';
import { WiDaySunny, WiRain, WiCloudy } from 'react-icons/wi';

const Calendar = () => {
  const [jobs, setJobs] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [jobPool, setJobPool] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [weatherData, setWeatherData] = useState({});
  const [showWeather, setShowWeather] = useState(true);
  const [recurrenceModal, setRecurrenceModal] = useState(null);

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

  // Fetch weather data
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Replace with your weather API
        const response = await fetch('/api/weather/forecast');
        const data = await response.json();
        setWeatherData(data);
      } catch (error) {
        console.error('Error fetching weather:', error);
      }
    };

    if (showWeather) {
      fetchWeather();
    }
  }, [showWeather]);

  // Enhanced handleDragEnd to handle recurring events
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === 'jobPool') {
      const job = jobPool.find(j => j._id === draggableId);
      
      // Show recurrence modal
      setRecurrenceModal({
        job,
        date: destination.droppableId
      });
    }
  };

  // Handle recurrence selection
  const handleRecurrenceSelect = (job, date, recurrenceType) => {
    const series = generateRecurringSeries(job, date, recurrenceType);
    
    // Create routes for each occurrence
    const newRoutes = series.map(occurrence => ({
      id: `route-${occurrence.occurrence}-${Date.now()}`,
      title: `Route: ${occurrence.title}`,
      start: occurrence.start,
      jobs: [occurrence],
      estimatedDuration: occurrence.duration || 60,
      totalRevenue: occurrence.price || 0,
      seriesId: occurrence.seriesId
    }));

    setRoutes([...routes, ...newRoutes]);
    setJobPool(jobPool.filter(j => j._id !== job._id));
    setRecurrenceModal(null);
  };

  // Handle clicking on a route
  const handleRouteClick = (info) => {
    const route = routes.find(r => r.id === info.event.id);
    setSelectedRoute(route);
  };

  // Render job pool items
  const JobPoolItem = ({ job, index }) => (
    <Draggable draggableId={job._id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="bg-surface p-4 mb-2 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <h4 className="font-semibold">{job.title}</h4>
          <p className="text-sm text-gray-300">{job.customer?.name}</p>
          <div className="flex justify-between mt-2 text-sm">
            <span>${job.price}</span>
            <span>{job.duration || 60}min</span>
          </div>
        </div>
      )}
    </Draggable>
  );

  // Weather display component
  const WeatherDisplay = ({ date }) => {
    const weather = weatherData[format(date, 'yyyy-MM-dd')];
    if (!weather) return null;

    return (
      <div className="flex items-center space-x-2 text-sm">
        {weather.condition === 'sunny' && <WiDaySunny className="text-yellow-400" />}
        {weather.condition === 'rain' && <WiRain className="text-blue-400" />}
        {weather.condition === 'cloudy' && <WiCloudy className="text-gray-400" />}
        <span>{weather.temperature}°F</span>
      </div>
    );
  };

  // Recurrence Modal Component
  const RecurrenceModal = ({ data, onClose }) => {
    if (!data) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-surface rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">Set Job Recurrence</h2>
          <div className="space-y-4">
            <button
              onClick={() => handleRecurrenceSelect(data.job, data.date, RECURRENCE_TYPES.WEEKLY)}
              className="w-full p-3 bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Weekly
            </button>
            <button
              onClick={() => handleRecurrenceSelect(data.job, data.date, RECURRENCE_TYPES.BIWEEKLY)}
              className="w-full p-3 bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Bi-weekly
            </button>
            <button
              onClick={() => handleRecurrenceSelect(data.job, data.date, RECURRENCE_TYPES.MONTHLY)}
              className="w-full p-3 bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Monthly
            </button>
            <button
              onClick={() => handleRecurrenceSelect(data.job, data.date, RECURRENCE_TYPES.ONETIME)}
              className="w-full p-3 bg-gray-600 rounded-lg hover:bg-gray-700"
            >
              One-time Only
            </button>
          </div>
          <button
            onClick={onClose}
            className="mt-4 w-full p-3 bg-gray-700 rounded-lg hover:bg-gray-800"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  // Enhanced Route Details Modal with series options
  const RouteDetailsModal = ({ route, onClose }) => {
    if (!route) return null;

    const handlePushEvent = (affectFuture) => {
      const updatedRoutes = routes.map(r => {
        if (affectFuture && r.seriesId === route.seriesId) {
          return { ...r, start: addDays(new Date(r.start), 1).toISOString() };
        } else if (!affectFuture && r.id === route.id) {
          return { ...r, start: addDays(new Date(r.start), 1).toISOString() };
        }
        return r;
      });
      setRoutes(updatedRoutes);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-surface rounded-lg p-6 max-w-2xl w-full">
          <h2 className="text-xl font-bold mb-4">Route Details</h2>
          <div className="space-y-4">
            {route.jobs.map((job, index) => (
              <div key={job._id} className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">{job.title}</h4>
                  <p className="text-sm text-gray-300">{job.customer?.name}</p>
                </div>
                <div className="text-right">
                  <p>${job.price}</p>
                  <p className="text-sm text-gray-300">{job.duration}min</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-between">
            <div>
              <p>Total Revenue: ${route.totalRevenue}</p>
              <p>Duration: {route.estimatedDuration}min</p>
            </div>
            <button
              onClick={onClose}
              className="bg-primary px-4 py-2 rounded-lg hover:bg-opacity-90"
            >
              Close
            </button>
          </div>
          
          {route.seriesId && (
            <div className="mt-4 border-t border-gray-700 pt-4">
              <h3 className="font-semibold mb-2">Series Options</h3>
              <div className="flex space-x-4">
                <button
                  onClick={() => handlePushEvent(false)}
                  className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Push This Event
                </button>
                <button
                  onClick={() => handlePushEvent(true)}
                  className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Push All Future Events
                </button>
              </div>
            </div>
          )}
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowWeather(!showWeather)}
            className="bg-surface px-4 py-2 rounded-lg hover:bg-opacity-90"
          >
            {showWeather ? 'Hide Weather' : 'Show Weather'}
          </button>
        </div>
        
        <div className="grid grid-cols-4 gap-8">
          {/* Job Pool */}
          <div className="col-span-1">
            <h2 className="text-xl font-bold mb-4">Job Pool</h2>
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
          <div className="col-span-3">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              events={routes}
              editable={true}
              droppable={true}
              eventClick={handleRouteClick}
              height="auto"
            />
          </div>
        </div>

        {/* Route Details Modal */}
        {selectedRoute && (
          <RouteDetailsModal
            route={selectedRoute}
            onClose={() => setSelectedRoute(null)}
          />
        )}
        
        {recurrenceModal && (
          <RecurrenceModal
            data={recurrenceModal}
            onClose={() => setRecurrenceModal(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Calendar; 