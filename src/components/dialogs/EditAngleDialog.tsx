import React from 'react';
import { Button } from '../ui/button';
import { useDialogStore } from '../../store/dialogStore';
import { useDrawingStore } from '../../store/drawingStore';
import { angleAtVertexDegrees, degToRad, getSegmentLength } from '../../utils/geometryUtils';

export interface EditAngleDialogProps {
  open: boolean;
  anchor: { x: number; y: number };
  angle: string;
  segIdx: number; // index of the middle vertex (B)
  lineIdx: number;
  length?: string;
}

const EditAngleDialog: React.FC<EditAngleDialogProps> = ({ open, anchor, angle, segIdx, lineIdx, length }) => {
  const { closeDialog } = useDialogStore();
  const lines = useDrawingStore((s) => s.lines);
  const rotateSubchainAroundIndex = useDrawingStore((s) => s.rotateSubchainAroundIndex);
  const [localAngle, setLocalAngle] = React.useState(angle);
  // Force rotate next subchain to avoid ambiguity: rotate C..end by default
  const rotateNext = true;

  React.useEffect(() => {
    setLocalAngle(angle);
  }, [angle]);

  function computeSegmentLengths(points: { x: number; y: number }[]) {
    const lengths: number[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      lengths.push(getSegmentLength(points[i], points[i + 1]));
    }
    return lengths;
  }

  const handleOk = () => {
    const newAngleDeg = Number(localAngle);
    let segLen = Number(length);

    // segIdx is expected to be the index of middle vertex B
    if (
      typeof lineIdx === 'number' &&
      typeof segIdx === 'number' &&
      Number.isFinite(newAngleDeg)
    ) {
      const updatedLines = [...lines];
      const line = updatedLines[lineIdx];
      if (!line || !line.points || line.points.length < 3) {
        console.debug('Angle requires 3 points', { lineIdx, segIdx, line });
        closeDialog();
        return;
      }

      // Validate middle index: must be in [1, line.points.length-2]
      if (segIdx < 1 || segIdx > line.points.length - 2) {
        console.debug('segIdx (middle index) out of range for angle', { segIdx, pointsLength: line.points.length });
        closeDialog();
        return;
      }

      // Compute indices: from = segIdx-1 (A), middle = segIdx (B), to = segIdx+1 (C)
      const fromIdx = segIdx - 1;
      const middleIdx = segIdx;
      const toIdx = segIdx + 1;

      const from = line.points[fromIdx]; // A
      const middle = line.points[middleIdx];   // B
      const to = line.points[toIdx];   // C
      if (!from || !middle || !to) {
        console.debug('Missing points', { from, middle, to, fromIdx, middleIdx, toIdx });
        return;
      }

      // Fallback: calculate segLen if invalid (length of BC)
      if (!segLen || isNaN(segLen)) {
        segLen = Math.sqrt((to.x - middle.x) ** 2 + (to.y - middle.y) ** 2);
        console.debug('Fallback segLen', segLen);
      }

      // Compute current angle and delta (angle at middle B)
      const currentAngle = angleAtVertexDegrees(from, middle, to);
      const deltaDeg = newAngleDeg - currentAngle;
      const deltaRad = degToRad(deltaDeg);

      // Compute downstream angle (if exists): angle at C (B-C-D)
      let downstreamBefore: number | null = null;
      if (toIdx + 1 < line.points.length) {
        downstreamBefore = angleAtVertexDegrees(line.points[middleIdx], line.points[toIdx], line.points[toIdx + 1]);
      }

      // Debug summary before rotation
      const beforeSummary = {
        lineIdx,
        fromIdx,
        middleIdx,
        toIdx,
        pivot: middle,
        currentAngle,
        requestedAngle: newAngleDeg,
        deltaDeg,
        downstreamBefore,
        pointCount: line.points.length,
      };

      console.debug('Before rotation:', beforeSummary);

      // Compute lengths before change for debug
      const beforeLengths = computeSegmentLengths(line.points);

      // Compute angles before change for debug (angles at internal vertices)
      const anglesBefore: number[] = [];
      for (let i = 1; i < line.points.length - 1; i++) {
        anglesBefore.push(angleAtVertexDegrees(line.points[i - 1], line.points[i], line.points[i + 1]));
      }

      // Pivot index for rotation is middleIdx (B)
      const pivotIndex = middleIdx;
      const tailCount = Math.max(0, line.points.length - (pivotIndex + 1));

      // If nothing to rotate on chosen side, log and exit
      if (rotateNext && tailCount === 0) {
        console.warn('No points to rotate on next side; nothing changed', { pivotIndex, tailCount });
        alert('No points to rotate on the selected side.');
        closeDialog();
        return;
      }

      // Take snapshot of coordinates before
      const coordsBefore = line.points.map(p => ({ x: p.x, y: p.y }));

      // Apply rotation on chosen side (always rotate next)
      rotateSubchainAroundIndex(lineIdx, pivotIndex, rotateNext, deltaRad);

      // Debug: compute resulting angle and lengths after rotation
      const updatedLine = (useDrawingStore.getState().lines)[lineIdx];
      const newFrom = updatedLine.points[fromIdx];
      const newMiddle = updatedLine.points[middleIdx];
      const newTo = updatedLine.points[toIdx];
      const resultingAngle = angleAtVertexDegrees(newFrom, newMiddle, newTo);

      // downstream angle after rotation
      let downstreamAfter: number | null = null;
      if (toIdx + 1 < updatedLine.points.length) {
        downstreamAfter = angleAtVertexDegrees(updatedLine.points[middleIdx], updatedLine.points[toIdx], updatedLine.points[toIdx + 1]);
      }

      const afterLengths = computeSegmentLengths(updatedLine.points);
      const coordsAfter = updatedLine.points.map(p => ({ x: p.x, y: p.y }));

      // Per-point movement
      const movements = coordsBefore.map((pt, i) => ({ index: i, before: pt, after: coordsAfter[i], moved: Math.hypot((coordsAfter[i].x - pt.x), (coordsAfter[i].y - pt.y)) }));

      // Compare lengths with tolerance
      const epsilon = 1e-6;
      const diffs: { index: number; before: number; after: number; ok: boolean }[] = [];
      for (let i = 0; i < Math.max(beforeLengths.length, afterLengths.length); i++) {
        const b = beforeLengths[i] ?? 0;
        const a = afterLengths[i] ?? 0;
        diffs.push({ index: i, before: b, after: a, ok: Math.abs(b - a) <= epsilon });
      }

      // Compute angles after change for debug (angles at internal vertices)
      const anglesAfter: number[] = [];
      for (let i = 1; i < updatedLine.points.length - 1; i++) {
        anglesAfter.push(angleAtVertexDegrees(updatedLine.points[i - 1], updatedLine.points[i], updatedLine.points[i + 1]));
      }

      // Compare angles with tolerance (in degrees)
      const epsilonAngle = 1e-6;
      const angleDiffs: { index: number; vertexIndex: number; before: number; after: number; delta: number; ok: boolean }[] = [];
      for (let i = 0; i < Math.max(anglesBefore.length, anglesAfter.length); i++) {
        const b = anglesBefore[i] ?? 0;
        const a = anglesAfter[i] ?? 0;
        const d = a - b;
        // Normalize delta to [-180,180]
        let delta = d;
        if (delta > 180) delta -= 360;
        if (delta <= -180) delta += 360;
        angleDiffs.push({ index: i, vertexIndex: i + 1, before: b, after: a, delta, ok: Math.abs(delta) <= epsilonAngle });
      }

      const lengthsChanged = diffs.filter(x => !x.ok).map(x => x.index);
      const anglesChanged = angleDiffs.filter(x => !x.ok).map(x => x.vertexIndex);

      const afterSummary = {
        resultingAngle,
        downstreamAfter,
        lengthsBefore: beforeLengths,
        lengthsAfter: afterLengths,
        diffs,
        anglesBefore,
        anglesAfter,
        angleDiffs,
        lengthsChangedCount: lengthsChanged.length,
        anglesChangedCount: anglesChanged.length,
        lengthsChanged,
        anglesChanged,
        movements,
      };

      // Detailed logs
      console.debug('After rotation (detailed):', afterSummary, beforeSummary);
      // Summary line for quick inspection
      console.info('Angle update summary:', {
        lineIdx,
        pivotIndex,
        requestedAngle: newAngleDeg,
        resultingAngle,
        lengthsTotal: beforeLengths.length,
        lengthsChangedCount: lengthsChanged.length,
        anglesTotal: anglesBefore.length,
        anglesChangedCount: anglesChanged.length,
        changedLengthIndices: lengthsChanged,
        changedAngleVertexIndices: anglesChanged,
      });

    }
    closeDialog();
  };
  if (!open || !anchor) return null;

  return (
    <div className="fixed left-0 top-0 w-full h-full flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-2 min-w-[220px]">
        <div className="flex flex-row items-center gap-2 mb-2">
          <input
            type="number"
            value={localAngle}
            onChange={e => setLocalAngle(e.target.value)}
            min={-360}
            max={360}
            className="w-[100px] px-3 py-2 rounded-md border border-gray-300 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            autoFocus
            aria-label="Angle (deg)"
          />
          {/* Anchor dropdown removed: always rotate next (C..end) */}
          <Button variant="ghost" onClick={handleOk} className="bg-blue-600 text-white hover:bg-blue-700 px-2 py-1" aria-label="OK">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </Button>
          <Button variant="ghost" onClick={closeDialog} className="bg-gray-300 text-gray-700 hover:bg-gray-400 px-2 py-1" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditAngleDialog;
