import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMinutes, addMonths, addWeeks, isBefore } from 'date-fns';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { useDrag, useDrop } from 'react-dnd';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import '../styles/calendar.css';
import Header from '../components/Header';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

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
  const [routes, setRoutes] = useState({});
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showRouteDetails, setShowRouteDetails] = useState(false);
  const [routeSelectionCallback, setRouteSelectionCallback] = useState(null);

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

  const createRecurringSeries = (job, startDate) => {
    const series = [];
    const endDate = addMonths(startDate, 3); // Generate 3 months of events
    
    switch(job.recurrencePattern) {
      case 'Weekly':
        let weeklyDate = startDate;
        while (isBefore(weeklyDate, endDate)) {
          series.push({
            id: `event-${Date.now()}-${series.length}`,
            title: job.title,
            start: weeklyDate,
            end: addMinutes(weeklyDate, job.estimatedDuration || 60),
            job: job,
            seriesId: `series-${Date.now()}`
          });
          weeklyDate = addWeeks(weeklyDate, 1);
        }
        break;
      
      case 'Bi-weekly':
        let biWeeklyDate = startDate;
        while (isBefore(biWeeklyDate, endDate)) {
          series.push({
            id: `event-${Date.now()}-${series.length}`,
            title: job.title,
            start: biWeeklyDate,
            end: addMinutes(biWeeklyDate, job.estimatedDuration || 60),
            job: job,
            seriesId: `series-${Date.now()}`
          });
          biWeeklyDate = addWeeks(biWeeklyDate, 2);
        }
        break;
      
      case 'Monthly':
        let monthlyDate = startDate;
        while (isBefore(monthlyDate, endDate)) {
          series.push({
            id: `event-${Date.now()}-${series.length}`,
            title: job.title,
            start: monthlyDate,
            end: addMinutes(monthlyDate, job.estimatedDuration || 60),
            job: job,
            seriesId: `series-${Date.now()}`
          });
          monthlyDate = addMonths(monthlyDate, 1);
        }
        break;
      
      default:
        // One-time event
        series.push({
          id: `event-${Date.now()}`,
          title: job.title,
          start: startDate,
          end: addMinutes(startDate, job.estimatedDuration || 60),
          job: job
        });
    }
    
    return series;
  };

  // Function to calculate route details
  const calculateRouteDetails = (routeEvents) => {
    return routeEvents.reduce((acc, event) => {
      return {
        totalRevenue: acc.totalRevenue + (event.job?.price || 0),
        totalDuration: acc.totalDuration + (event.job?.estimatedDuration || 60),
        jobCount: acc.jobCount + 1
      };
    }, { totalRevenue: 0, totalDuration: 0, jobCount: 0 });
  };

  // Function to handle route selection when dropping a job
  const handleRouteSelection = (date, job) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const routesForDay = routes[dateKey] || [];

    if (routesForDay.length === 0) {
      // Create new route if none exist
      const newRoute = {
        id: `route-${Date.now()}`,
        date: date,
        events: [],
        details: { totalRevenue: 0, totalDuration: 0, jobCount: 0 }
      };
      setRoutes(prev => ({
        ...prev,
        [dateKey]: [newRoute]
      }));
      return newRoute.id;
    } else if (routesForDay.length === 1) {
      // Use existing route if only one exists
      return routesForDay[0].id;
    } else {
      // Show route selection modal if multiple routes exist
      setShowRouteModal(true);
      return new Promise((resolve) => {
        // Store the resolve function to be called when user selects a route
        setRouteSelectionCallback(() => resolve);
      });
    }
  };

  // Modified drop handler to work with routes
  const [, drop] = useDrop({
    accept: 'JOB',
    drop: async (item, monitor) => {
      const dropPoint = monitor.getClientOffset();
      const calendarElement = document.querySelector('.rbc-calendar');
      const calendarRect = calendarElement.getBoundingClientRect();
      
      const date = calculateDateFromPosition(dropPoint, calendarRect);
      const routeId = await handleRouteSelection(date, item.job);
      
      const newEvents = item.job.isRecurring 
        ? createRecurringSeries(item.job, date)
        : [{
            id: `event-${Date.now()}`,
            title: item.job.title,
            start: date,
            end: addMinutes(date, item.job.estimatedDuration || 60),
            job: item.job,
            routeId: routeId
          }];

      // Update events and routes
      setEvents(prev => [...prev, ...newEvents]);
      
      const dateKey = format(date, 'yyyy-MM-dd');
      setRoutes(prev => {
        const updatedRoutes = { ...prev };
        const routeIndex = updatedRoutes[dateKey].findIndex(r => r.id === routeId);
        
        if (routeIndex !== -1) {
          updatedRoutes[dateKey][routeIndex] = {
            ...updatedRoutes[dateKey][routeIndex],
            events: [...updatedRoutes[dateKey][routeIndex].events, ...newEvents],
            details: calculateRouteDetails([...updatedRoutes[dateKey][routeIndex].events, ...newEvents])
          };
        }
        
        return updatedRoutes;
      });

      setJobPool(prev => prev.filter(j => j._id !== item.job._id));
    }
  });

  const calculateDateFromPosition = (dropPoint, calendarRect) => {
    const hourHeight = (calendarRect.height - 50) / 24; // Approximate header height of 50px
    const minutesFromTop = ((dropPoint.y - calendarRect.top - 50) / hourHeight) * 60;
    
    const date = new Date();
    date.setHours(Math.floor(minutesFromTop / 60));
    date.setMinutes(Math.round(minutesFromTop % 60));
    
    // Calculate day based on x position
    const dayWidth = calendarRect.width / 7;
    const dayIndex = Math.floor((dropPoint.x - calendarRect.left) / dayWidth);
    const currentDay = startOfWeek(date);
    date.setDate(currentDay.getDate() + dayIndex);
    
    return date;
  };

  const moveEvent = ({ event, start, end }) => {
    const dateKey = format(event.start, 'yyyy-MM-dd');
    const newDateKey = format(start, 'yyyy-MM-dd');
    
    setEvents(prev => {
      const filtered = prev.filter(e => e.id !== event.id);
      return [...filtered, { ...event, start, end }];
    });

    // Update route if event is part of one
    if (event.routeId) {
      setRoutes(prev => {
        const updatedRoutes = { ...prev };
        
        // Remove from old route
        if (updatedRoutes[dateKey]) {
          const oldRouteIndex = updatedRoutes[dateKey].findIndex(r => r.id === event.routeId);
          if (oldRouteIndex !== -1) {
            updatedRoutes[dateKey][oldRouteIndex].events = 
              updatedRoutes[dateKey][oldRouteIndex].events.filter(e => e.id !== event.id);
          }
        }
        
        // Add to new route
        if (!updatedRoutes[newDateKey]) {
          updatedRoutes[newDateKey] = [{
            id: event.routeId,
            date: start,
            events: [],
            details: { totalRevenue: 0, totalDuration: 0, jobCount: 0 }
          }];
        }
        
        const newRouteIndex = updatedRoutes[newDateKey].findIndex(r => r.id === event.routeId);
        if (newRouteIndex !== -1) {
          const updatedEvent = { ...event, start, end };
          updatedRoutes[newDateKey][newRouteIndex].events.push(updatedEvent);
          updatedRoutes[newDateKey][newRouteIndex].details = 
            calculateRouteDetails(updatedRoutes[newDateKey][newRouteIndex].events);
        }
        
        return updatedRoutes;
      });
    }
  };

  const EventComponent = ({ event }) => {
    const isMonthView = useCallback(() => {
      const calendarElement = document.querySelector('.rbc-month-view');
      return !!calendarElement;
    }, []);

    return (
      <div 
        className={`event-wrapper ${isMonthView() ? 'month-view' : 'week-view'}`}
        onClick={() => handleRouteClick(event.routeId, event.start)}
      >
        <div className="event-content">
          <div className="event-header">
            <span className="event-time">
              {format(event.start, 'h:mm a')}
            </span>
            {event.seriesId && (
              <span className="recurring-indicator">↻</span>
            )}
          </div>
          <div className="event-title">{event.title}</div>
          <div className="event-details">
            <span className="customer-name">{event.job?.customer?.name}</span>
            <span className="event-duration">{event.job?.estimatedDuration}min</span>
          </div>
        </div>
      </div>
    );
  };

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

  // Route selection modal component
  const RouteSelectionModal = ({ date, onSelect, onClose }) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const routesForDay = routes[dateKey] || [];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">Select Route</h2>
          <div className="space-y-4">
            {routesForDay.map(route => (
              <button
                key={route.id}
                onClick={() => onSelect(route.id)}
                className="w-full p-4 text-left border rounded hover:bg-gray-50"
              >
                <div className="font-semibold">Route {route.id}</div>
                <div className="text-sm text-gray-600">
                  Jobs: {route.details.jobCount} | 
                  Revenue: ${route.details.totalRevenue} | 
                  Duration: {route.details.totalDuration}min
                </div>
              </button>
            ))}
            <button
              onClick={() => {
                const newRoute = {
                  id: `route-${Date.now()}`,
                  date: date,
                  events: [],
                  details: { totalRevenue: 0, totalDuration: 0, jobCount: 0 }
                };
                setRoutes(prev => ({
                  ...prev,
                  [dateKey]: [...(prev[dateKey] || []), newRoute]
                }));
                onSelect(newRoute.id);
              }}
              className="w-full p-4 text-center border rounded bg-blue-500 text-white hover:bg-blue-600"
            >
              Create New Route
            </button>
          </div>
          <button
            onClick={onClose}
            className="mt-4 w-full p-2 border rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  // Function to handle route click
  const handleRouteClick = (routeId, date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const route = routes[dateKey]?.find(r => r.id === routeId);
    if (route) {
      setSelectedRoute(route);
      setShowRouteDetails(true);
    }
  };

  // Function to handle job reordering within a route
  const handleJobReorder = (result) => {
    if (!result.destination || !selectedRoute) return;

    const dateKey = format(selectedRoute.date, 'yyyy-MM-dd');
    const items = Array.from(selectedRoute.events);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update route with new order
    setRoutes(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].map(route => 
        route.id === selectedRoute.id 
          ? { ...route, events: items }
          : route
      )
    }));
  };

  // Function to remove job from route
  const removeJobFromRoute = (eventId) => {
    if (!selectedRoute) return;

    const dateKey = format(selectedRoute.date, 'yyyy-MM-dd');
    const event = selectedRoute.events.find(e => e.id === eventId);

    // Remove event from route
    setRoutes(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].map(route => {
        if (route.id === selectedRoute.id) {
          const updatedEvents = route.events.filter(e => e.id !== eventId);
          return {
            ...route,
            events: updatedEvents,
            details: calculateRouteDetails(updatedEvents)
          };
        }
        return route;
      })
    }));

    // Add job back to pool
    if (event?.job) {
      setJobPool(prev => [...prev, event.job]);
    }
  };

  // Function to delete entire route
  const deleteRoute = () => {
    if (!selectedRoute) return;

    const dateKey = format(selectedRoute.date, 'yyyy-MM-dd');
    
    // Return all jobs to pool
    selectedRoute.events.forEach(event => {
      if (event.job) {
        setJobPool(prev => [...prev, event.job]);
      }
    });

    // Remove route
    setRoutes(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].filter(route => route.id !== selectedRoute.id)
    }));

    setShowRouteDetails(false);
    setSelectedRoute(null);
  };

  // Route Details Modal Component
  const RouteDetailsModal = ({ route, onClose }) => {
    if (!route) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">
              Route Details - {format(route.date, 'MMM dd, yyyy')}
            </h2>
            <div className="space-x-2">
              <button
                onClick={deleteRoute}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete Route
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded">
              <div className="text-lg font-semibold">Total Revenue</div>
              <div className="text-2xl text-green-600">${route.details.totalRevenue}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded">
              <div className="text-lg font-semibold">Duration</div>
              <div className="text-2xl">{route.details.totalDuration} min</div>
            </div>
            <div className="bg-blue-50 p-4 rounded">
              <div className="text-lg font-semibold">Jobs</div>
              <div className="text-2xl">{route.details.jobCount}</div>
            </div>
          </div>

          <DragDropContext onDragEnd={handleJobReorder}>
            <Droppable droppableId="route-jobs">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {route.events.map((event, index) => (
                    <Draggable
                      key={event.id}
                      draggableId={event.id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-white border rounded-lg p-4 shadow-sm hover:shadow"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-semibold">{event.title}</h3>
                              <p className="text-sm text-gray-600">
                                {event.job?.customer?.name} | 
                                Duration: {event.job?.estimatedDuration || 60}min | 
                                ${event.job?.price || 0}
                              </p>
                            </div>
                            <button
                              onClick={() => removeJobFromRoute(event.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
    );
  };

  // Add custom styling for the calendar
  const calendarStyle = {
    height: 800,
    className: "custom-calendar"
  };

  // Update the event prop getter
  const eventPropGetter = useCallback((event) => ({
    className: `calendar-event ${event.seriesId ? 'recurring-event' : ''} ${event.routeId ? 'route-event' : ''}`,
    style: {
      backgroundColor: event.routeId ? '#3182ce' : '#48bb78',
      borderColor: event.routeId ? '#2c5282' : '#2f855a',
      minHeight: '60px',
      padding: '4px'
    }
  }), []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-4 gap-8">
          {/* Job Pool */}
          <div className="col-span-1 bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Job Pool</h2>
            <div className="space-y-3"> {/* Increased spacing between jobs */}
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
              style={calendarStyle}
              onEventDrop={moveEvent}
              onEventResize={moveEvent}
              resizable
              selectable
              popup
              components={{
                event: EventComponent
              }}
              eventPropGetter={eventPropGetter}
              dayPropGetter={(date) => ({
                className: 'calendar-day',
                style: {
                  backgroundColor: 'white',
                  padding: '8px'
                }
              })}
            />
          </div>
        </div>

        {selectedEvent && (
          <EventDetailsModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        )}

        {showRouteModal && (
          <RouteSelectionModal
            date={new Date()} // Replace with actual drop date
            onSelect={(routeId) => {
              setShowRouteModal(false);
              routeSelectionCallback(routeId);
            }}
            onClose={() => {
              setShowRouteModal(false);
              routeSelectionCallback(null);
            }}
          />
        )}

        {showRouteDetails && selectedRoute && (
          <RouteDetailsModal
            route={selectedRoute}
            onClose={() => {
              setShowRouteDetails(false);
              setSelectedRoute(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Calendar; 