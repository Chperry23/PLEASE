import React from 'react';

const Modal = ({ onClose, children }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-gray-800 text-white p-6 rounded-lg max-w-md w-full">
        {children}
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;

