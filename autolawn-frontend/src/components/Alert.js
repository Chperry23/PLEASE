// src/components/Alert.js
import React from 'react';

const Alert = ({ type, message }) => {
  const alertType = type === 'error' ? 'alert-error' : 'alert-success';

  return (
    <div className={`alert ${alertType} p-4 mb-4 text-sm`}>
      {message}
    </div>
  );
};

export default Alert;
