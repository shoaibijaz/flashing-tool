import React from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
}) => {
  return (
    <div className="absolute bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex flex-col gap-1 z-20">
      {/* Zoom In */}
      <button
        onClick={onZoomIn}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Zoom In"
      >
        <ZoomIn size={18} className="text-gray-700" />
      </button>
      
      {/* Zoom Level Display */}
      <div className="px-2 py-1 text-xs text-gray-600 text-center min-w-[60px]">
        {Math.round(zoom * 100)}%
      </div>
      
      {/* Zoom Out */}
      <button
        onClick={onZoomOut}
        className="p-2 hover:bg-gray-100 rounded transition-colors"
        title="Zoom Out"
      >
        <ZoomOut size={18} className="text-gray-700" />
      </button>
    </div>
  );
};

export default ZoomControls;
