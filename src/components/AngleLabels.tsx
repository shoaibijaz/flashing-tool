import React from 'react';
import { Label as KonvaLabel, Tag as KonvaTag, Text as KonvaText } from 'react-konva';
import type { Point } from '../types';
import { angleAtVertexDegrees, getSegmentLength } from '../utils/geometryUtils';

const LABEL_Y_OFFSET = 22;
const LABEL_X_OFFSET = 6;
const LABEL_BG = 'rgba(0,0,0,0.9)';
const MAX_OFFSET = 2000;

interface AngleLabelsProps {
  line: { id: string; points: Point[]; color: string };
  lineIdx: number;
  angleLabelOffsets: Record<string, { dx: number; dy: number }>;
  setAngleLabelOffsets: React.Dispatch<React.SetStateAction<Record<string, { dx: number; dy: number }>>>;
  getAngleLabelKey: (lineIdx: number, vertexIdx: number) => string;
  resolvedOffsets?: Record<string, { dx: number; dy: number }>;
  activeDiagram?: 'original' | 'tapered';
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const AngleLabels: React.FC<AngleLabelsProps> = (props) => {
  const { line, lineIdx, angleLabelOffsets, setAngleLabelOffsets, getAngleLabelKey, resolvedOffsets, activeDiagram } = props;
  const labels = [];
  for (let i = 2; i < line.points.length; i++) {
    const a = line.points[i - 2];
    const b = line.points[i - 1];
    const c = line.points[i];
    let signedAngle = angleAtVertexDegrees(a, b, c);
    if (isNaN(signedAngle)) signedAngle = 0;
    const raw = ((signedAngle % 360) + 360) % 360;
    const displayAngle = raw > 180 ? 360 - raw : raw;
    const angleLabel = displayAngle.toFixed(1) + '°';
    const angleLabelKey = getAngleLabelKey(lineIdx, i - 1);
    // Prefer user-set offsets over resolved offsets
    const angleOffset = angleLabelOffsets[angleLabelKey] ?? resolvedOffsets?.[angleLabelKey] ?? { dx: 0, dy: 0 };
    const anchorX = b.x + LABEL_X_OFFSET + 18;
    const anchorY = b.y - LABEL_Y_OFFSET - 18;
    labels.push(
      <KonvaLabel
        key={`angle-label-${i}`}
        x={anchorX + angleOffset.dx}
        y={anchorY + angleOffset.dy}
        listening={true}
        draggable
        onDragEnd={e => {
          const newDx = e.target.x() - anchorX;
          const newDy = e.target.y() - anchorY;
          const clampedDx = clamp(newDx, -MAX_OFFSET, MAX_OFFSET);
          const clampedDy = clamp(newDy, -MAX_OFFSET, MAX_OFFSET);
          setAngleLabelOffsets(prev => ({
            ...prev,
            [angleLabelKey]: { dx: clampedDx, dy: clampedDy },
          }));
        }}
            onClick={activeDiagram === 'original' ? (e) => {
          e.cancelBubble = true;
          import('../store/dialogStore').then(({ useDialogStore }) => {
            useDialogStore.getState().openDialog('editAngle', {
              anchor: { x: anchorX + angleOffset.dx, y: anchorY + angleOffset.dy },
              angle: signedAngle.toFixed(1),
              segIdx: i - 1,
              lineIdx,
              length: getSegmentLength(b, c).toFixed(1),
            });
          });
        } : undefined}
  onTap={activeDiagram === 'original' ? e => {
          e.cancelBubble = true;
          import('../store/dialogStore').then(({ useDialogStore }) => {
            useDialogStore.getState().openDialog('editAngle', {
              anchor: { x: anchorX + angleOffset.dx, y: anchorY + angleOffset.dy },
              angle: signedAngle.toFixed(1),
              segIdx: i - 1,
              lineIdx,
              length: getSegmentLength(b, c).toFixed(1),
            });
          });
        } : undefined}
      >
        <KonvaTag fill={LABEL_BG} cornerRadius={4} />
        <KonvaText text={angleLabel} fontSize={13} fill="#fff" fontStyle="bold" padding={3} />
      </KonvaLabel>
    );
  }
  return <>{labels}</>;
};

export default AngleLabels;
