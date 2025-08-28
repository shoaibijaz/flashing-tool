import { useEffect } from 'react';
import Canvas2D from './components/Canvas2D';
import Navbar from './components/Navbar';
import ZoomControls from './components/ZoomControls';
import CanvasToolbar from './components/CanvasToolbar';
import { useDrawing } from './hooks/useDrawing';
import { useZoom } from './hooks/useZoom';
import { usePan } from './hooks/usePan';
import { useCanvasDimensions } from './hooks/useCanvasDimensions';
import './App.css';

function App() {
  const { dimensions, containerRef } = useCanvasDimensions();
  
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
    handleLabelDragMove,
    handleAngleLabelDragMove,
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

  // Create active drawing line for preview
  const activeDrawingLine = isDrawingMode && polyPoints.length >= 1 ? {
    id: 'temp-line',
    points: polyPoints,
    color: activeDrawing?.lines[0]?.color || '#60a5fa'
  } : null;

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
      <div ref={containerRef} className="flex-1 relative w-full" style={{ height: 'calc(100vh - 48px)' }}>
        {activeDrawing ? (
          <>
            <div className="absolute inset-0 w-full h-full">
              <Canvas2D 
                width={dimensions.width}
                height={dimensions.height}
                zoom={zoom}
                panX={panX}
                panY={panY}
                polyPoints={polyPoints}
                hoverPoint={hoverPoint}
                isDrawingMode={isDrawingMode}
                activeDrawing={activeDrawingLine}
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
                onLabelDragMove={handleLabelDragMove}
                onAngleLabelDragMove={handleAngleLabelDragMove}
              />
            </div>
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
        ) : (
          <div className="loading">
            <p>Initializing canvas...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
