import React from 'react';

interface DrawingLabelProps {
  isTaperedCreated: boolean;
  activeDiagram: 'original' | 'tapered';
}

const DrawingLabel: React.FC<DrawingLabelProps> = ({ isTaperedCreated, activeDiagram }) => {
  if (!isTaperedCreated) return null;
  return (
    <div className="absolute top-2 right-4 z-20 flex flex-col items-end pointer-events-auto select-none min-w-[160px]">
      {activeDiagram === 'original' ? (
        <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded shadow cursor-pointer whitespace-nowrap">
          NEAR - Drawing 1
        </span>
      ) : (
        <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded shadow cursor-pointer whitespace-nowrap">
          FAR - Drawing 2
        </span>
      )}
    </div>
  );
};

export default DrawingLabel;
