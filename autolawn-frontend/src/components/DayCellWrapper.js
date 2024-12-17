import React from 'react';
import { useDrop } from 'react-dnd';

const DayCellWrapper = ({ children, value, onJobDrop }) => {
  const [{ isOver, canDrop }, dropRef] = useDrop({
    accept: 'JOB', // Ensure the 'JOB' type matches the drag item's type
    canDrop: () => true,
    drop: (item) => {
      console.log('Dropped job:', item.job, 'on date:', value);
      if (onJobDrop && item.job && value) {
        onJobDrop(item.job, value);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={dropRef}
      className={`h-full w-full ${
        isOver && canDrop ? 'bg-blue-100 border-2 border-blue-500' : ''
      }`}
      style={{ position: 'relative', minHeight: '100%' }}
    >
      {children}
      {isOver && canDrop && (
        <div
          className="absolute inset-0 bg-blue-100 border-2 border-blue-500 rounded pointer-events-none"
          style={{ zIndex: 1 }}
        />
      )}
    </div>
  );
};

export default DayCellWrapper;
