import PreviewLayer from './PreviewLayer';
import CanvasDialogs from './dialogs/CanvasDialogs';
import React, { useState } from 'react';
// Layout and UI imports (all unused imports removed)
import { Stage, Layer, Line as KonvaLine } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Point, Line } from '../types';
import ZoomControls from './ZoomControls';
import PolylineLayer from './PolylineLayer';

interface Canvas2DProps {
  width: number;
  height: number;
  mode: 'polyline';
  lines: Line[];
  linesState: Line[];
  setLinesState?: (lines: Line[]) => void;
  polyPoints: Point[];
  hoverPoint: Point | null;
  // drawing: boolean; // removed, not used
  onStageClickPoly: (e: KonvaEventObject<MouseEvent>) => void;
  onStageMouseMovePoly: (e: KonvaEventObject<MouseEvent>) => void;
  onStageMouseLeavePoly: () => void;
  onPointDragMove: (idx: number, e: KonvaEventObject<DragEvent>) => void;
  onFinishedLinePointDrag: (lineIdx: number, ptIdx: number, e: KonvaEventObject<DragEvent>) => void;
  onContextMenuPoly: (e: KonvaEventObject<MouseEvent>) => void;
}

// --- Canvas2D main component ---
const Canvas2D: React.FC<Canvas2DProps> = (props) => {
  // Destructure props
  const {
    width,
    height,
    mode,
    linesState,
    polyPoints,
    hoverPoint,
    onStageClickPoly,
    onStageMouseMovePoly,
    onStageMouseLeavePoly,
    onPointDragMove,
    onFinishedLinePointDrag,
    onContextMenuPoly,
  } = props;

  // --- Zoom state ---
  const [zoom, setZoom] = useState(1);
  const minZoom = 0.2;
  const maxZoom = 3;
  const zoomStep = 0.1;

  // Optional: handle wheel zoom
  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const oldZoom = zoom;
    let newZoom = oldZoom;
    if (e.evt.deltaY < 0) {
      newZoom = Math.min(maxZoom, oldZoom * scaleBy);
    } else {
      newZoom = Math.max(minZoom, oldZoom / scaleBy);
    }
    setZoom(newZoom);
  };

  // --- Grid rendering ---
  const gridSpacing = 20; // px, narrower grid
  const gridColor = '#f3f3f3'; // very light gray
  const gridLines: React.ReactNode[] = [];
  for (let x = 0; x <= width; x += gridSpacing) {
    gridLines.push(
      <KonvaLine
        key={`grid-x-${x}`}
        points={[x, 0, x, height]}
        stroke={gridColor}
        strokeWidth={1}
        listening={false}
      />
    );
  }
  for (let y = 0; y <= height; y += gridSpacing) {
    gridLines.push(
      <KonvaLine
        key={`grid-y-${y}`}
        points={[0, y, width, y]}
        stroke={gridColor}
        strokeWidth={1}
        listening={false}
      />
    );
  }

  // Store label drag offsets: { [lineIdx-segIdx]: {dx, dy} }
  const [labelOffsets, setLabelOffsets] = useState<Record<string, {dx: number, dy: number}>>({});
  // Store angle label drag offsets: { [lineIdx-vertexIdx]: {dx: number, dy: number} }
  const [angleLabelOffsets, setAngleLabelOffsets] = useState<Record<string, {dx: number, dy: number}>>({});
  // Helper to get offset key
  const getLabelKey = (lineIdx: number, segIdx: number) => `${lineIdx}-${segIdx}`;
  const getAngleLabelKey = (lineIdx: number, vertexIdx: number) => `angle-${lineIdx}-${vertexIdx}`;

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-white overflow-hidden">
      <ZoomControls zoom={zoom} setZoom={setZoom} minZoom={minZoom} maxZoom={maxZoom} zoomStep={zoomStep} />
      <div className="relative flex items-center justify-center w-full h-full">
        <Stage
          width={width}
          height={height}
          className="block max-w-full max-h-full"
          style={{ background: 'white' }}
          scaleX={zoom}
          scaleY={zoom}
          onWheel={handleWheel}
          onClick={onStageClickPoly}
          onMouseMove={onStageMouseMovePoly}
          onMouseLeave={onStageMouseLeavePoly}
          onContextMenu={onContextMenuPoly}
        >
          {/* Grid Layer: always rendered at bottom */}
          <Layer listening={false}>{gridLines}</Layer>
          <Layer>
            <PolylineLayer
              linesState={linesState}
              mode={mode}
              setLabelOffsets={setLabelOffsets}
              setAngleLabelOffsets={setAngleLabelOffsets}
              labelOffsets={labelOffsets}
              angleLabelOffsets={angleLabelOffsets}
              getLabelKey={getLabelKey}
              getAngleLabelKey={getAngleLabelKey}
              onFinishedLinePointDrag={onFinishedLinePointDrag}
            />
            <PreviewLayer
              polyPoints={polyPoints}
              hoverPoint={hoverPoint}
              onPointDragMove={onPointDragMove}
            />
          </Layer>
        </Stage>
      </div>
      <CanvasDialogs />
    </div>
  );
};

export default Canvas2D;
