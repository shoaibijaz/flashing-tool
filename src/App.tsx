import { useEffect, useCallback } from 'react';
import { Box } from '@radix-ui/themes';
import Canvas2D from './components/Canvas2D';
import Navbar from './components/Navbar';
import ZoomControls from './components/ZoomControls';
import CanvasToolbar from './components/CanvasToolbar';
import { useDrawing } from './hooks/useDrawing';
import { useZoom } from './hooks/useZoom';
import { usePan } from './hooks/usePan';
import useTaperedStore from './store/taperedStore';
import type { KonvaEventObject } from 'konva/lib/Node';
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
    isPanning,
    handleRightClickDragStart,
    handleRightClickDragMove,
    handleRightClickDragEnd
  } = usePan(isDrawingMode);

  // Get tapered store state
  const { clearTaperedDiagram } = useTaperedStore();

  // Combined mouse move handler for both pan and drawing
  const handleCombinedMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    // Handle pan drag movement first
    handleRightClickDragMove(e);
    // Then handle drawing hover
    handleStageMouseMove(e);
  }, [handleRightClickDragMove, handleStageMouseMove]);

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

  // Check if there's a finished drawing (for tapered creation)
  const hasFinishedDrawing = !isDrawingMode && (activeDrawing?.lines?.length ?? 0) > 0;

  // Enhanced clear function that also clears tapered diagrams
  const handleClearAll = () => {
    clearTaperedDiagram();
    clearDrawing();
  };

  return (
    <Box className={`app-fullscreen ${isDrawingMode ? 'drawing-mode' : ''}`}> 
      <Navbar
        isDrawingMode={isDrawingMode}
        canFinishDrawing={canFinishDrawing}
        onFinishDrawing={finishDrawing}
        onClearDrawing={handleClearAll}
        hasFinishedDrawing={hasFinishedDrawing}
        currentDrawing={activeDrawing || undefined}
      />
      <Box
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
              isPanning={isPanning}
              onStageClick={handleStageClick}
              onStageMouseMove={handleCombinedMouseMove}
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
          <Box className="loading">
            <p>Initializing canvas...</p>
          </Box>
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

      </Box>
    </Box>
  );
}

export default App;
