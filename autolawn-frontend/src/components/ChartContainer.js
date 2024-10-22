// frontend/src/components/ChartContainer.js

import React from 'react';

const ChartContainer = ({ title, children }) => (
  <div className="bg-gray-800 p-4 rounded-lg shadow mb-8">
    <h3 className="text-lg leading-6 font-medium mb-4 text-white">{title}</h3>
    <div className="h-64">{children}</div>
  </div>
);

export default ChartContainer;
