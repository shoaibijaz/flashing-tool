import React from 'react';
import { Stage, Layer, Line as KonvaLine } from 'react-konva';
import PolylineHandles from './PolylineHandles';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Point, Line } from '../types';

interface Canvas2DProps {
  width: number;
  height: number;
  mode: 'polyline' | 'freehand';
  lines: Line[];
  linesState: Line[];
  polyPoints: Point[];
  hoverPoint: Point | null;
  freePoints: Point[];
  drawing: boolean;
  onStageClickPoly: (e: KonvaEventObject<MouseEvent>) => void;
  onStageMouseMovePoly: (e: KonvaEventObject<MouseEvent>) => void;
  onStageMouseLeavePoly: () => void;
  onPointDragMove: (idx: number, e: KonvaEventObject<DragEvent>) => void;
  onFinishedLinePointDrag: (lineIdx: number, ptIdx: number, e: KonvaEventObject<DragEvent>) => void;
  onFinishedLinePointDragEnd: (lineIdx: number, ptIdx: number, e: KonvaEventObject<DragEvent>) => void;
  onStageMouseDownFree: (e: KonvaEventObject<MouseEvent>) => void;
  onStageMouseMoveFree: (e: KonvaEventObject<MouseEvent>) => void;
  onStageMouseUpFree: () => void;
  onContextMenuPoly: (e: KonvaEventObject<MouseEvent>) => void;
}

const Canvas2D: React.FC<Canvas2DProps> = ({
  width,
  height,
  mode,
  linesState,
  polyPoints,
  hoverPoint,
  freePoints,
  drawing,
  onStageClickPoly,
  onStageMouseMovePoly,
  onStageMouseLeavePoly,
  onPointDragMove,
  onFinishedLinePointDrag,
  onFinishedLinePointDragEnd,
  onStageMouseDownFree,
  onStageMouseMoveFree,
  onStageMouseUpFree,
  onContextMenuPoly,
}) => (
  <Stage
    width={width}
    height={height}
    className="w-full h-auto"
    style={{ maxWidth: '100%' }}
    onClick={mode === 'polyline' ? onStageClickPoly : undefined}
    onMouseMove={mode === 'polyline' ? onStageMouseMovePoly : undefined}
    onMouseLeave={mode === 'polyline' ? onStageMouseLeavePoly : undefined}
    onContextMenu={mode === 'polyline' ? onContextMenuPoly : undefined}
    onMouseDown={mode === 'freehand' ? onStageMouseDownFree : undefined}
    onMousemove={mode === 'freehand' ? onStageMouseMoveFree : undefined}
    onMouseup={mode === 'freehand' ? onStageMouseUpFree : undefined}
  >
    <Layer>
      {linesState.length > 0 && linesState.map((line, lineIdx) => (
        line.points.length > 1 && (
          <React.Fragment key={line.id}>
            <KonvaLine
              points={line.points.flatMap((p) => [p.x, p.y])}
              stroke={line.color}
              strokeWidth={3}
              lineCap="round"
              lineJoin="round"
            />
            <PolylineHandles
              points={line.points}
              onDragMove={(ptIdx, e) => onFinishedLinePointDrag(lineIdx, ptIdx, e)}
              draggable={mode === 'polyline'}
            />
          </React.Fragment>
        )
      ))}
      {/* Polyline preview */}
      {mode === 'polyline' && polyPoints.length > 0 && (
        <>
          <KonvaLine
            points={polyPoints.flatMap((p) => [p.x, p.y])}
            stroke="#60a5fa"
            strokeWidth={3}
            lineCap="round"
            lineJoin="round"
            dash={[8, 8]}
          />
          {/* Hover preview line */}
          {hoverPoint && (
            <KonvaLine
              points={
                polyPoints.length > 0
                  ? [polyPoints.slice(-1)[0].x, polyPoints.slice(-1)[0].y, hoverPoint.x, hoverPoint.y]
                  : []
              }
              stroke="#60a5fa"
              strokeWidth={2}
              dash={[4, 4]}
            />
          )}
          {polyPoints.length > 0 && (
            <PolylineHandles points={polyPoints} onDragMove={onPointDragMove} draggable />
          )}
        </>
      )}
      {/* Preview for freehand mode */}
      {mode === 'freehand' && freePoints.length > 1 && (
        <KonvaLine
          points={freePoints.flatMap((p) => [p.x, p.y])}
          stroke="#60a5fa"
          strokeWidth={3}
          lineCap="round"
          lineJoin="round"
        />
      )}
    </Layer>
  </Stage>
);

export default Canvas2D;
