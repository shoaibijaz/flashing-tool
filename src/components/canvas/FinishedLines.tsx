import React from 'react';
import { Line, Circle } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import useSettingsStore from '../../store/settingsStore';
import type { Line as LineType } from '../../types/core';
import SegmentLabels from './SegmentLabels';
import AngleLabels from './AngleLabels';

interface FinishedLinesProps {
  drawings: LineType[];
  isLocked: boolean;
  onFinishedLinePointDrag: (lineIdx: number, pointIdx: number, e: KonvaEventObject<DragEvent>) => void;
  onLabelDragMove?: (lineId: string, segmentIndex: number, e: KonvaEventObject<DragEvent>) => void;
  onAngleLabelDragMove?: (lineId: string, vertexIndex: number, e: KonvaEventObject<DragEvent>) => void;
}

const FinishedLines: React.FC<FinishedLinesProps> = ({
  drawings,
  isLocked,
  onFinishedLinePointDrag,
  onLabelDragMove,
  onAngleLabelDragMove,
}) => {
  const { settings } = useSettingsStore();

  return (
    <>
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
          <SegmentLabels line={line} onLabelDragMove={onLabelDragMove} />
          
          {/* Angle labels */}
          <AngleLabels line={line} onAngleLabelDragMove={onAngleLabelDragMove} />
        </React.Fragment>
      ))}
    </>
  );
};

export default FinishedLines;
