import React, { useRef } from 'react';
import { Stage, Layer, Line, Circle, Text, Rect } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Stage as StageType } from 'konva/lib/Stage';
import useSettingsStore from '../store/settingsStore';
import type { Line as LineType, Point } from '../types/core';
import { calculateDistance, calculateMidpoint, formatLength, calculateInteriorAngle, calculateAngleLabelPosition, formatAngle } from '../utils/geometry';

export interface Canvas2DProps {
  width: number;
  height: number;
  zoom: number;
  panX: number;
  panY: number;
  polyPoints: Point[];
  hoverPoint: Point | null;
  isDrawingMode: boolean;
  activeDrawing: LineType | null;
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
  onLabelDragMove: (lineIdx: number, segmentIdx: number, e: KonvaEventObject<DragEvent>) => void;
  onAngleLabelDragMove: (lineIdx: number, vertexIdx: number, e: KonvaEventObject<DragEvent>) => void;
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
  activeDrawing,
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
  const { settings } = useSettingsStore();

  // Render grid
  const renderGrid = () => {
    if (!settings.canvas.showGrid) return null;

    const gridLines: React.ReactNode[] = [];
    const gridSize = settings.canvas.gridSize;
    const gridOpacity = settings.canvas.gridOpacity;
    
    // Vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      gridLines.push(
        <Line
          key={`grid-v-${x}`}
          points={[x, 0, x, height]}
          stroke={settings.appearance.darkMode ? '#333' : '#e0e0e0'}
          strokeWidth={0.5}
          opacity={gridOpacity}
          listening={false}
        />
      );
    }
    
    // Horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      gridLines.push(
        <Line
          key={`grid-h-${y}`}
          points={[0, y, width, y]}
          stroke={settings.appearance.darkMode ? '#333' : '#e0e0e0'}
          strokeWidth={0.5}
          opacity={gridOpacity}
          listening={false}
        />
      );
    }
    
    return gridLines;
  };

  // Render segment length labels
  const renderSegmentLabels = (line: LineType, lineIdx?: number) => {
    if (!settings.canvas.showLengthBubbles || line.points.length < 2) return null;

    const labelElements: React.ReactNode[] = [];
    
    for (let i = 0; i < line.points.length - 1; i++) {
      const startPoint = line.points[i];
      const endPoint = line.points[i + 1];
      const distance = calculateDistance(startPoint, endPoint);
      const midpoint = calculateMidpoint(startPoint, endPoint);
      
      // Use custom position if available, otherwise use calculated midpoint
      const hasCustomPosition = line.labelPositions && 
                               i < line.labelPositions.length && 
                               line.labelPositions[i] !== null;
      
      const labelPosition = hasCustomPosition 
        ? line.labelPositions![i]! 
        : midpoint;
      
      // Ensure position is within reasonable bounds and properly rounded for Chrome
      const clampedPosition = {
        x: Math.round(Math.max(-1000, Math.min(10000, labelPosition.x))),
        y: Math.round(Math.max(-1000, Math.min(10000, labelPosition.y)))
      };
      
      const lengthText = formatLength(distance, settings.precision.lengthDecimals);
      
      // Calculate rotation angle to align with segment
      const deltaX = endPoint.x - startPoint.x;
      const deltaY = endPoint.y - startPoint.y;
      let rotation = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      
      // Keep text readable by flipping if upside down
      if (rotation > 90 || rotation < -90) {
        rotation += 180;
      }
      
      // Text styling - ensure consistent sizing across browsers
      const fontSize = Math.max(8, Math.min(14, 12 / zoom));
      const textWidth = Math.ceil(lengthText.length * fontSize * 0.6);
      const textHeight = Math.ceil(fontSize + 8);
      
      // Calculate bubble dimensions
      const bubbleWidth = Math.ceil(textWidth + 8);
      const bubbleHeight = Math.ceil(textHeight);
      
      // Determine if this label should be draggable (only for finished lines)
      const isDraggable = !isLocked && lineIdx !== undefined;
      
      // Background bubble for length - Chrome optimized
      labelElements.push(
        <Rect
          key={`${line.id}-length-bg-${i}`}
          x={clampedPosition.x}
          y={clampedPosition.y}
          width={bubbleWidth}
          height={bubbleHeight}
          fill="rgba(0, 0, 0, 0.8)"
          cornerRadius={bubbleHeight / 2}
          offsetX={bubbleWidth / 2}
          offsetY={bubbleHeight / 2}
          rotation={rotation}
          perfectDrawEnabled={false}
          shadowColor="rgba(0, 0, 0, 0.3)"
          shadowBlur={2}
          shadowOffset={{ x: 1, y: 1 }}
          draggable={isDraggable}
          onDragMove={isDraggable ? (e) => {
            const pos = e.target.position();
            onLabelDragMove(lineIdx!, i, {
              ...e,
              target: { ...e.target, position: () => pos }
            } as KonvaEventObject<DragEvent>);
          } : undefined}
          listening={isDraggable}
        />
      );
      
      // Length text - Chrome optimized
      labelElements.push(
        <Text
          key={`${line.id}-length-text-${i}`}
          x={clampedPosition.x}
          y={clampedPosition.y}
          text={lengthText}
          fontSize={fontSize}
          fill="white"
          fontFamily="Arial, sans-serif"
          fontStyle="bold"
          align="center"
          verticalAlign="middle"
          offsetX={textWidth / 2}
          offsetY={fontSize / 2}
          rotation={rotation}
          perfectDrawEnabled={false}
          shadowColor="rgba(0, 0, 0, 0.5)"
          shadowBlur={1}
          draggable={isDraggable}
          onDragMove={isDraggable ? (e) => {
            const pos = e.target.position();
            onLabelDragMove(lineIdx!, i, {
              ...e,
              target: { ...e.target, position: () => pos }
            } as KonvaEventObject<DragEvent>);
          } : undefined}
          listening={isDraggable}
        />
      );
    }
    
    return labelElements;
  };

  // Render angle labels for line vertices - Chrome-optimized version
  const renderAngleLabels = (line: LineType, lineIdx?: number) => {
    if (!settings.canvas.showAngles || line.points.length < 3) return null;

    const angleElements: React.ReactNode[] = [];
    
    // Render angles for interior vertices (skip first and last points)
    for (let i = 1; i < line.points.length - 1; i++) {
      const prevPoint = line.points[i - 1];
      const currentPoint = line.points[i];
      const nextPoint = line.points[i + 1];
      
      // The vertex index for the angleLabelPositions array (0-based for interior vertices)
      const vertexIdx = i - 1;
      
      const angle = calculateInteriorAngle(prevPoint, currentPoint, nextPoint);
      const defaultPosition = calculateAngleLabelPosition(prevPoint, currentPoint, nextPoint, 40);
      
      // Use custom position if available, otherwise use calculated position
      const hasCustomPosition = line.angleLabelPositions && 
                               vertexIdx < line.angleLabelPositions.length && 
                               line.angleLabelPositions[vertexIdx] !== null;
      
      const labelPosition = hasCustomPosition 
        ? line.angleLabelPositions![vertexIdx]! 
        : defaultPosition;
      
      // Ensure position is within reasonable bounds and properly rounded for Chrome
      const clampedPosition = {
        x: Math.round(Math.max(-1000, Math.min(10000, labelPosition.x))),
        y: Math.round(Math.max(-1000, Math.min(10000, labelPosition.y)))
      };
      
      const angleText = formatAngle(angle, settings.precision.angleDecimals);
      
      // Text styling - ensure consistent sizing across browsers
      const fontSize = Math.max(10, Math.min(16, 14 / zoom));
      const textWidth = Math.ceil(angleText.length * fontSize * 0.7);
      const textHeight = Math.ceil(fontSize * 1.2);
      
      // Calculate bubble dimensions with padding
      const bubbleWidth = Math.ceil(textWidth + 16);
      const bubbleHeight = Math.ceil(textHeight + 12);
      
      // Determine if this label should be draggable (only for finished lines)
      const isDraggable = !isLocked && lineIdx !== undefined;
      
      // Background bubble for angle - Chrome optimized
      angleElements.push(
        <Rect
          key={`${line.id}-angle-bg-${vertexIdx}`}
          x={clampedPosition.x}
          y={clampedPosition.y}
          width={bubbleWidth}
          height={bubbleHeight}
          fill="rgba(0, 0, 139, 0.9)"
          stroke="rgba(173, 216, 230, 0.8)"
          strokeWidth={1}
          cornerRadius={4}
          offsetX={bubbleWidth / 2}
          offsetY={bubbleHeight / 2}
          perfectDrawEnabled={false}
          shadowColor="rgba(0, 0, 0, 0.3)"
          shadowBlur={2}
          shadowOffset={{ x: 1, y: 1 }}
          draggable={isDraggable}
          onDragMove={isDraggable ? (e) => {
            const pos = e.target.position();
            onAngleLabelDragMove(lineIdx!, vertexIdx, {
              ...e,
              target: { ...e.target, position: () => pos }
            } as KonvaEventObject<DragEvent>);
          } : undefined}
          listening={isDraggable}
        />
      );
      
      // Angle text - Chrome optimized
      angleElements.push(
        <Text
          key={`${line.id}-angle-text-${vertexIdx}`}
          x={clampedPosition.x}
          y={clampedPosition.y}
          text={angleText}
          fontSize={fontSize}
          fill="white"
          fontFamily="Arial, sans-serif"
          fontStyle="bold"
          align="center"
          verticalAlign="middle"
          offsetX={bubbleWidth / 2}
          offsetY={bubbleHeight / 2}
          perfectDrawEnabled={false}
          shadowColor="rgba(0, 0, 0, 0.5)"
          shadowBlur={1}
          draggable={isDraggable}
          onDragMove={isDraggable ? (e) => {
            const pos = e.target.position();
            onAngleLabelDragMove(lineIdx!, vertexIdx, {
              ...e,
              target: { ...e.target, position: () => pos }
            } as KonvaEventObject<DragEvent>);
          } : undefined}
          listening={isDraggable}
        />
      );
    }
    
    return angleElements;
  };

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
        <Layer listening={false}>
          {renderGrid()}
        </Layer>

        {/* Drawing Layer */}
        <Layer>
          {/* Finished lines */}
          {drawings.map((line, lineIdx) => (
            <React.Fragment key={line.id}>
              {/* Line segments */}
              <Line
                points={line.points.flatMap(p => [p.x, p.y])}
                stroke={line.color || settings.appearance.lineColor}
                strokeWidth={settings.appearance.lineWidth}
                lineCap="round"
                lineJoin="round"
                perfectDrawEnabled={false}
              />
              
              {/* Points */}
              {line.points.map((point, pointIdx) => (
                <Circle
                  key={`${line.id}-point-${pointIdx}`}
                  x={point.x}
                  y={point.y}
                  radius={Math.max(3, settings.appearance.pointSize * 0.8)}
                  fill={settings.appearance.highlightColor}
                  stroke={settings.appearance.lineColor}
                  strokeWidth={1}
                  draggable={!isLocked}
                  onDragMove={(e) => {
                    if (!isLocked) {
                      onFinishedLinePointDrag(lineIdx, pointIdx, e);
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (!isLocked) {
                      e.target.scaleX(1.3);
                      e.target.scaleY(1.3);
                      e.target.getLayer()?.batchDraw();
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLocked) {
                      e.target.scaleX(1);
                      e.target.scaleY(1);
                      e.target.getLayer()?.batchDraw();
                    }
                  }}
                />
              ))}
              
              {/* Segment length labels */}
              {renderSegmentLabels(line, lineIdx)}
              
              {/* Angle labels */}
              {renderAngleLabels(line, lineIdx)}
            </React.Fragment>
          ))}

          {/* Polyline preview points - only show during drawing */}
          {isDrawingMode && polyPoints.map((point, index) => (
            <Circle
              key={`poly-${index}`}
              x={point.x}
              y={point.y}
              radius={Math.max(3, settings.appearance.pointSize * 0.8)}
              fill={settings.appearance.highlightColor}
              stroke={settings.appearance.lineColor}
              strokeWidth={1}
              draggable={!isLocked}
              onDragMove={(e) => {
                if (!isLocked) {
                  onPointDrag(index, e);
                }
              }}
            />
          ))}

          {/* Preview line segments for current polyline */}
          {isDrawingMode && polyPoints.length >= 1 && (
            <React.Fragment>
              {/* Lines between existing points */}
              {polyPoints.length >= 2 && (
                <React.Fragment>
                  <Line
                    points={polyPoints.flatMap(p => [p.x, p.y])}
                    stroke={settings.appearance.lineColor}
                    strokeWidth={settings.appearance.lineWidth}
                    lineCap="round"
                    lineJoin="round"
                    perfectDrawEnabled={false}
                  />
                  
                  {/* Length labels for preview line */}
                  {renderSegmentLabels({
                    id: 'preview-line',
                    points: polyPoints,
                    color: settings.appearance.lineColor
                  })}
                  
                  {/* Angle labels for preview line */}
                  {polyPoints.length >= 3 && renderAngleLabels({
                    id: 'preview-line',
                    points: polyPoints,
                    color: settings.appearance.lineColor
                  })}
                </React.Fragment>
              )}
              
              {/* Preview line from last point to hover point */}
              {hoverPoint && polyPoints.length >= 1 && (
                <Line
                  points={[
                    polyPoints[polyPoints.length - 1].x,
                    polyPoints[polyPoints.length - 1].y,
                    hoverPoint.x,
                    hoverPoint.y
                  ]}
                  stroke={settings.appearance.lineColor}
                  strokeWidth={settings.appearance.lineWidth}
                  dash={[5, 5]}
                  lineCap="round"
                  opacity={0.7}
                  perfectDrawEnabled={false}
                />
              )}
            </React.Fragment>
          )}

          {/* Hover point - only show in drawing mode */}
          {hoverPoint && isDrawingMode && (
            <Circle
              x={hoverPoint.x}
              y={hoverPoint.y}
              radius={Math.max(3, settings.appearance.pointSize * 0.8)}
              fill={settings.appearance.highlightColor}
              opacity={0.6}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas2D;
