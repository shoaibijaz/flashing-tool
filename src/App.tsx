import { useEffect } from 'react';
import Canvas2D from './components/Canvas2D';
import Navbar from './components/Navbar';
import ZoomControls from './components/ZoomControls';
import CanvasToolbar from './components/CanvasToolbar';
import { useDrawing } from './hooks/useDrawing';
import { useZoom } from './hooks/useZoom';
import { usePan } from './hooks/usePan';
import './App.css';

function App() {
  const {
    // State
    polyPoints,
    hoverPoint,
    isDrawingMode,
    activeDrawing,
    drawings,

    // Handlers
    handleCreateDrawing,
    handleStageClick,
    handleStageMouseMove,
    handleStageMouseLeave,
    handlePointDrag,
    handleFinishedLinePointDrag,
    handleContextMenu,
    finishDrawing,
    clearDrawing,
    toggleLock,

    // Computed
    canFinishDrawing
  } = useDrawing();

  const {
    zoom,
    handleZoomIn,
    handleZoomOut,
    handleWheel
  } = useZoom();

  const {
    panX,
    panY,
    handleRightClickDragStart,
    handleRightClickDragEnd
  } = usePan(isDrawingMode);

  // Initialize with default drawing if none exists
  useEffect(() => {
    if (Object.keys(drawings).length === 0) {
      handleCreateDrawing();
    }
  }, [drawings, handleCreateDrawing]);

  // Get all finished lines from the active drawing  
  // During drawing mode, exclude the current line being drawn (which is the last line)
  const finishedLines = isDrawingMode
    ? (activeDrawing?.lines.slice(0, -1) || []) // Exclude last line during drawing
    : (activeDrawing?.lines || []); // Show all lines when not drawing

  return (
    <div className={`app-fullscreen ${isDrawingMode ? 'drawing-mode' : ''}`}>
      <Navbar
        isDrawingMode={isDrawingMode}
        canFinishDrawing={canFinishDrawing}
        onFinishDrawing={finishDrawing}
        onClearDrawing={clearDrawing}
      />
      <div
        style={{
          flex: 1,
          width: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
        className="bg-white dark:bg-gray-900"
        id="canvas-container"
      >
        {activeDrawing ? (
          <>
            <Canvas2D
              zoom={zoom}
              panX={panX}
              panY={panY}
              polyPoints={polyPoints}
              hoverPoint={hoverPoint}
              isDrawingMode={isDrawingMode}
              drawings={finishedLines}
              isLocked={activeDrawing.locked}
              onStageClick={handleStageClick}
              onStageMouseMove={handleStageMouseMove}
              onStageMouseLeave={handleStageMouseLeave}
              onStageWheel={handleWheel}
              onStageMouseDown={handleRightClickDragStart}
              onStageMouseUp={handleRightClickDragEnd}
              onContextMenu={handleContextMenu}
              onPointDrag={handlePointDrag}
              onFinishedLinePointDrag={handleFinishedLinePointDrag}
            />
          </>
        ) : (
          <div className="loading">
            <p>Initializing canvas...</p>
          </div>
        )}

        {/* Fixed positioned controls outside the canvas container */}
        {activeDrawing && (
          <>
            <ZoomControls
              zoom={zoom}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
            />
            <CanvasToolbar
              isLocked={activeDrawing.locked}
              onLockClick={toggleLock}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
