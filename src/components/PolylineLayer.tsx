import React from 'react';
import { Line as KonvaLine } from 'react-konva';
import PolylineHandles from './PolylineHandles';
import EndpointHandle from './EndpointHandle';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Line } from '../types';

import SegmentLabels from './SegmentLabels';
import AngleLabels from './AngleLabels';
import { resolveCollisions } from '../utils/labelCollision';
import type { LabelDescriptor } from '../utils/labelCollision';
import { getSegmentLength } from '../utils/geometryUtils';

export interface PolylineLayerProps {
  linesState: Line[];
  activeDiagram: 'original' | 'tapered';
  setLabelOffsets: React.Dispatch<React.SetStateAction<Record<string, { dx: number; dy: number }>>>;
  setAngleLabelOffsets: React.Dispatch<React.SetStateAction<Record<string, { dx: number; dy: number }>>>;
  labelOffsets: Record<string, { dx: number; dy: number }>;
  angleLabelOffsets: Record<string, { dx: number; dy: number }>;
  getLabelKey: (lineIdx: number, segIdx: number) => string;
  getAngleLabelKey: (lineIdx: number, vertexIdx: number) => string;
  onFinishedLinePointDrag: (lineIdx: number, ptIdx: number, e: KonvaEventObject<DragEvent>) => void;
  }

import { useDialogStore } from '../store/dialogStore';
import EndFoldLabel from './EndFoldLabel';
const PolylineLayer: React.FC<PolylineLayerProps> = ({
  linesState,
  activeDiagram,
  setLabelOffsets,
  setAngleLabelOffsets,
  labelOffsets,
  angleLabelOffsets,
  getLabelKey,
  getAngleLabelKey,
  onFinishedLinePointDrag,
  // diagramOffset removed
}) => {
  // Endpoint state now handled by EndFoldLabel only

  // Precompute resolved offsets per line by combining segment and angle descriptors
  const resolvedOffsetsPerLine = React.useMemo(() => {
    const map: Record<number, Record<string, { dx: number; dy: number }>> = {};
    const LABEL_X_OFFSET = 6;
    const LABEL_Y_OFFSET = 22;
    for (let li = 0; li < linesState.length; li++) {
      const line = linesState[li];
      const descriptors: LabelDescriptor[] = [];
      // segments
      for (let i = 1; i < line.points.length; i++) {
        const p1 = line.points[i - 1];
        const p2 = line.points[i];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const segLen = getSegmentLength(p1, p2);
        const label = segLen.toFixed(1) + ' px';
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const labelKey = getLabelKey(li, i);
        let angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;
        if (angleDeg > 90 || angleDeg < -90) angleDeg += 180;
        descriptors.push({
          id: labelKey,
          type: 'segment',
          anchor: { x: midX + LABEL_X_OFFSET, y: midY - LABEL_Y_OFFSET },
          rotation: angleDeg,
          text: label,
          fontSize: 12,
          priority: 0,
          preferredOffset: labelOffsets[labelKey] || { dx: 0, dy: 0 }
        });
      }
      // angle labels
      for (let i = 2; i < line.points.length; i++) {
        const a = line.points[i - 2];
        const b = line.points[i - 1];
        const c = line.points[i];
        let signedAngle = 0;
        try { signedAngle = (Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)) * 180 / Math.PI; } catch { signedAngle = 0; }
        const raw = ((signedAngle % 360) + 360) % 360;
        const displayAngle = raw > 180 ? 360 - raw : raw;
        const angleLabel = displayAngle.toFixed(1) + '°';
        const angleLabelKey = getAngleLabelKey(li, i - 1);
        descriptors.push({
          id: angleLabelKey,
          type: 'angle',
          anchor: { x: b.x + LABEL_X_OFFSET + 18, y: b.y - LABEL_Y_OFFSET - 18 },
          rotation: 0,
          text: angleLabel,
          fontSize: 13,
          priority: 10,
          preferredOffset: angleLabelOffsets[angleLabelKey] || { dx: 0, dy: 0 }
        });
      }

      const mergedExisting = { ...labelOffsets, ...angleLabelOffsets };
      try {
        const res = resolveCollisions(descriptors, mergedExisting);
        map[li] = res;
      } catch (err) {
        console.error('resolveCollisions failed', err);
        map[li] = {};
      }
    }
    return map;
  }, [linesState, labelOffsets, angleLabelOffsets, getLabelKey, getAngleLabelKey]);

  return (
    <>
      {linesState.length > 0 && linesState.map((line, lineIdx) => (
        line.points.length > 1 && (
          <React.Fragment key={line.id}>
            <KonvaLine
              points={line.points.flatMap((p) => [
                p.x || 0,
                p.y || 0
              ])}
              stroke={line.color}
              strokeWidth={3}
              lineCap="round"
              lineJoin="round"
            />
            {[0, line.points.length - 1].map((idx) => (
              <EndpointHandle
                key={`add-segment-handle-circle-${idx}`}
                x={line.points[idx].x}
                y={line.points[idx].y}
                draggable={activeDiagram === 'original'}
                onClick={(e) => {
                  if (activeDiagram !== 'original') return;
                  e.evt?.stopPropagation?.();
                  e.cancelBubble = true;
                  useDialogStore.getState().openDialog('endpoint', {
                    anchor: { x: line.points[idx].x, y: line.points[idx].y },
                    end: idx === 0 ? 'start' : 'end',
                    length: '',
                    angle: '',
                    lineIdx,
                  });
                }}
                onDragMove={activeDiagram === 'original' ? (e: KonvaEventObject<DragEvent>) => {
                  onFinishedLinePointDrag(lineIdx, idx, e);
                } : undefined}
                onMouseEnter={(e: KonvaEventObject<MouseEvent>) => {
                  const stage = e.target.getStage();
                  if (stage && stage.container()) {
                    stage.container().style.cursor = activeDiagram === 'original' ? 'pointer' : 'default';
                  }
                }}
                onMouseLeave={(e: KonvaEventObject<MouseEvent>) => {
                  const stage = e.target.getStage();
                  if (stage && stage.container()) {
                    stage.container().style.cursor = 'default';
                  }
                }}
              />
            ))}
            <SegmentLabels
              line={line}
              lineIdx={lineIdx}
              labelOffsets={labelOffsets}
              setLabelOffsets={setLabelOffsets}
              getLabelKey={getLabelKey}
              resolvedOffsets={resolvedOffsetsPerLine[lineIdx]}
            />
            <AngleLabels
              line={line}
              lineIdx={lineIdx}
              angleLabelOffsets={angleLabelOffsets}
              setAngleLabelOffsets={setAngleLabelOffsets}
              getAngleLabelKey={getAngleLabelKey}
              resolvedOffsets={resolvedOffsetsPerLine[lineIdx]}
              activeDiagram={activeDiagram}
            />
            {line.points.length > 1 && activeDiagram === 'original' && (
              <PolylineHandles
                  points={line.points.slice(1, -1)}
                onDragMove={(ptIdx, e) => onFinishedLinePointDrag(lineIdx, ptIdx + 1, e)}
                draggable={true}
              />
            )}
          </React.Fragment>
        )
      ))}
      {/* Add EndFoldLabel for both endpoints */}
      <EndFoldLabel which="first" />
      <EndFoldLabel which="last" />
    </>
  );
};

export default PolylineLayer;
