import React from 'react';
import { Line as KonvaLine } from 'react-konva';
import { GetNewPositionByAngleLength } from '../utils/geometryUtils';
import { useDrawingStore } from '../store/drawingStore';


interface EndFoldLabelProps {
  which: 'first' | 'last';
}
// Removed stray closing brace

// Helper to compute endpoint position from line and fold info



const EndFoldLabel: React.FC<EndFoldLabelProps> = ({ which }) => {
  const lines = useDrawingStore(s => s.lines);
  const firstEndpoint = useDrawingStore(s => s.firstEndpoint);
  const lastEndpoint = useDrawingStore(s => s.lastEndpoint);

  // Find the relevant endpoint info and anchor point
  const endpointInfo = which === 'first' ? firstEndpoint : lastEndpoint;
  let anchorPt: { x: number; y: number } | null = null;
  let baseAngle = 0;
  // Find the anchor point for the endpoint (first or last point of the first/last line)
  if (lines.length > 0 && endpointInfo) {
    if (which === 'first') {
      // Use the first line with at least 2 points
      const line = lines.find(l => l.points.length > 1);
      if (line) {
        anchorPt = line.points[0];
        // Calculate base angle from first two points
        const p0 = line.points[0], p1 = line.points[1];
        baseAngle = Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI;
      }
    } else {
      // Use the last line with at least 2 points
      const line = [...lines].reverse().find(l => l.points.length > 1);
      if (line) {
        anchorPt = line.points[line.points.length - 1];
        // Calculate base angle from last two points
        const n = line.points.length;
        const p0 = line.points[n - 2], p1 = line.points[n - 1];
        baseAngle = Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI;
      }
    }
  }

  // If no anchor, don't render
  if (!anchorPt || !endpointInfo) return null;

  // Draw the endfold diagram: a polyline starting at anchorPt, using segmentEdits (original working logic)
  const segEdits = endpointInfo.segmentEdits || {};
  const segments = Object.values(segEdits);
  const points: number[] = [anchorPt.x, anchorPt.y];
  let pt = { x: anchorPt.x, y: anchorPt.y };
  let prev = null;
  if (which === 'first') {
    // Use the first line with at least 2 points for direction
    const line = lines.find(l => l.points.length > 1);
    if (line) prev = line.points[1];
  } else {
    // Use the last line with at least 2 points for direction
    const line = [...lines].reverse().find(l => l.points.length > 1);
    if (line) prev = line.points[line.points.length - 2];
  }
  for (let i = 0; i < segments.length; i++) {
    const { Length, Angle } = segments[i];
    if (i === 0 && prev) {
      pt = GetNewPositionByAngleLength(prev.x, prev.y, pt.x, pt.y, Length, Angle);
    } else {
      const prev2 = pt;
      pt = GetNewPositionByAngleLength(prev2.x, prev2.y, pt.x, pt.y, Length, Angle);
    }
    points.push(pt.x, pt.y);
  }

  // Draw the polyline and a circle at the endpoint
  return (
    <>
      {points.length > 2 && (
        <KonvaLine
          points={points}
          stroke="#0ea5e9"
          strokeWidth={3}
          lineCap="round"
          lineJoin="round"
          dash={[8, 6]}
          listening={false}
        />
      )}
    </>
  );
};

export default EndFoldLabel;
