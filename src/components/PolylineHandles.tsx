import React from 'react';
import { Circle } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Point } from '../types';

interface PolylineHandlesProps {
  points: Point[];
  onDragMove: (idx: number, e: KonvaEventObject<DragEvent>) => void;
  draggable?: boolean;
}

const PolylineHandles: React.FC<PolylineHandlesProps> = ({ points, onDragMove, draggable = true }) => (
  <>
    {points.map((pt, i) => (
      <Circle
        key={i}
        x={pt.x}
        y={pt.y}
        radius={6}
        fill="#2563eb"
        draggable={draggable}
        onDragMove={draggable ? (e) => onDragMove(i, e) : undefined}
        stroke="#fff"
        strokeWidth={2}
        shadowBlur={4}
        cursor={draggable ? 'pointer' : 'default'}
      />
    ))}
  </>
);

export default PolylineHandles;
