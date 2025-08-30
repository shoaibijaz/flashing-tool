import React from 'react';
import useTaperedStore from '../store/taperedStore';
import type { Drawing } from '../types/core';

interface NavbarProps {
  isDrawingMode?: boolean;
  canFinishDrawing?: boolean;
  onFinishDrawing?: () => void;
  onClearDrawing?: () => void;
  hasFinishedDrawing?: boolean;
  currentDrawing?: Drawing; // Current drawing data for creating tapered
}

const Navbar: React.FC<NavbarProps> = ({
  isDrawingMode = false,
  canFinishDrawing = false,
  onFinishDrawing,
  onClearDrawing,
  hasFinishedDrawing = false,
  currentDrawing
}) => {
  const {
    canvasMode,
    activeTaperedDiagram,
    createTaperedDiagram,
    switchToOriginal,
    switchToTapered,
    clearTaperedDiagram
  } = useTaperedStore();

  const handleCreateTapered = () => {
    if (currentDrawing && currentDrawing.lines && currentDrawing.lines.length > 0) {
      const lastLine = currentDrawing.lines[currentDrawing.lines.length - 1];
      createTaperedDiagram(lastLine, currentDrawing.id);
    }
  };

  const handleSwitchMode = () => {
    if (canvasMode === 'original') {
      switchToTapered();
    } else {
      switchToOriginal();
    }
  };

  const canCreateTapered = hasFinishedDrawing && !isDrawingMode && (currentDrawing?.lines?.length ?? 0) > 0;
  const showTaperedControls = activeTaperedDiagram !== null;

  return (
    <nav className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-10 relative">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold text-gray-900">
          Flashing Creator
        </h1>
        {/* Mode indicator */}
        {canvasMode === 'tapered' && (
          <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
            Tapered Mode
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Tapered diagram controls */}
        {showTaperedControls && (
          <>
            <button
              onClick={handleSwitchMode}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${canvasMode === 'original'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
            >
              {canvasMode === 'original' ? 'View Tapered' : 'View Original'}
            </button>
            <button
              onClick={() => clearTaperedDiagram()}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors text-sm font-medium"
            >
              Clear Tapered
            </button>
          </>
        )}

        {/* Create tapered button - only show when original has finished drawing */}
        {canCreateTapered && !showTaperedControls && (
          <button
            onClick={handleCreateTapered}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Create Tapered
          </button>
        )}

        {/* Clear button - always visible */}
        {onClearDrawing && (
          <button
            onClick={() => {
              if (showTaperedControls) {
                clearTaperedDiagram();
              }
              onClearDrawing();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Clear All
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
