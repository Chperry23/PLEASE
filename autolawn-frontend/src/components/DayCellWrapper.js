// src/components/DayCellWrapper.js
import React from 'react';
import { useDrop } from 'react-dnd';

const DayCellWrapper = ({ children, value, onJobDrop }) => {
  const [{ isOver, canDrop }, dropRef] = useDrop(() => ({
    accept: 'JOB',
    canDrop: () => true,
    drop: (item, monitor) => {
      console.log('Drop detected: ', item, 'on date:', value);
      if (onJobDrop && item.job && value) {
        onJobDrop(item.job, value);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  }));

  return (
    <div 
      ref={dropRef} 
      className={`h-full w-full ${isOver && canDrop ? 'bg-blue-100/20' : ''}`}
      style={{ position: 'relative' }}
    >
      {children}
      {isOver && canDrop && (
        <div 
          className="absolute inset-0 border-2 border-blue-500 rounded pointer-events-none"
          style={{ zIndex: 1 }}
        />
      )}
    </div>
  );
};

export default DayCellWrapper;
