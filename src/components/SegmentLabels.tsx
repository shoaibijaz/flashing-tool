import React from 'react';
import { Label as KonvaLabel, Tag as KonvaTag, Text as KonvaText } from 'react-konva';
import { useDialogStore } from '../store/dialogStore';
import type { Point } from '../types';
import { getSegmentLength } from '../utils/geometryUtils';

const LABEL_Y_OFFSET = 22;
const LABEL_X_OFFSET = 6;
const LABEL_BG = 'rgba(0,0,0,0.9)';
const MAX_OFFSET = 2000; // clamp offsets to avoid drifting off-canvas

interface SegmentLabelsProps {
  line: { id: string; points: Point[]; color: string };
  lineIdx: number;
  labelOffsets: Record<string, { dx: number; dy: number }>;
  setLabelOffsets: React.Dispatch<React.SetStateAction<Record<string, { dx: number; dy: number }>>>;
  getLabelKey: (lineIdx: number, segIdx: number) => string;
  resolvedOffsets?: Record<string, { dx: number; dy: number }>;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const SegmentLabels: React.FC<SegmentLabelsProps> = ({ line, lineIdx, labelOffsets, setLabelOffsets, getLabelKey, resolvedOffsets }) => {
  const labels = [];
  for (let i = 1; i < line.points.length; i++) {
    const p1 = line.points[i - 1];
    const p2 = line.points[i];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const segLen = getSegmentLength(p1, p2);
    const label = segLen.toFixed(1) + ' px';
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    const labelKey = getLabelKey(lineIdx, i);
    // Prefer user-set offsets (labelOffsets) over automatically resolved offsets
    const offset = labelOffsets[labelKey] ?? resolvedOffsets?.[labelKey] ?? { dx: 0, dy: 0 };
    let angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;
    if (angleDeg > 90 || angleDeg < -90) {
      angleDeg += 180;
    }
    labels.push(
      <KonvaLabel
        key={`seg-label-${i}`}
        x={midX + LABEL_X_OFFSET + offset.dx}
        y={midY - LABEL_Y_OFFSET + offset.dy}
        listening={true}
        rotation={angleDeg}
        draggable
        onDragEnd={e => {
          // Compute absolute offset relative to the label anchor used when rendering
          const newDx = e.target.x() - (midX + LABEL_X_OFFSET);
          const newDy = e.target.y() - (midY - LABEL_Y_OFFSET);
          // Clamp to reasonable bounds to avoid off-canvas drift
          const clampedDx = clamp(newDx, -MAX_OFFSET, MAX_OFFSET);
          const clampedDy = clamp(newDy, -MAX_OFFSET, MAX_OFFSET);
          setLabelOffsets(prev => ({
            ...prev,
            [labelKey]: { dx: clampedDx, dy: clampedDy },
          }));
        }}
        onClick={e => {
          e.cancelBubble = true;
          useDialogStore.getState().openDialog('editSegment', {
            anchor: { x: midX + LABEL_X_OFFSET + offset.dx, y: midY - LABEL_Y_OFFSET + offset.dy },
            segIdx: i,
            lineIdx,
            length: segLen.toFixed(1),
          });
        }}
        onTap={e => {
          e.cancelBubble = true;
          useDialogStore.getState().openDialog('editSegment', {
            anchor: { x: midX + LABEL_X_OFFSET + offset.dx, y: midY - LABEL_Y_OFFSET + offset.dy },
            segIdx: i,
            lineIdx,
            length: segLen.toFixed(1),
          });
        }}
        style={{ cursor: 'pointer' }}
      >
        <KonvaTag
          fill={LABEL_BG}
          cornerRadius={4}
          ref={tagNode => {
            if (tagNode) {
              const labelGroup = tagNode.getParent();
              if (labelGroup) {
                type KonvaNodeWithClass = { getClassName: () => string };
                const text = labelGroup.findOne((n: KonvaNodeWithClass) => n.getClassName && n.getClassName() === 'Text');
                if (text) {
                  const w = text.width();
                  const h = text.height();
                  tagNode.offsetX(w / 2);
                  tagNode.offsetY(h / 2);
                  tagNode.width(w);
                  tagNode.height(h);
                }
              }
            }
          }}
        />
        <KonvaText
          text={label}
          fontSize={12}
          padding={6}
          fill="#fff"
          fontStyle="bold"
          fontFamily="Arial"
          align="center"
          verticalAlign="middle"
          ref={node => {
            if (node) {
              const w = node.width();
              const h = node.height();
              node.offsetX(w / 2);
              node.offsetY(h / 2);
            }
          }}
        />
      </KonvaLabel>
    );
  }
  return <>{labels}</>;
};

export default SegmentLabels;
