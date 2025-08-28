import React from 'react';
import { Line, Circle } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import useSettingsStore from '../../store/settingsStore';
import type { Point } from '../../types/core';
import SegmentLabels from './SegmentLabels';
import AngleLabels from './AngleLabels';

interface DrawingPreviewProps {
  isDrawingMode: boolean;
  polyPoints: Point[];
  hoverPoint: Point | null;
  isLocked: boolean;
  onPointDrag: (pointIndex: number, e: KonvaEventObject<DragEvent>) => void;
}

const DrawingPreview: React.FC<DrawingPreviewProps> = ({
  isDrawingMode,
  polyPoints,
  hoverPoint,
  isLocked,
  onPointDrag,
}) => {
  const { settings } = useSettingsStore();

  if (!isDrawingMode || polyPoints.length < 1) return null;

  return (
    <>
      {/* Polyline preview points - only show during drawing */}
      {polyPoints.map((point, index) => (
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
      {polyPoints.length >= 2 && (
        <>
          <Line
            points={polyPoints.flatMap(p => [p.x, p.y])}
            stroke={settings.appearance.lineColor}
            strokeWidth={settings.appearance.lineWidth}
            lineCap="round"
            lineJoin="round"
            perfectDrawEnabled={false}
          />
          
          {/* Length labels for preview line */}
          <SegmentLabels 
            line={{
              id: 'preview-line',
              points: polyPoints,
              color: settings.appearance.lineColor
            }} 
          />
          
          {/* Angle labels for preview line */}
          {polyPoints.length >= 3 && (
            <AngleLabels 
              line={{
                id: 'preview-line',
                points: polyPoints,
                color: settings.appearance.lineColor
              }} 
            />
          )}
        </>
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

      {/* Hover point - only show in drawing mode */}
      {hoverPoint && (
        <Circle
          x={hoverPoint.x}
          y={hoverPoint.y}
          radius={Math.max(3, settings.appearance.pointSize * 0.8)}
          fill={settings.appearance.highlightColor}
          opacity={0.6}
        />
      )}
    </>
  );
};

export default DrawingPreview;
