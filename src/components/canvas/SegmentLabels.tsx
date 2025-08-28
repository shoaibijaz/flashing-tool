import React from 'react';
import { Text, Rect, Group } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import useSettingsStore from '../../store/settingsStore';
import type { Line as LineType } from '../../types/core';
import { calculateDistance, calculateMidpoint, formatLength } from '../../utils/geometry';

interface SegmentLabelsProps {
  line: LineType;
  onLabelDragMove?: (lineId: string, segmentIndex: number, e: KonvaEventObject<DragEvent>) => void;
}

const SegmentLabels: React.FC<SegmentLabelsProps> = ({ line, onLabelDragMove }) => {
  const { settings } = useSettingsStore();

  // Use default values if settings are not properly loaded
  const showLengthBubbles = settings.canvas?.showLengthBubbles ?? true;
  const lengthDecimals = settings.precision?.lengthDecimals ?? 2;

  // Check if length bubbles should be shown
  if (!showLengthBubbles) {
    return null;
  }

  if (line.points.length < 2) {
    return null;
  }

  const labelElements: React.ReactNode[] = [];
  
  for (let i = 0; i < line.points.length - 1; i++) {
    const startPoint = line.points[i];
    const endPoint = line.points[i + 1];
    const distance = calculateDistance(startPoint, endPoint);
    const midpoint = calculateMidpoint(startPoint, endPoint);
    
    // Calculate the angle of the line segment in degrees
    const deltaX = endPoint.x - startPoint.x;
    const deltaY = endPoint.y - startPoint.y;
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    
    // Normalize angle to keep text readable (always right-side up)
    // If the angle would make text upside down, flip it 180 degrees
    if (angle > 90) {
      angle -= 180;
    } else if (angle < -90) {
      angle += 180;
    }
    
    const lengthText = formatLength(distance, lengthDecimals);
    
    // Use custom position if available, otherwise use midpoint
    const customPosition = line.labelPositions?.[i];
    const labelX = customPosition?.x ?? midpoint.x;
    const labelY = customPosition?.y ?? midpoint.y;
    
    labelElements.push(
      <Group 
        key={`${line.id}-label-${i}`} 
        x={labelX} 
        y={labelY}
        rotation={angle}
        draggable={true}
        onDragMove={(e) => {
          if (onLabelDragMove) {
            onLabelDragMove(line.id, i, e);
          }
        }}
      >
        <Rect
          x={-25}
          y={-12}
          width={50}
          height={24}
          fill="black"
          stroke="darkgray"
          strokeWidth={1}
          cornerRadius={12}
        />
        <Text
          x={-25}
          y={-12}
          width={50}
          height={24}
          text={lengthText}
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
  
  return <>{labelElements}</>;
};

export default SegmentLabels;
