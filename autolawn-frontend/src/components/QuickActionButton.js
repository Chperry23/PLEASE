// frontend/src/components/QuickActionButton.js

import React from 'react';
import { Link } from 'react-router-dom';

const QuickActionButton = ({ to, icon: Icon, text }) => (
  <Link
    to={to}
    className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 flex items-center justify-center"
  >
    <Icon className="h-5 w-5 mr-2" />
    {text}
  </Link>
);

export default QuickActionButton;
