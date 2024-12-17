import React from 'react';

const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-gray-800 text-white p-6 rounded-lg max-w-md w-full">
        <p>{message}</p>
        <div className="mt-4 flex justify-end space-x-4">
          <button onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded">
            No
          </button>
          <button onClick={onConfirm} className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded">
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

