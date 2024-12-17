import React from 'react';
import { useDrag } from 'react-dnd';

const JobPool = ({ jobs, onJobDrop }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg w-full">
      <h2 className="text-white font-bold mb-4 text-xl">Job Pool</h2>
      <p className="text-sm text-gray-300 mb-4">Drag and drop jobs onto the calendar.</p>
      {jobs.length === 0 ? (
        <p className="text-white">No unscheduled jobs available</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map(job => (
            <DraggableJob key={job._id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
};

const DraggableJob = ({ job }) => {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: 'JOB',
    item: { job, type: 'JOB' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    end: (item, monitor) => {
      if (!monitor.didDrop()) {
        console.log('Drag ended without drop');
      }
    }
  }));

  const tag = job.isRecurring
    ? (job.recurrencePattern === 'Weekly' ? '{W}' :
      job.recurrencePattern === 'Bi-weekly' ? '{BW}' :
      job.recurrencePattern === 'Monthly' ? '{M}' : '{O}')
    : '{O}';
  const opacity = job.status === 'Completed' ? 'opacity-50' : 'opacity-100';

  return (
    <div 
      ref={dragRef} 
      className={`bg-gray-700 p-3 rounded cursor-move flex flex-col space-y-1 hover:bg-gray-600 transition-colors ${opacity} ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <div className="font-bold text-white flex justify-between items-center">
        <span>{job.customer?.name || 'No Customer'} {tag}</span>
        {job.price && <span className="text-green-300 font-semibold">${job.price}</span>}
      </div>
      <div className="text-sm text-gray-200">{job.service || 'No Service'}</div>
      {job.isRecurring && (
        <div className="text-xs text-blue-200">Recurring: {job.recurrencePattern}</div>
      )}
      {job.lastServiceDate && (
        <div className="text-xs text-yellow-200">Last Service: {new Date(job.lastServiceDate).toLocaleDateString()}</div>
      )}
      {job.location?.address && (
        <div className="text-xs text-gray-300">Location: {job.location.address}</div>
      )}
    </div>
  );
};

export default JobPool;
