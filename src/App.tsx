import { useState, useEffect, useRef } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useDrawingStore } from './store/drawingStore';

import Canvas2D from './components/Canvas2D';
import AppLayout from './components/AppLayout';
import './App.css';


import type { Line } from './types';

function deepCopyLines(lines: Line[]): Line[] {
  return lines.map(line => ({
    ...line,
    points: line.points.map(pt => ({ ...pt })),
    startFold: line.startFold ? { 
      ...line.startFold, 
      segmentEdits: { ...line.startFold.segmentEdits } 
    } : undefined,
    endFold: line.endFold ? { 
      ...line.endFold, 
      segmentEdits: { ...line.endFold.segmentEdits } 
    } : undefined,
  }));
}

function App() {
  // Zustand store hooks and state (for original only)
  const linesStore = useDrawingStore((s) => s.lines);
  const addLine = useDrawingStore((s) => s.addLine);
  const clear = useDrawingStore((s) => s.clear);
  const setLines = useDrawingStore((s) => s.setLines);
  const redo = useDrawingStore((s) => s.redo);

  // Diagrams state
  const [originalLines, setOriginalLines] = useState<Line[]>([]);
  const [taperedLines, setTaperedLines] = useState<Line[] | null>(null);
  const [activeDiagram, setActiveDiagram] = useState<'original' | 'tapered'>('original');
  const [isTaperedCreated, setIsTaperedCreated] = useState(false);

  // Local UI state
  // const mode = 'polyline'; // unused
  const [polyPoints, setPolyPoints] = useState<{ x: number; y: number }[]>([]);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null);
  const [activeTool, setActiveTool] = useState<string>('shapes');

  // Responsive canvas width and height using ResizeObserver
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);

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

  // Keep originalLines in sync with store lines ONLY when on 'original' diagram
  useEffect(() => {
    if (activeDiagram === 'original') {
      setOriginalLines(linesStore);
    }
  }, [linesStore, activeDiagram]);

  // Only update the store when switching diagrams, not on every local state change
  const prevDiagramRef = useRef(activeDiagram);
  useEffect(() => {
    if (prevDiagramRef.current !== activeDiagram) {
      if (activeDiagram === 'original') {
        setLines(originalLines);
      } else if (activeDiagram === 'tapered' && taperedLines) {
        setLines(taperedLines);
      }
      prevDiagramRef.current = activeDiagram;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDiagram]);

  // --- Polyline Mode ---
  function handlePointDragMove(idx: number, e: KonvaEventObject<DragEvent>) {
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;
    setPolyPoints((pts) => pts.map((pt, i) => (i === idx ? pos : pt)));
  }
  function handleStageClickPoly(e: KonvaEventObject<MouseEvent>) {
    if (e.evt.button !== 0) return;
    if (polyPoints.length === 0 && linesStore.length > 0) return;
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
  const currentLines = activeDiagram === 'original' ? originalLines : taperedLines || [];
    if (currentLines.length === 0) {
      setLines([]);
      return;
    }

    let newLines;
    if (activeDiagram === 'tapered' && originalLines[lineIdx]) {
      // Constrain movement to original angle for tapered
      const origLine = originalLines[lineIdx];
      const taperedLine = currentLines[lineIdx];
      // Only allow for interior points (not endpoints)
      // Endpoints: ptIdx === 0 (first) or ptIdx === last (last)
      const lastIdx = taperedLine.points.length - 1;
      if (ptIdx === 0 || ptIdx === lastIdx) {
        // Prevent dragging endpoints in tapered mode
        newLines = currentLines;
      } else {
        // For all interior points, constrain drag to original angle from previous point
        const prev = taperedLine.points[ptIdx - 1];
        const origPrev = origLine.points[ptIdx - 1];
        const origPt = origLine.points[ptIdx];
        // Calculate original angle
        const angle = Math.atan2(origPt.y - origPrev.y, origPt.x - origPrev.x);
        // Project mouse pos onto this angle from prev point
        const dx = pos.x - prev.x;
        const dy = pos.y - prev.y;
        const len = dx * Math.cos(angle) + dy * Math.sin(angle);
        const newX = prev.x + len * Math.cos(angle);
        const newY = prev.y + len * Math.sin(angle);
        newLines = currentLines.map((line, i) =>
          i === lineIdx
            ? { ...line, points: line.points.map((pt, j) => (j === ptIdx ? { x: newX, y: newY } : pt)) }
            : line
        );
      }
    } else {
      // Original: allow free drag
      newLines = currentLines.map((line, i) =>
        i === lineIdx
          ? { ...line, points: line.points.map((pt, j) => (j === ptIdx ? pos : pt)) }
          : line
      );
    }
    setLines(newLines);
    if (activeDiagram === 'original') {
      setOriginalLines(newLines);
    } else {
      setTaperedLines(newLines);
    }

  // No endfold recompute logic needed here
  }

  function handleUndo() {
    if (polyPoints.length > 0) {
      setPolyPoints((pts) => pts.slice(0, -1));
    } else {
      // Undo for active diagram
      if (activeDiagram === 'original' && originalLines.length > 0) {
        setOriginalLines(originalLines.slice(0, -1));
        setLines(originalLines.slice(0, -1));
      } else if (activeDiagram === 'tapered' && taperedLines && taperedLines.length > 0) {
        setTaperedLines(taperedLines.slice(0, -1));
        setLines(taperedLines.slice(0, -1));
      }
    }
  }

  // Tapered toggle logic
  function handleToggleTapered() {
    if (!isTaperedCreated && activeDiagram === 'original') {
      // Create tapered as a copy of original
      setTaperedLines(deepCopyLines(originalLines));
      setIsTaperedCreated(true);
      setActiveDiagram('tapered');
      setLines(deepCopyLines(originalLines));
    } else {
      setActiveDiagram(activeDiagram === 'original' ? 'tapered' : 'original');
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
      isDrawMode={polyPoints.length > 0}
      onToggleTapered={handleToggleTapered}
      isTaperedCreated={isTaperedCreated}
      activeDiagram={activeDiagram}
      hasOriginalDiagram={originalLines.length > 0 && polyPoints.length === 0}
    >
      <div ref={containerRef} className="w-full h-full flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
        {canvasWidth > 0 && canvasHeight > 0 && (
            <Canvas2D
              width={canvasWidth}
              height={canvasHeight}
              lines={activeDiagram === 'original' ? originalLines : taperedLines || []}
              linesState={activeDiagram === 'original' ? originalLines : taperedLines || []}
              setLinesState={activeDiagram === 'original' ? setOriginalLines : setTaperedLines}
              polyPoints={polyPoints}
              hoverPoint={hoverPoint}
              onStageClickPoly={handleStageClickPoly}
              onStageMouseMovePoly={handleStageMouseMovePoly}
              onStageMouseLeavePoly={handleStageMouseLeavePoly}
              onPointDragMove={handlePointDragMove}
              onFinishedLinePointDrag={handleFinishedLinePointDrag}
              onContextMenuPoly={(e) => { e.evt.preventDefault(); finishPolyline(); }}
              activeDiagram={activeDiagram}
              onOriginalLinesChanged={(newLines) => {
                setOriginalLines(newLines);
                if (taperedLines) setTaperedLines(deepCopyLines(newLines));
              }}
            />
        )}
      </div>
    </AppLayout>
  );
}

export default App;
