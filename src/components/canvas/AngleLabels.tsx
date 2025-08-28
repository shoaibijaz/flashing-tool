import React from 'react';
import { Text, Rect, Group } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import useSettingsStore from '../../store/settingsStore';
import type { Line as LineType } from '../../types/core';
import { calculateInteriorAngle, calculateAngleLabelPosition, formatAngle } from '../../utils/geometry';

interface AngleLabelsProps {
  line: LineType;
  onAngleLabelDragMove?: (lineId: string, vertexIndex: number, e: KonvaEventObject<DragEvent>) => void;
}

const AngleLabels: React.FC<AngleLabelsProps> = ({ line, onAngleLabelDragMove }) => {
  const { settings } = useSettingsStore();

  // Use default values if settings are not properly loaded
  const showAngles = settings.canvas?.showAngles ?? true;
  const angleDecimals = settings.precision?.angleDecimals ?? 1;
  
  if (!showAngles || line.points.length < 3) return null;

  const angleElements: React.ReactNode[] = [];
  
  // Render angles for interior vertices (skip first and last points)
  for (let i = 1; i < line.points.length - 1; i++) {
    const prevPoint = line.points[i - 1];
    const currentPoint = line.points[i];
    const nextPoint = line.points[i + 1];
    
    const angle = calculateInteriorAngle(prevPoint, currentPoint, nextPoint);
    const defaultPosition = calculateAngleLabelPosition(prevPoint, currentPoint, nextPoint, 40);
    
    const angleText = formatAngle(angle, angleDecimals);
    
    // Use custom position if available, otherwise use default calculated position
    const customPosition = line.angleLabelPositions?.[i - 1]; // i-1 because we skip first point
    const labelX = customPosition?.x ?? defaultPosition.x;
    const labelY = customPosition?.y ?? defaultPosition.y;
    
    angleElements.push(
      <Group
        key={`${line.id}-angle-${i}`}
        x={labelX}
        y={labelY}
        draggable={true}
        onDragMove={(e) => {
          if (onAngleLabelDragMove) {
            onAngleLabelDragMove(line.id, i - 1, e); // i-1 because we skip first point
          }
        }}
      >
        <Rect
          x={-20}
          y={-10}
          width={40}
          height={20}
          fill="blue"
          stroke="darkblue"
          strokeWidth={1}
          cornerRadius={10}
        />
        <Text
          x={-20}
          y={-10}
          width={40}
          height={20}
          text={angleText}
          fontSize={10}
          fill="white"
          fontFamily="Arial"
          fontStyle="bold"
          align="center"
          verticalAlign="middle"
        />
      </Group>
    );
  }
  
  return <>{angleElements}</>;
};

export default AngleLabels;
