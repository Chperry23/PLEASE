import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance'; // Use axiosInstance
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/solid';
import Header from '../components/Header';

const ManageEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [crews, setCrews] = useState([]);
  const [newCrewName, setNewCrewName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchCrews();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('http://autolawn.app/api/employees', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to fetch employees. Please try again.');
    }
    setLoading(false);
  };

  const fetchCrews = async () => {
    try {
      const response = await axiosInstance.get('http://autolawn.app/api/crews', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setCrews(response.data);
    } catch (error) {
      console.error('Error fetching crews:', error);
      setError('Failed to fetch crews. Please try again.');
    }
  };

  const handleAddCrew = async () => {
    if (!newCrewName.trim()) {
      setError('Crew name cannot be empty.');
      return;
    }
    try {
      const response = await axiosInstance.post('http://autolawn.app/api/crews', { name: newCrewName }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setCrews([...crews, response.data]);
      setNewCrewName('');
    } catch (error) {
      console.error('Error adding crew:', error);
      setError('Failed to add crew. Please try again.');
    }
  };

  const handleDeleteCrew = async (crewId) => {
    if (window.confirm('Are you sure you want to delete this crew?')) {
      try {
        await axiosInstance.delete(`http://autolawn.app/api/crews/${crewId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setCrews(crews.filter(crew => crew._id !== crewId));
      } catch (error) {
        console.error('Error deleting crew:', error);
        setError('Failed to delete crew. Please try again.');
      }
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;
  
    const sourceCrewId = source.droppableId;
    const destinationCrewId = destination.droppableId;
    const employeeId = result.draggableId;
  
    if (sourceCrewId === destinationCrewId) return;
  
    console.log('Attempting to move employee:', { employeeId, sourceCrewId, destinationCrewId });
  
    try {
      const response = await axiosInstance.put('http://autolawn.app/api/crews/move-employee', {
        employeeId,
        sourceCrewId: sourceCrewId === 'unassigned' ? null : sourceCrewId,
        destinationCrewId: destinationCrewId === 'unassigned' ? null : destinationCrewId
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      console.log('Move response:', response.data);
      await fetchEmployees();
      await fetchCrews();
    } catch (error) {
      console.error('Error moving employee:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      setError('Failed to move employee. Please check the console for more details.');
    }
  };

  return (
    <div className="min-h-screen bg-background text-text">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold mb-6 text-white">Manage Crews</h1>
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
          
          <div className="mb-6">
            <input
              type="text"
              value={newCrewName}
              onChange={(e) => setNewCrewName(e.target.value)}
              className="border rounded p-2 bg-surface text-text w-64 mr-2"
              placeholder="New Crew Name"
            />
            <button
              onClick={handleAddCrew}
              className="bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90 transition duration-200 flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Crew
            </button>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {crews.map((crew) => (
                <Droppable key={crew._id} droppableId={crew._id}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="bg-surface shadow-lg rounded-lg p-4"
                    >
                      <h2 className="text-xl font-bold mb-4 text-white flex justify-between items-center">
                        {crew.name}
                        <button
                          onClick={() => handleDeleteCrew(crew._id)}
                          className="text-red-500 hover:text-red-700 transition duration-200"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </h2>
                      <ul className="space-y-2 min-h-[100px]">
                        {crew.members.map((employee, index) => (
                          <Draggable key={employee._id} draggableId={employee._id} index={index}>
                            {(provided) => (
                              <li
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="bg-gray-700 p-3 rounded-md shadow transition duration-200 hover:shadow-md"
                              >
                                <div className="text-white font-medium">{employee.name}</div>
                                <div className="text-gray-400 text-sm">{employee.email}</div>
                              </li>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </ul>
                    </div>
                  )}
                </Droppable>
              ))}
              <Droppable droppableId="unassigned">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="bg-surface shadow-lg rounded-lg p-4"
                  >
                    <h2 className="text-xl font-bold mb-4 text-white">Unassigned Employees</h2>
                    <ul className="space-y-2 min-h-[100px]">
                      {employees
                        .filter(employee => !crews.some(crew => crew.members.find(member => member._id === employee._id)))
                        .map((employee, index) => (
                          <Draggable key={employee._id} draggableId={employee._id} index={index}>
                            {(provided) => (
                              <li
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="bg-gray-700 p-3 rounded-md shadow transition duration-200 hover:shadow-md"
                              >
                                <div className="text-white font-medium">{employee.name}</div>
                                <div className="text-gray-400 text-sm">{employee.email}</div>
                              </li>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </ul>
                  </div>
                )}
              </Droppable>
            </div>
          </DragDropContext>
        </div>
      </main>
    </div>
  );
};

export default ManageEmployees;