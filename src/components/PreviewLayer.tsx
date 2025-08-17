import React from 'react';
import { Line as KonvaLine, Label as KonvaLabel, Tag as KonvaTag, Text as KonvaText } from 'react-konva';
import PolylineHandles from './PolylineHandles';
import type { Point } from '../types';
import type { KonvaEventObject } from 'konva/lib/Node';

const LABEL_Y_OFFSET = 22;
const LABEL_X_OFFSET = 6;
const LABEL_BG = 'rgba(0,0,0,0.9)';

interface PreviewLayerProps {
  polyPoints: Point[];
  hoverPoint: Point | null;
  onPointDragMove: (idx: number, e: KonvaEventObject<DragEvent>) => void;
}

const PreviewLayer: React.FC<PreviewLayerProps> = ({ polyPoints, hoverPoint, onPointDragMove }) => {
  return (
    <>
      {polyPoints.map((pt, idx) => (
        <KonvaLine
          key={"pt-" + idx}
          points={[pt.x, pt.y, pt.x, pt.y]}
          stroke="#60a5fa"
          strokeWidth={6}
          lineCap="round"
          lineJoin="round"
          globalCompositeOperation="source-over"
        />
      ))}
      {(polyPoints.length > 1 || (polyPoints.length === 1 && hoverPoint)) && (
        <>
          <KonvaLine
            points={
              polyPoints.length > 1
                ? polyPoints.flatMap((p) => [p.x, p.y])
                : (hoverPoint ? [polyPoints[0].x, polyPoints[0].y, hoverPoint.x, hoverPoint.y] : [])
            }
            stroke="#60a5fa"
            strokeWidth={3}
            lineCap="round"
            lineJoin="round"
            dash={[8, 8]}
          />
          {/* Segment/angle labels for preview */}
          {(() => {
            const labels = [];
            for (let i = 1; i < polyPoints.length; i++) {
              const p1 = polyPoints[i - 1];
              const p2 = polyPoints[i];
              const dx = p2.x - p1.x;
              const dy = p2.y - p1.y;
              const segLen = Math.sqrt(dx * dx + dy * dy);
              const label = segLen.toFixed(1) + ' px';
              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;
              labels.push(
                <KonvaLabel
                  key={`preview-seg-label-${i}`}
                  x={midX + LABEL_X_OFFSET}
                  y={midY - LABEL_Y_OFFSET}
                  listening={false}
                >
                  <KonvaTag fill={LABEL_BG} cornerRadius={4} />
                  <KonvaText text={label} fontSize={14} fill="#fff" fontStyle="bold" padding={3} />
                </KonvaLabel>
              );
              if (i >= 2) {
                const a = polyPoints[i - 2];
                const b = polyPoints[i - 1];
                const c = polyPoints[i];
                const abx = a.x - b.x;
                const aby = a.y - b.y;
                const cbx = c.x - b.x;
                const cby = c.y - b.y;
                const dot = abx * cbx + aby * cby;
                const magAB = Math.sqrt(abx * abx + aby * aby);
                const magCB = Math.sqrt(cbx * cbx + cby * cby);
                let angle = Math.acos(dot / (magAB * magCB)) * (180 / Math.PI);
                if (isNaN(angle)) angle = 0;
                const angleLabel = angle.toFixed(1) + '°';
                labels.push(
                  <KonvaLabel
                    key={`preview-angle-label-${i}`}
                    x={b.x + LABEL_X_OFFSET + 18}
                    y={b.y - LABEL_Y_OFFSET - 18}
                    listening={false}
                  >
                    <KonvaTag fill={LABEL_BG} cornerRadius={4} />
                    <KonvaText text={angleLabel} fontSize={13} fill="#fff" fontStyle="bold" padding={3} />
                  </KonvaLabel>
                );
              }
            }
            if (polyPoints.length >= 1 && hoverPoint) {
              const p1 = polyPoints[polyPoints.length - 1];
              const p2 = hoverPoint;
              const dx = p2.x - p1.x;
              const dy = p2.y - p1.y;
              const segLen = Math.sqrt(dx * dx + dy * dy);
              const label = segLen.toFixed(1) + ' px';
              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;
              labels.push(
                <KonvaLabel
                  key={`preview-seg-label-hover`}
                  x={midX + LABEL_X_OFFSET}
                  y={midY - LABEL_Y_OFFSET}
                  listening={false}
                >
                  <KonvaTag fill={LABEL_BG} cornerRadius={4} />
                  <KonvaText text={label} fontSize={14} fill="#fff" fontStyle="bold" padding={3} />
                </KonvaLabel>
              );
              if (polyPoints.length >= 2) {
                const a = polyPoints[polyPoints.length - 2];
                const b = polyPoints[polyPoints.length - 1];
                const c = hoverPoint;
                const abx = a.x - b.x;
                const aby = a.y - b.y;
                const cbx = c.x - b.x;
                const cby = c.y - b.y;
                const dot = abx * cbx + aby * cby;
                const magAB = Math.sqrt(abx * abx + aby * aby);
                const magCB = Math.sqrt(cbx * cbx + cby * cby);
                let angle = Math.acos(dot / (magAB * magCB)) * (180 / Math.PI);
                if (isNaN(angle)) angle = 0;
                const angleLabel = angle.toFixed(1) + '°';
                labels.push(
                  <KonvaLabel
                    key={`preview-angle-label-hover`}
                    x={b.x + LABEL_X_OFFSET + 18}
                    y={b.y - LABEL_Y_OFFSET - 18}
                    listening={false}
                  >
                    <KonvaTag fill={LABEL_BG} cornerRadius={4} />
                    <KonvaText text={angleLabel} fontSize={13} fill="#fff" fontStyle="bold" padding={3} />
                  </KonvaLabel>
                );
              }
            }
            return labels;
          })()}
        </>
      )}
      {hoverPoint && polyPoints.length > 0 && (
        <KonvaLine
          points={
            polyPoints.length > 0
              ? [polyPoints.slice(-1)[0].x, polyPoints.slice(-1)[0].y, hoverPoint.x, hoverPoint.y]
              : []
          }
          stroke="#60a5fa"
          strokeWidth={2}
          dash={[4, 4]}
        />
      )}
      {polyPoints.length > 0 && (
        <PolylineHandles points={polyPoints} onDragMove={onPointDragMove} draggable />
      )}
    </>
  );
};

export default PreviewLayer;
