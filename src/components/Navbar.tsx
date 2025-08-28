import React from 'react';

interface NavbarProps {
  isDrawingMode?: boolean;
  canFinishDrawing?: boolean;
  onFinishDrawing?: () => void;
  onClearDrawing?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  isDrawingMode = false, 
  canFinishDrawing = false, 
  onFinishDrawing, 
  onClearDrawing 
}) => {
  return (
    <nav className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-10 relative">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold text-gray-900">
          Flashing Creator
        </h1>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Clear button - always visible */}
        {onClearDrawing && (
          <button
            onClick={onClearDrawing}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Clear
          </button>
        )}
        
        {/* Finish button - only in drawing mode with 2+ points */}
        {isDrawingMode && canFinishDrawing && onFinishDrawing && (
          <button
            onClick={onFinishDrawing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Finish
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
