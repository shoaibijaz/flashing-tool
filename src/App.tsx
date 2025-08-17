import { useState, useEffect, useRef } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useDrawingStore } from './store/drawingStore';
import { GetNewPositionByAngleLength } from './utils/geometryUtils';
import Canvas2D from './components/Canvas2D';
import AppLayout from './components/AppLayout';
import './App.css';

function App() {
  // Zustand store hooks and state
  const lines = useDrawingStore((s) => s.lines);
  const addLine = useDrawingStore((s) => s.addLine);
  const clear = useDrawingStore((s) => s.clear);
  const setLines = useDrawingStore((s) => s.setLines);
  const redo = useDrawingStore((s) => s.redo);
  const setFirstEndpoint = useDrawingStore((s) => s.setFirstEndpoint);
  const setLastEndpoint = useDrawingStore((s) => s.setLastEndpoint);

  // Local UI state
  const mode = 'polyline';
  const [polyPoints, setPolyPoints] = useState<{ x: number; y: number }[]>([]);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null);
  const [activeTool, setActiveTool] = useState<string>('shapes');

  // Responsive canvas width and height using ResizeObserver
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);

  // Remove linesState, always use global lines

  // Responsive canvas width and height using ResizeObserver
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const resizeObserver = new window.ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          setCanvasWidth(entry.contentRect.width);
          setCanvasHeight(entry.contentRect.height);
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
    if (e.evt.button !== 0) return;
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

  function handleFinishedLinePointDrag(lineIdx: number, ptIdx: number, e: KonvaEventObject<DragEvent>) {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    if (lines.length === 0) {
      setLines([]);
      return;
    }
    // Build new lines array so we can compute folds after updating coordinates
    const newLines = lines.map((line, i) =>
      i === lineIdx
        ? { ...line, points: line.points.map((pt, j) => (j === ptIdx ? pos : pt)) }
        : line
    );
    setLines(newLines);

    // If moved first/second point and a startFold is present, recompute its fold points
    try {
      const line = newLines[lineIdx];
      const lastIndex = line.points.length - 1;

      if ((ptIdx === 0 || ptIdx === 1) && line.startFold) {
        const A = line.points[0];
        const B = line.points[1];
        const segEdits = line.startFold.segmentEdits || {};
        const segCount = Object.keys(segEdits).length;
        const pts = [A];
        for (let i = 0; i < segCount; i++) {
          const { Length, Angle } = segEdits[i];
          let newPt;
          if (i === 0) {
            // First segment: use B -> A
            newPt = GetNewPositionByAngleLength(B.x, B.y, A.x, A.y, Length, Angle);
          } else {
            const prev = pts[pts.length - 2] || pts[0];
            const curr = pts[pts.length - 1];
            newPt = GetNewPositionByAngleLength(prev.x, prev.y, curr.x, curr.y, Length, Angle);
          }
          pts.push(newPt);
        }
        // highlight recomputed fold then clear highlight after short delay
        setFirstEndpoint(pts, 0, true);
        setTimeout(() => setFirstEndpoint(pts, 0, false), 1200);
      }

      // If moved last or second-to-last point and an endFold is present, recompute its fold points
      if ((ptIdx === lastIndex || ptIdx === lastIndex - 1) && line.endFold) {
        const startPt = line.points[lastIndex];
        const segEdits = line.endFold.segmentEdits || {};
        const segCount = Object.keys(segEdits).length;
        const pts = [startPt];
        for (let i = 0; i < segCount; i++) {
          const { Length, Angle } = segEdits[i];
          const prevIdx = pts.length - 2;
          const p0 = pts[prevIdx] || pts[0];
          const p1 = pts[pts.length - 1];
          const newPt = GetNewPositionByAngleLength(p0.x, p0.y, p1.x, p1.y, Length, Angle);
          pts.push(newPt);
        }
        setLastEndpoint(pts, lastIndex, true);
        setTimeout(() => setLastEndpoint(pts, lastIndex, false), 1200);
      }
    } catch (err) {
      console.error('Error updating fold endpoints after point drag', err);
    }
  }
  // Remove handleFinishedLinePointDragEnd, not needed

  function handleUndo() {
    if (polyPoints.length > 0) {
      setPolyPoints((pts) => pts.slice(0, -1));
    } else if (lines.length > 0) {
      const lastLine = lines[lines.length - 1];
      if (lastLine.points.length > 1) {
        const newLines = lines.slice(0, -1).concat({ ...lastLine, points: lastLine.points.slice(0, -1) });
        setLines(newLines);
      } else {
        setLines([]);
      }
    }
  }

  // --- Render ---
  return (
    <AppLayout
      onFinish={finishPolyline}
      onUndo={handleUndo}
      onRedo={redo}
      onClear={clear}
      onToolSelect={setActiveTool}
      activeTool={activeTool}
    >
      <div ref={containerRef} className="w-full h-full flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
        {canvasWidth > 0 && canvasHeight > 0 && (
          <Canvas2D
            width={canvasWidth}
            height={canvasHeight}
            mode={mode}
            lines={lines}
            linesState={lines}
            setLinesState={setLines}
            polyPoints={polyPoints}
            hoverPoint={hoverPoint}
            onStageClickPoly={handleStageClickPoly}
            onStageMouseMovePoly={handleStageMouseMovePoly}
            onStageMouseLeavePoly={handleStageMouseLeavePoly}
            onPointDragMove={handlePointDragMove}
            onFinishedLinePointDrag={handleFinishedLinePointDrag}
            onContextMenuPoly={(e) => { e.evt.preventDefault(); finishPolyline(); }}
          />
        )}
        {/* Debug panel: absolute, bottom right of viewport */}
        <div className="bg-gray-200 fixed bottom-6 right-6 w-72 p-2 dark:bg-gray-900 rounded-xl text-xs text-gray-700 dark:text-gray-200 shadow-xl border border-gray-300 dark:border-gray-700" style={{fontFamily:'monospace',maxHeight:120,overflow:'auto',zIndex:50}}>
          <div><b>lines:</b> {JSON.stringify(lines)}</div>
          <div><b>polyPoints:</b> {JSON.stringify(polyPoints)}</div>
          <div><b>hoverPoint:</b> {JSON.stringify(hoverPoint)}</div>
        </div>
      </div>
    </AppLayout>
  );
}

export default App;
