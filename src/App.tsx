
import './App.css';
import { useState, useEffect, useRef } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useDrawingStore } from './store/drawingStore';
import Canvas2D from './components/Canvas2D';
import Toolbar from './components/Toolbar';

function App() {
  // All hooks and state must be declared only once at the top level
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const height = 300;
  const lines = useDrawingStore((s) => s.lines);
  const addLine = useDrawingStore((s) => s.addLine);
  const clear = useDrawingStore((s) => s.clear);
  const setLines = useDrawingStore((s) => s.setLines);
  const undo = useDrawingStore((s) => s.undo);
  // const redo = useDrawingStore((s) => s.redo); // Redo feature not needed for now
  const history = useDrawingStore((s) => s.history);
  // const future = useDrawingStore((s) => s.future);
  const [mode, setMode] = useState<'polyline' | 'freehand'>('polyline');
  const [polyPoints, setPolyPoints] = useState<{ x: number; y: number }[]>([]);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null);
  const [freePoints, setFreePoints] = useState<{ x: number; y: number }[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [linesState, setLinesState] = useState(lines);

  // Update linesState when lines change (for finished lines editing)
  useEffect(() => {
    // Always force clear all local state if lines is empty
    if (lines.length === 0) {
      setLinesState([]);
      setHoverPoint(null);
      setFreePoints([]);
      setPolyPoints([]);
      setDrawing(false);
    } else {
      setLinesState(lines);
    }
  }, [lines]);

  // Responsive canvas width using ResizeObserver
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const resizeObserver = new window.ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width > 0) {
          setCanvasWidth(entry.contentRect.width);
        }
      }
    });
    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, []);

  // --- Polyline Mode ---
  function handlePointDragMove(idx: number, e: KonvaEventObject<DragEvent>) {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    setPolyPoints((pts) => pts.map((pt, i) => (i === idx ? pos : pt)));
  }
  function handleStageClickPoly(e: KonvaEventObject<MouseEvent>) {
    // Prevent left click if it's a right click
    if (e.evt.button !== 0) return;
    // Only allow adding points if currently drawing a polyline
    if (polyPoints.length === 0 && lines.length > 0) return;
    const pointer = e.target.getStage()?.getPointerPosition();
    if (!pointer) return;
    setPolyPoints((pts) => [...pts, pointer]);
    setHoverPoint(null);
  }
  function handleStageMouseMovePoly(e: KonvaEventObject<MouseEvent>) {
    const pointer = e.target.getStage()?.getPointerPosition();
    if (!pointer) return;
    setHoverPoint(pointer);
  }
  function handleStageMouseLeavePoly() {
    setHoverPoint(null);
  }
  function finishPolyline() {
    if (polyPoints.length > 1) {
      addLine({
        id: Date.now().toString(),
        points: polyPoints,
        color: '#60a5fa',
      });
    }
    setPolyPoints([]);
    setHoverPoint(null);
  }

  // --- Freehand Mode ---
  function handleStageMouseDownFree(e: KonvaEventObject<MouseEvent>) {
    const pointer = e.target.getStage()?.getPointerPosition();
    if (!pointer) return;
    setFreePoints([pointer]);
    setDrawing(true);
  }
  function handleStageMouseMoveFree(e: KonvaEventObject<MouseEvent>) {
    if (!drawing) return;
    const pointer = e.target.getStage()?.getPointerPosition();
    if (!pointer) return;
    setFreePoints((pts) => [...pts, pointer]);
  }
  function handleStageMouseUpFree() {
    if (freePoints.length > 1) {
      addLine({
        id: Date.now().toString(),
        points: freePoints,
        color: '#60a5fa',
      });
    }
    setFreePoints([]);
    setDrawing(false);
  }
  function handleFinishedLinePointDrag(lineIdx: number, ptIdx: number, e: KonvaEventObject<DragEvent>) {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    // Only allow dragging if there are lines
    if (lines.length === 0) {
      setLinesState([]); // force clear any stray handles
      return;
    }
    setLinesState((prev) =>
      prev.map((line, i) =>
        i === lineIdx
          ? { ...line, points: line.points.map((pt, j) => (j === ptIdx ? pos : pt)) }
          : line
      )
    );
  }
  function handleFinishedLinePointDragEnd(lineIdx: number, ptIdx: number, e: KonvaEventObject<DragEvent>) {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    // Only allow updating if there are lines
    if (lines.length === 0) {
      setLinesState([]); // force clear any stray handles
      return;
    }
    // Update Zustand store with history
    const updated = linesState.map((line, i) =>
      i === lineIdx
        ? { ...line, points: line.points.map((pt, j) => (j === ptIdx ? pos : pt)) }
        : line
    );
    setLines(updated);
  }

  // --- Custom Undo: Remove last polyline segment if drawing, else normal undo ---
  function handleUndo() {
    console.log('Undo action triggered',polyPoints, lines, hoverPoint);
    if (mode === 'polyline' && polyPoints.length > 0) {
      // While drawing: remove last point from polyPoints
      setPolyPoints((pts) => pts.slice(0, -1));
    } else if (lines.length > 0) {
      // After finishing: remove last point from last line, or remove line if only one point
      const lastLine = lines[lines.length - 1];
      if (lastLine.points.length > 1) {
        const newLines = lines.slice(0, -1).concat({ ...lastLine, points: lastLine.points.slice(0, -1) });
        setLines(newLines);
      } else {
        // Only one point left, remove the whole line
        setLines([]);
        setLinesState([]); // Immediately clear linesState to avoid ghost handle
      }
    }
    // else: nothing to undo
  }

  // --- Render ---
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between h-14 px-4 shadow-md bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg text-blue-600 dark:text-blue-400">Flashing Creator</span>
          <span className="text-xs text-gray-500 ml-2">Modern 2D/3D App</span>
        </div>
        <Toolbar
          mode={mode}
          setMode={(m) => {
            setMode(m);
            setPolyPoints([]);
            setFreePoints([]);
            setDrawing(false);
          }}
          onClear={clear}
          onFinishPolyline={finishPolyline}
          canFinishPolyline={mode === 'polyline' && polyPoints.length > 1}
          onUndo={handleUndo}
          // onRedo={redo} // Redo feature not needed for now
          canUndo={
            (mode === 'polyline' && polyPoints.length > 0) ||
            (lines.length > 0 && (polyPoints.length === 0))
          }
          // canRedo={future.length > 0} // Redo feature not needed for now
        />
      </header>
      {/* Main Area: Canvas fills most of screen */}
      <main className="flex-1 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="w-full h-full max-w-7xl flex-1 flex items-center justify-center px-2 md:px-8">
          <div className="relative w-full h-[80vh] md:h-[90vh] flex items-center justify-center">
            <div
              ref={containerRef}
              className="w-full h-full rounded-2xl shadow-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 flex items-center justify-center"
              style={{ minHeight: 320 }}
            >
              {canvasWidth > 0 && (
                <Canvas2D
                  width={canvasWidth}
                  height={height}
                  mode={mode}
                  lines={lines}
                  linesState={linesState}
                  polyPoints={polyPoints}
                  hoverPoint={hoverPoint}
                  freePoints={freePoints}
                  drawing={drawing}
                  onStageClickPoly={handleStageClickPoly}
                  onStageMouseMovePoly={handleStageMouseMovePoly}
                  onStageMouseLeavePoly={handleStageMouseLeavePoly}
                  onPointDragMove={handlePointDragMove}
                  onFinishedLinePointDrag={handleFinishedLinePointDrag}
                  onFinishedLinePointDragEnd={handleFinishedLinePointDragEnd}
                  onStageMouseDownFree={handleStageMouseDownFree}
                  onStageMouseMoveFree={handleStageMouseMoveFree}
                  onStageMouseUpFree={handleStageMouseUpFree}
                  onContextMenuPoly={(e) => { e.evt.preventDefault(); finishPolyline(); }}
                />
              )}
            </div>
            {/* Floating debug panel (optional, can be removed for production) */}
            <div className="absolute bottom-2 right-2 w-72 p-2 bg-gray-200 dark:bg-gray-900 rounded text-xs text-gray-700 dark:text-gray-200 shadow-lg" style={{fontFamily:'monospace',maxHeight:120,overflow:'auto'}}>
              <div><b>lines:</b> {JSON.stringify(lines)}</div>
              <div><b>linesState:</b> {JSON.stringify(linesState)}</div>
              <div><b>polyPoints:</b> {JSON.stringify(polyPoints)}</div>
              <div><b>freePoints:</b> {JSON.stringify(freePoints)}</div>
              <div><b>hoverPoint:</b> {JSON.stringify(hoverPoint)}</div>
              <div><b>drawing:</b> {JSON.stringify(drawing)}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
