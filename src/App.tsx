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
    handleRightClickDragMove,
    handleRightClickDragEnd
  } = usePan(isDrawingMode);

  // Initialize with default drawing if none exists
  useEffect(() => {
    if (Object.keys(drawings).length === 0) {
      handleCreateDrawing();
    }
  }, [drawings, handleCreateDrawing]);

  return (
    <div className="app-fullscreen">
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
                lines={activeDrawing.lines}
                polyPoints={polyPoints}
                hoverPoint={hoverPoint}
                zoom={zoom}
                panX={panX}
                panY={panY}
                isDrawingMode={isDrawingMode}
                isLocked={activeDrawing.locked}
                onStageClickPoly={handleStageClick}
                onStageMouseMovePoly={handleStageMouseMove}
                onStageMouseLeavePoly={handleStageMouseLeave}
                onPointDragMove={handlePointDrag}
                onFinishedLinePointDrag={handleFinishedLinePointDrag}
                onLabelDragMove={handleLabelDragMove}
                onAngleLabelDragMove={handleAngleLabelDragMove}
                onContextMenuPoly={handleContextMenu}
                onWheel={handleWheel}
                onRightClickDragStart={handleRightClickDragStart}
                onRightClickDragMove={handleRightClickDragMove}
                onRightClickDragEnd={handleRightClickDragEnd}
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
