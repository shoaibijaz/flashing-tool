import React, { useRef } from 'react';
import { Stage, Layer } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Stage as StageType } from 'konva/lib/Stage';
import type { Line as LineType, Point } from '../types/core';
import { GridLayer, FinishedLines, DrawingPreview } from './canvas';

export interface Canvas2DProps {
  width: number;
  height: number;
  zoom: number;
  panX: number;
  panY: number;
  polyPoints: Point[];
  hoverPoint: Point | null;
  isDrawingMode: boolean;
  drawings: LineType[];
  isLocked: boolean;
  onStageClick: (e: KonvaEventObject<MouseEvent>) => void;
  onStageMouseMove: (e: KonvaEventObject<MouseEvent>) => void;
  onStageMouseLeave: () => void;
  onStageWheel: (e: KonvaEventObject<WheelEvent>) => void;
  onStageMouseDown: (e: KonvaEventObject<MouseEvent>) => void;
  onStageMouseUp: (e: KonvaEventObject<MouseEvent>) => void;
  onContextMenu: (e: KonvaEventObject<MouseEvent>) => void;
  onPointDrag: (pointIndex: number, e: KonvaEventObject<DragEvent>) => void;
  onFinishedLinePointDrag: (lineIdx: number, pointIdx: number, e: KonvaEventObject<DragEvent>) => void;
  onLabelDragMove?: (lineId: string, segmentIndex: number, e: KonvaEventObject<DragEvent>) => void;
  onAngleLabelDragMove?: (lineId: string, vertexIndex: number, e: KonvaEventObject<DragEvent>) => void;
}

const Canvas2D: React.FC<Canvas2DProps> = ({
  width,
  height,
  zoom,
  panX,
  panY,
  polyPoints,
  hoverPoint,
  isDrawingMode,
  drawings,
  isLocked,
  onStageClick,
  onStageMouseMove,
  onStageMouseLeave,
  onStageWheel,
  onStageMouseDown,
  onStageMouseUp,
  onContextMenu,
  onPointDrag,
  onFinishedLinePointDrag,
  onLabelDragMove,
  onAngleLabelDragMove,
}) => {
  const stageRef = useRef<StageType>(null);

  return (
    <div className="absolute inset-0 w-full h-full bg-white dark:bg-gray-900 overflow-hidden">
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={zoom}
        scaleY={zoom}
        x={panX}
        y={panY}
        onWheel={onStageWheel}
        onClick={onStageClick}
        onMouseMove={onStageMouseMove}
        onMouseLeave={onStageMouseLeave}
        onMouseDown={onStageMouseDown}
        onMouseUp={onStageMouseUp}
        onContextMenu={onContextMenu}
      >
        {/* Grid Layer */}
        <GridLayer width={width} height={height} />

        {/* Drawing Layer */}
        <Layer>
          {/* Finished lines */}
          <FinishedLines
            drawings={drawings}
            isLocked={isLocked}
            onFinishedLinePointDrag={onFinishedLinePointDrag}
            onLabelDragMove={onLabelDragMove}
            onAngleLabelDragMove={onAngleLabelDragMove}
          />

          {/* Drawing preview */}
          <DrawingPreview
            isDrawingMode={isDrawingMode}
            polyPoints={polyPoints}
            hoverPoint={hoverPoint}
            isLocked={isLocked}
            onPointDrag={onPointDrag}
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas2D;
