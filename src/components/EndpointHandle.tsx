import React, { useRef } from 'react';
import { Circle as KonvaCircle, Group } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';

interface EndpointHandleProps {
  x: number;
  y: number;
  onClick: (e: KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onMouseEnter?: (e: KonvaEventObject<MouseEvent>) => void;
  onMouseLeave?: (e: KonvaEventObject<MouseEvent>) => void;
  draggable?: boolean;
  onDragMove?: (e: KonvaEventObject<DragEvent>) => void;
}

const DRAG_CLICK_THRESHOLD = 5; // px

const EndpointHandle: React.FC<EndpointHandleProps> = ({
  x,
  y,
  onClick,
  onMouseEnter,
  onMouseLeave,
  draggable = false,
  onDragMove,
}) => {
  // Track pointer down position
  const pointerDownPos = useRef<{x: number, y: number} | null>(null);
  const pointerMoved = useRef(false);

  return (
    <Group
      x={x}
      y={y}
      draggable={draggable}
      dragBoundFunc={pos => pos}
      onDragMove={draggable && onDragMove ? onDragMove : undefined}
      onPointerDown={e => {
        pointerDownPos.current = { x: e.evt.clientX, y: e.evt.clientY };
        pointerMoved.current = false;
      }}
      onPointerMove={e => {
        if (pointerDownPos.current) {
          const dx = e.evt.clientX - pointerDownPos.current.x;
          const dy = e.evt.clientY - pointerDownPos.current.y;
          if (Math.sqrt(dx*dx + dy*dy) > DRAG_CLICK_THRESHOLD) {
            pointerMoved.current = true;
          }
        }
      }}
      onPointerUp={e => {
        // Only treat as click if pointer did not move
        if (!pointerMoved.current) {
          e.cancelBubble = true;
          if (onClick) onClick(e as KonvaEventObject<MouseEvent>);
        }
        pointerDownPos.current = null;
        pointerMoved.current = false;
      }}
      onDragEnd={() => {
        pointerDownPos.current = null;
        pointerMoved.current = false;
      }}
      onMouseEnter={e => {
        if (onMouseEnter) onMouseEnter(e as KonvaEventObject<MouseEvent>);
        const stage = e.target.getStage();
        if (stage && stage.container()) {
          stage.container().style.cursor = 'pointer';
        }
      }}
      onMouseLeave={e => {
        if (onMouseLeave) onMouseLeave(e as KonvaEventObject<MouseEvent>);
        const stage = e.target.getStage();
        if (stage && stage.container()) {
          stage.container().style.cursor = 'default';
        }
      }}
    >
      <KonvaCircle
        x={0}
        y={0}
        radius={6}
        fill="red"
        stroke={undefined}
        strokeWidth={0}
        listening={true}
        perfectDrawEnabled={true}
        draggable={false}
      />
    </Group>
  );
};

export default EndpointHandle;
