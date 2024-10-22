import React from 'react';

const ChallengeList = ({ challenges }) => {
  return (
    <ul className="space-y-2">
      {challenges.map((challenge, index) => (
        <li key={index} className="flex items-center">
          <input 
            type="checkbox" 
            checked={challenge.completed} 
            readOnly 
            className="mr-2"
          />
          <span className={challenge.completed ? 'line-through' : ''}>
            {challenge.description}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default ChallengeList;