import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance'; // Use axiosInstance
import Header from '../components/Header';
import Alert from '../components/Alert';
import ConfirmDialog from '../components/ConfirmDialog';
import { PencilIcon, CheckIcon } from '@heroicons/react/24/solid';

const ManageJobs = () => {
  const [jobs, setJobs] = useState({ recurring: [], oneTime: [] });
  const [filteredJobs, setFilteredJobs] = useState({ recurring: [], oneTime: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [filter, setFilter] = useState('All');
  const [selectedJobs, setSelectedJobs] = useState({ recurring: [], oneTime: [] });
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [filter, jobs, pageSize, currentPage]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('http://autolawn.app/api/jobs', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const recurringJobs = response.data.filter(job => job.isRecurring);
      const oneTimeJobs = response.data.filter(job => !job.isRecurring);
      setJobs({ recurring: recurringJobs, oneTime: oneTimeJobs });
      filterJobs();
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to fetch jobs. Please try again.');
    }
    setLoading(false);
  };

  const filterJobs = () => {
    const filterByStatus = (jobsList) => {
      if (filter === 'All') return jobsList;
      return jobsList.filter(job => job.status === filter || job.recurringStatus === filter);
    };

    setFilteredJobs({
      recurring: paginate(filterByStatus(jobs.recurring)),
      oneTime: paginate(filterByStatus(jobs.oneTime))
    });
  };

  const paginate = (jobsList) => {
    const startIndex = (currentPage - 1) * pageSize;
    return jobsList.slice(startIndex, startIndex + pageSize);
  };

  const handleEditActualDuration = (job) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Edit Actual Duration',
      message: (
        <div>
          <p>Enter actual duration in minutes:</p>
          <input
            type="number"
            defaultValue={job.actualDuration || ''}
            min="0"
            className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 bg-gray-700 text-white"
            id="actualDurationInput"
          />
        </div>
      ),
      onConfirm: () => {
        const inputElement = document.getElementById('actualDurationInput');
        const newDuration = parseInt(inputElement.value, 10);
        if (!isNaN(newDuration) && newDuration >= 0) {
          axiosInstance.put(`http://autolawn.app/api/jobs/${job._id}`, 
            { actualDuration: newDuration },
            { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
          )
          .then(() => {
            fetchJobs();
            setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null });
          })
          .catch((error) => {
            console.error('Error updating actual duration:', error);
            setError('Failed to update actual duration. Please try again.');
            setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null });
          });
        } else {
          setError('Please enter a valid number for the actual duration.');
          setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null });
        }
      }
    });
  };

  const handleDeleteJobs = (jobType) => {
    const jobsToDelete = selectedJobs[jobType];
    if (jobsToDelete.length === 0) return;
  
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Jobs',
      message: `Are you sure you want to delete ${jobsToDelete.length} job(s)?`,
      onConfirm: async () => {
        try {
          await Promise.all(jobsToDelete.map(jobId => 
            axiosInstance.delete(`http://autolawn.app/api/jobs/${jobId}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            })
          ));
          fetchJobs();
          setSelectedJobs({ ...selectedJobs, [jobType]: [] });
        } catch (error) {
          console.error('Error deleting jobs:', error);
          setError('Failed to delete jobs. Please try again.');
        }
      }
    });
  };

  const handleEditJob = (job) => {
    setEditingJob({
      ...job,
      scheduledDay: job.scheduledDay || '',
    });
  };

  const handleCompleteJob = (jobId, isRecurring) => {
    const job = jobs.recurring.find(j => j._id === jobId) || jobs.oneTime.find(j => j._id === jobId);
    
    if (isRecurring || job.status !== 'Completed') {
      setConfirmDialog({
        isOpen: true,
        title: 'Complete Job',
        message: 'Are you sure you want to mark this job as completed?',
        onConfirm: async () => {
          try {
            const response = await axiosInstance.post(`http://autolawn.app/api/jobs/${jobId}/complete`, 
              {}, 
              { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            
            // Update the local state with the updated job
            const updatedJob = response.data;
            setJobs(prevJobs => ({
              recurring: prevJobs.recurring.map(j => j._id === jobId ? updatedJob : j),
              oneTime: prevJobs.oneTime.map(j => j._id === jobId ? updatedJob : j)
            }));
  
            // Optionally, you can show a success message
            setError(''); // Clear any existing errors
            // You might want to add a success state and message here
          } catch (error) {
            console.error('Error completing job:', error);
            setError('Failed to complete job. Please try again.');
          }
        }
      });
    } else if (job.status === 'Completed' && !job.isRecurring) {
      setError('This one-time job has already been completed.');
    }
  };

  const handleUpdateJob = async () => {
    try {
      await axiosInstance.put(`http://autolawn.app/api/jobs/${editingJob._id}`, editingJob, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchJobs();
      setEditingJob(null);
    } catch (error) {
      console.error('Error updating job:', error);
      setError('Failed to update job. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
  
    // Handle "Not scheduled" case for scheduledDay
    setEditingJob(prevState => ({
      ...prevState,
      [name]: value === '' ? null : value
    }));
  };

  const handleBulkComplete = (jobType) => {
    const jobsToComplete = selectedJobs[jobType];
    if (jobsToComplete.length === 0) return;
  
    const jobsData = jobType === 'recurring' ? jobs.recurring : jobs.oneTime;
    const invalidJobs = jobsData
      .filter(job => jobsToComplete.includes(job._id) && !job.isRecurring && job.status === 'Completed')
      .map(job => job.title);
  
    if (invalidJobs.length > 0) {
      setError(`The following one-time jobs are already completed and cannot be completed again: ${invalidJobs.join(', ')}`);
      return;
    }
  
    setConfirmDialog({
      isOpen: true,
      title: 'Complete Jobs',
      message: `Are you sure you want to mark ${jobsToComplete.length} job(s) as completed?`,
      onConfirm: async () => {
        try {
          await Promise.all(jobsToComplete.map(jobId => 
            axiosInstance.post(`http://autolawn.app/api/jobs/${jobId}/complete`, 
              {}, 
              { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            )
          ));
          fetchJobs();
          setSelectedJobs({ ...selectedJobs, [jobType]: [] });
        } catch (error) {
          console.error('Error completing jobs:', error);
          setError('Failed to complete jobs. Please try again.');
        }
      }
    });
  };

  const handleStatusChange = async (jobId, newStatus, isRecurring) => {
    try {
      const updatedStatus = isRecurring ? { recurringStatus: newStatus } : { status: newStatus };
      await axiosInstance.put(`http://autolawn.app/api/jobs/${jobId}`, 
        updatedStatus,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      fetchJobs();
    } catch (error) {
      console.error('Error updating job status:', error);
      setError('Failed to update job status. Please try again.');
    }
  };

  const handleSelectJob = (jobId, jobType) => {
    setSelectedJobs(prev => ({
      ...prev,
      [jobType]: prev[jobType].includes(jobId)
        ? prev[jobType].filter(id => id !== jobId)
        : [...prev[jobType], jobId]
    }));
  };

  const handleSelectAllJobs = (event, jobType) => {
    if (event.target.checked) {
      setSelectedJobs(prev => ({
        ...prev,
        [jobType]: filteredJobs[jobType].map(job => job._id)
      }));
    } else {
      setSelectedJobs(prev => ({ ...prev, [jobType]: [] }));
    }
  };

  const handlePageSizeChange = (e) => {
    setPageSize(parseInt(e.target.value, 10));
    setCurrentPage(1); // Reset to the first page when page size changes
  };

  const handlePageChange = (direction) => {
    setCurrentPage(prev => direction === 'next' ? prev + 1 : prev - 1);
  };

  const renderPaginationControls = () => {
    return (
      <div className="flex justify-between items-center my-4">
        <select
          value={pageSize}
          onChange={handlePageSizeChange}
          className="mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-gray-700 text-white"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={15}>15</option>
          <option value={50}>50</option>
        </select>
        <div>
          <button
            onClick={() => handlePageChange('previous')}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded-md bg-gray-700 text-white ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {'<'}
          </button>
          <span className="px-4 text-white">Page {currentPage}</span>
          <button
            onClick={() => handlePageChange('next')}
            disabled={filteredJobs.oneTime.length < pageSize && filteredJobs.recurring.length < pageSize}
            className={`px-3 py-1 rounded-md bg-gray-700 text-white ${filteredJobs.oneTime.length < pageSize && filteredJobs.recurring.length < pageSize ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {'>'}
          </button>
        </div>
      </div>
    );
  };

  const renderJobTable = (jobs, jobType) => {
    if (!jobs || !Array.isArray(jobs)) {
      return <div>No jobs to display</div>;
    }
  
    return (
      <div className="overflow-x-auto mt-4">
        <h2 className="text-xl font-bold mb-2 text-white">{jobType === 'recurring' ? 'Recurring Jobs' : 'One-Time Jobs'}</h2>
        <div className="mb-2">
          {selectedJobs[jobType] && selectedJobs[jobType].length > 0 && (
            <>
              <button
                onClick={() => handleDeleteJobs(jobType)}
                className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 mr-2"
              >
                Delete Selected
              </button>
              <button
                onClick={() => handleBulkComplete(jobType)}
                className={`bg-green-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 mr-2 ${
                  jobType === 'oneTime' && selectedJobs[jobType].some(id => 
                    jobs.find(job => job._id === id && job.status === 'Completed')
                  ) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={jobType === 'oneTime' && selectedJobs[jobType].some(id => 
                  jobs.find(job => job._id === id && job.status === 'Completed')
                )}
              >
                Complete Selected
              </button>
            </>
          )}
          {selectedJobs[jobType] && selectedJobs[jobType].length === 1 && (
            <button
              onClick={() => handleEditJob(jobs.find(job => job._id === selectedJobs[jobType][0]))}
              className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Edit Selected
            </button>
          )}
        </div>
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                <input
                  type="checkbox"
                  onChange={(e) => handleSelectAllJobs(e, jobType)}
                  checked={selectedJobs[jobType] && selectedJobs[jobType].length === jobs.length && jobs.length > 0}
                />
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Job</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Route Day</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Service Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Completion Count</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total Revenue</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Estimated Duration</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actual Minutes</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-700">
            {jobs.map((job) => (
              <tr key={job._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    onChange={() => handleSelectJob(job._id, jobType)}
                    checked={selectedJobs[jobType] && selectedJobs[jobType].includes(job._id)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{job.title}</div>
                  <div className="text-sm text-gray-400">{job.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">{job.customer?.name || 'No customer assigned'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">${job.price}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {jobType === 'recurring' ? (
                    <select
                      value={job.recurringStatus}
                      onChange={(e) => handleStatusChange(job._id, e.target.value, true)}
                      className="text-sm text-white border rounded p-1 bg-primary"
                    >
                      <option value="Active" className="bg-primary text-white">Active</option>
                      <option value="Paused" className="bg-primary text-white">Paused</option>
                      <option value="Canceled" className="bg-primary text-white">Canceled</option>
                    </select>
                  ) : (
                    <select
                      value={job.status}
                      onChange={(e) => handleStatusChange(job._id, e.target.value, false)}
                      className="text-sm text-white border rounded p-1 bg-primary"
                    >
                      <option value="Pending" className="bg-primary text-white">Pending</option>
                      <option value="Scheduled" className="bg-primary text-white">Scheduled</option>
                      <option value="In Progress" className="bg-primary text-white">In Progress</option>
                      <option value="Completed" className="bg-primary text-white">Completed</option>
                      <option value="Canceled" className="bg-primary text-white">Canceled</option>
                    </select>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">{job.scheduledDay || 'Not scheduled'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">{job.lastServiceDate ? new Date(job.lastServiceDate).toLocaleDateString() : 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">{job.completionCount}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">${job.price * job.completionCount}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">
                    {job.estimatedDuration ? `${job.estimatedDuration} min` : 'Not set'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-white">
                    {job.actualDuration !== undefined ? (
                      <>
                        {job.actualDuration} min
                        <button
                          onClick={() => handleEditActualDuration(job)}
                          className="text-blue-500 ml-2"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleEditActualDuration(job)}
                        className="text-blue-500"
                      >
                        Set <PencilIcon className="h-5 w-5 inline-block" />
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCompleteJob(job._id, jobType === 'recurring')}
                      className={`text-green-600 hover:text-green-900 ${(jobType === 'oneTime' && job.status === 'Completed') ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={jobType === 'oneTime' && job.status === 'Completed'}
                    >
                      <CheckIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleEditJob(job)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {renderPaginationControls()}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-text">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold mb-6 text-white">Manage Jobs</h1>
          {error && <Alert type="error" message={error} />}
          
          <div className="mb-4 flex items-center space-x-4">
            <label htmlFor="filter" className="text-white">Filter by status:</label>
            <select 
              id="filter" 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="mt-1 block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-gray-700 text-white"
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Canceled">Canceled</option>
              <option value="Active">Active (Recurring)</option>
              <option value="Paused">Paused (Recurring)</option>
            </select>
          </div>
  
          {loading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-white">Loading jobs...</p>
            </div>
          ) : (
            <>
              {renderJobTable(filteredJobs.recurring, 'recurring')}
              {renderJobTable(filteredJobs.oneTime, 'oneTime')}
            </>
          )}
        </div>
      </main>
  
      {/* Edit Job Modal */}
      {editingJob && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-surface rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-background px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-text" id="modal-title">
                  Edit Job
                </h3>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-gray-300">Job Title</span>
                    <input
                      type="text"
                      name="title"
                      value={editingJob.title}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 bg-gray-700 text-white"
                    />
                  </label>
                  <label className="block">
                    <span className="text-gray-300">Job Description</span>
                    <textarea
                      name="description"
                      value={editingJob.description}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 bg-gray-700 text-white"
                    />
                  </label>
                  <label className="block">
                    <span className="text-gray-300">Price</span>
                    <input
                      type="number"
                      name="price"
                      value={editingJob.price}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 bg-gray-700 text-white"
                    />
                  </label>
                  <label className="block">
                    <span className="text-gray-300">Status</span>
                    <select
                      name="status"
                      value={editingJob.status}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 bg-gray-700 text-white"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Canceled">Canceled</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-gray-300">Job Type</span>
                    <select
                      name="isRecurring"
                      value={editingJob.isRecurring}
                      onChange={(e) => handleInputChange({
                        target: {
                          name: 'isRecurring',
                          value: e.target.value === 'true'
                        }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 bg-gray-700 text-white"
                      disabled
                    >
                      <option value={false}>One-time</option>
                      <option value={true}>Recurring</option>
                    </select>
                  </label>
                  {editingJob.isRecurring && (
                    <label className="block">
                      <span className="text-gray-300">Recurrence Pattern</span>
                      <select
                        name="recurrencePattern"
                        value={editingJob.recurrencePattern}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 bg-gray-700 text-white"
                      >
                        <option value="Weekly">Weekly</option>
                        <option value="Bi-weekly">Bi-weekly</option>
                        <option value="Monthly">Monthly</option>
                      </select>
                    </label>
                  )}
                  <label className="block">
                    <span className="text-gray-300">Scheduled Day</span>
                    <select
                      name="scheduledDay"
                      value={editingJob.scheduledDay ?? ''}  // Default to empty string if null
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 bg-gray-700 text-white"
                    >
                      <option value="">Not scheduled</option>
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-gray-300">Estimated Duration (minutes)</span>
                    <input
                      type="number"
                      name="estimatedDuration"
                      value={editingJob.estimatedDuration}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 bg-gray-700 text-white"
                    />
                  </label>
                </div>
              </div>
              <div className="bg-gray-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleUpdateJob}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-surface text-base font-medium text-text hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setEditingJob(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
  
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={() => {
          if (confirmDialog.onConfirm) {
            confirmDialog.onConfirm();
          }
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

export default ManageJobs;
