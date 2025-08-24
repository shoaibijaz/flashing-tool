import React, { useState } from 'react';
import { useDrawingStore } from '../store/drawingStore';
import { getSegmentLength, angleAtVertexDegrees, degToRad } from '../utils/geometryUtils';

export interface LayersPanelProps {
  activeTab: 'original' | 'tapered' | 'endfolds';
  onTabChange: (tab: 'original' | 'tapered' | 'endfolds') => void;
  onClose: () => void;
}

const LayersPanel: React.FC<LayersPanelProps> = ({ activeTab, onTabChange, onClose }) => {
  const [segmentsOpen, setSegmentsOpen] = useState(true);
  const [anglesOpen, setAnglesOpen] = useState(true);

  return (
    <div className="absolute top-0 right-0 h-full w-96 bg-white border-l shadow-lg z-30 flex flex-col text-[13px]">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <span>Layers</span>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-900 text-xl">&times;</button>
      </div>
      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`flex-1 py-2 text-center ${activeTab === 'original' ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-100'}`}
          onClick={() => onTabChange('original')}
          type="button"
        >
          Original
        </button>
        <button
          className={`flex-1 py-2 text-center ${activeTab === 'tapered' ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-100'}`}
          onClick={() => onTabChange('tapered')}
          type="button"
        >
          Tapered
        </button>
        <button
          className={`flex-1 py-2 text-center ${activeTab === 'endfolds' ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' : 'text-gray-700 hover:bg-gray-100'}`}
          onClick={() => onTabChange('endfolds')}
          type="button"
        >
          EndFolds
        </button>
      </div>
      <div className="flex-1 p-4 overflow-auto">
        {activeTab === 'original' && (
          <div>
            <div className="mb-2 font-semibold">Original Diagram</div>
            {/* Collapsible card: Segments */}
            <div className="border rounded bg-gray-50">
              <button
                type="button"
                onClick={() => setSegmentsOpen(s => !s)}
                className="w-full text-left p-3 flex items-center justify-between"
              >
                <span className="font-medium">Segments</span>
                <span className="text-gray-500">{segmentsOpen ? '−' : '+'}</span>
              </button>
              {segmentsOpen && (
                <div className="p-3 border-t">
                  <SegmentsList />
                </div>
              )}
            </div>

            {/* Collapsible card: Angles */}
            <div className="border rounded bg-gray-50 mt-3">
              <button
                type="button"
                onClick={() => setAnglesOpen(a => !a)}
                className="w-full text-left p-3 flex items-center justify-between"
              >
                <span className="font-medium">Angles</span>
                <span className="text-gray-500">{anglesOpen ? '−' : '+'}</span>
              </button>
              {anglesOpen && (
                <div className="p-3 border-t">
                  <AnglesList />
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'tapered' && (
          <div>
            <div className="mb-2 font-semibold">Tapered Diagram</div>
            <div className="border rounded bg-gray-50">
              <button
                type="button"
                onClick={() => setSegmentsOpen(s => !s)}
                className="w-full text-left p-3 flex items-center justify-between"
              >
                <span className="font-medium">Segments</span>
                <span className="text-gray-500">{segmentsOpen ? '−' : '+'}</span>
              </button>
              {segmentsOpen && (
                <div className="p-3 border-t">
                  <SegmentsList lineIndex={1} />
                </div>
              )}
            </div>
            <div className="border rounded bg-gray-50 mt-3">
              <button
                type="button"
                onClick={() => setAnglesOpen(a => !a)}
                className="w-full text-left p-3 flex items-center justify-between"
              >
                <span className="font-medium">Angles</span>
                <span className="text-gray-500">{anglesOpen ? '−' : '+'}</span>
              </button>
              {anglesOpen && (
                <div className="p-3 border-t">
                  <AnglesList lineIndex={1} />
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'endfolds' && (
          <div>
            <div className="mb-2 font-semibold">End Folds</div>
            {/* More content for end folds can go here */}
          </div>
        )}
      </div>
    </div>
  );
};

function SegmentsList({ lineIndex = 0 }: { lineIndex?: number }) {
  const line = useDrawingStore(state => state.lines[lineIndex]);
  const [editedLengths, setEditedLengths] = useState<Record<number, string>>({});
  const setLines = useDrawingStore(state => state.setLines);
  const lines = useDrawingStore(state => state.lines);

  if (!line || !line.points || line.points.length < 2) {
    return <div className="text-sm text-gray-500">No segments available.</div>;
  }

  const points = line.points;

  const indexToLabel = (idx: number) => String.fromCharCode(65 + idx); // A, B, C, ...

  const handleChange = (segIdx: number, raw: string) => {
    // allow empty or numeric input
    if (raw === '' || /^\d*(?:\.\d*)?$/.test(raw)) {
      setEditedLengths(prev => ({ ...prev, [segIdx]: raw }));
    }
  };

  const commitChange = (segIdx: number) => {
    const raw = editedLengths[segIdx];
    const next = line.points[segIdx + 1];
    const pA = line.points[segIdx];
    const currentLen = getSegmentLength(pA, next);
    const parsed = parseFloat(String(raw));
    // invalid: NaN, zero, negative => revert to current length
    if (isNaN(parsed) || parsed <= 0) {
      setEditedLengths(prev => ({ ...prev, [segIdx]: currentLen.toFixed(2) }));
      return;
    }

    // if length unchanged, just normalize display
    if (Math.abs(parsed - currentLen) < 1e-6) {
      setEditedLengths(prev => ({ ...prev, [segIdx]: parsed.toFixed(2) }));
      return;
    }

    // compute new position for point B and translate tail by delta
    const dx = next.x - pA.x;
    const dy = next.y - pA.y;
    const scale = parsed / currentLen;
    const newBx = pA.x + dx * scale;
    const newBy = pA.y + dy * scale;
    const deltaX = newBx - next.x;
    const deltaY = newBy - next.y;

    // apply update immutably
    const newLines = [...lines];
    const updatedLine = { ...newLines[0], points: [...newLines[0].points] };
    for (let j = segIdx + 1; j < updatedLine.points.length; j++) {
      updatedLine.points[j] = {
        x: updatedLine.points[j].x + deltaX,
        y: updatedLine.points[j].y + deltaY,
      };
    }
    newLines[0] = updatedLine;
    setLines(newLines);
    // store normalized display
    setEditedLengths(prev => ({ ...prev, [segIdx]: parsed.toFixed(2) }));
  };

  return (
    <div>
      <div className="mb-2 text-sm text-gray-600">Points: {points.map((_, i) => indexToLabel(i)).join(' - ')}</div>
      <div className="space-y-2">
        {points.slice(0, -1).map((p, i) => {
          const next = points[i + 1];
          const len = getSegmentLength(p, next);
          const display = editedLengths[i] !== undefined && editedLengths[i] !== '' ? editedLengths[i] : len.toFixed(2);
          return (
            <div key={i} className="flex items-center justify-between">
              <div className="text-sm font-medium">{indexToLabel(i)}{indexToLabel(i + 1)}</div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  className={`w-24 p-1 border rounded text-sm text-right ${display === '0.00' || display === '0' ? 'border-red-500' : ''}`}
                  value={display}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onBlur={() => commitChange(i)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); } }}
                />
                <span className="text-xs text-gray-500">px</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnglesList({ lineIndex = 0 }: { lineIndex?: number }) {
  const line = useDrawingStore(state => state.lines[lineIndex]);
  const setLines = useDrawingStore(state => state.setLines);
  const lines = useDrawingStore(state => state.lines);
  const [editedAngles, setEditedAngles] = useState<Record<number, string>>({});

  if (!line || !line.points || line.points.length < 3) {
    return <div className="text-sm text-gray-500">At least 3 points required for angles.</div>;
  }

  const points = line.points;

  const indexToLabel = (idx: number) => String.fromCharCode(65 + idx); // A, B, C, ...
  const handleChange = (idx: number, raw: string) => {
    if (raw === '' || /^\d*(?:\.\d*)?$/.test(raw)) {
      setEditedAngles(prev => ({ ...prev, [idx]: raw }));
    }
  };
  const commitChange = (idx: number) => {
    const raw = editedAngles[idx];
    const a = points[idx - 1];
    const b = points[idx];
    const c = points[idx + 1];
    const currentAngle = Math.abs(angleAtVertexDegrees(a, b, c));
    const parsed = parseFloat(String(raw));
    // invalid: NaN, <=0, >=180 => revert
    if (isNaN(parsed) || parsed <= 0 || parsed >= 180) {
      setEditedAngles(prev => ({ ...prev, [idx]: currentAngle.toFixed(2) }));
      return;
    }
    // if unchanged, normalize
    if (Math.abs(parsed - currentAngle) < 1e-6) {
      setEditedAngles(prev => ({ ...prev, [idx]: parsed.toFixed(2) }));
      return;
    }
    // Rotate tail (points after b) to achieve new angle at b
    // Calculate current and desired angle, rotate c and all after around b
    const v1x = a.x - b.x;
    const v1y = a.y - b.y;
    const v2x = c.x - b.x;
    const v2y = c.y - b.y;
    const currentRad = Math.atan2(v1x * v2y - v2x * v1y, v1x * v2x + v1y * v2y);
    const desiredRad = degToRad(parsed) * Math.sign(currentRad);
    const deltaRad = desiredRad - currentRad;
    // apply update immutably
    const newLines = [...lines];
    const updatedLine = { ...newLines[lineIndex], points: [...newLines[lineIndex].points] };
    const tail = updatedLine.points.slice(idx + 1);
    if (tail.length > 0) {
      // rotate tail around b
      const cos = Math.cos(deltaRad);
      const sin = Math.sin(deltaRad);
      for (let j = 0; j < tail.length; j++) {
        const p = tail[j];
        const dx = p.x - b.x;
        const dy = p.y - b.y;
        updatedLine.points[idx + 1 + j] = {
          x: b.x + dx * cos - dy * sin,
          y: b.y + dx * sin + dy * cos,
        };
      }
      newLines[lineIndex] = updatedLine;
      setLines(newLines);
    }
    setEditedAngles(prev => ({ ...prev, [idx]: parsed.toFixed(2) }));
  };

  return (
    <div>
      <div className="mb-2 text-sm text-gray-600">Angles at vertices:</div>
      <div className="space-y-2">
        {points.slice(1, -1).map((b, idx) => {
          const i = idx + 1;
          const a = points[i - 1];
          const c = points[i + 1];
          const angle = Math.abs(angleAtVertexDegrees(a, b, c));
          const display = editedAngles[i] !== undefined && editedAngles[i] !== '' ? editedAngles[i] : angle.toFixed(2);
          return (
            <div key={i} className="flex items-center justify-between">
              <div className="text-sm font-medium">{indexToLabel(i - 1)}{indexToLabel(i)}{indexToLabel(i + 1)}</div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0.01}
                  max={179.99}
                  step={0.01}
                  className={`w-24 p-1 border rounded text-sm text-right ${(display === '0.00' || display === '0' || parseFloat(display) >= 180) ? 'border-red-500' : ''}`}
                  value={display}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onBlur={() => commitChange(i)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { (e.target as HTMLInputElement).blur(); } }}
                />
                <span className="text-xs text-gray-500">°</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LayersPanel;
