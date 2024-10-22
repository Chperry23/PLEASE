// frontend/src/components/OverviewCard.js

import React from 'react';
import { Link } from 'react-router-dom';

const OverviewCard = ({ title, count, link }) => (
  <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
    <div className="px-4 py-5 sm:p-6">
      <h3 className="text-lg leading-6 font-medium text-white">{title}</h3>
      <div className="mt-2 text-3xl font-semibold text-white">{count}</div>
      <div className="mt-4">
        <Link to={link} className="text-blue-400 hover:text-blue-300">
          View all {title.toLowerCase()}
        </Link>
      </div>
    </div>
  </div>
);

export default OverviewCard;
