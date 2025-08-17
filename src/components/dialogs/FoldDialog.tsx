import React, { useEffect, useState } from 'react';
import type { FoldEndpointInfo as StoreFoldEndpointInfo, Point } from '../../types';
import { Button } from "../ui/button";
import { Check, X, Shuffle } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { useDrawingStore } from '../../store/drawingStore';
import { GetNewPositionByAngleLength } from '../../utils/geometryUtils';

interface Fold {
  Id: string;
  Name: string;
  Label: string;
  FoldsCount: number;
  SortOrder: number;
  IsActive: boolean;
  Segments: Array<{
    Angle: number;
    Length: number;
    SortOrder: number;
    IsSupported: boolean;
    IsLengthEditable: boolean;
    IsAngleEditable: boolean;
    MaxLength: number;
    MinLength: number;
  }>;
}

// Remove duplicate FoldDialogProps
interface FoldDialogProps {
  open: boolean;
  end: 'start' | 'end' | null;
  lineIdx: number;
  onClose: () => void;
  onOk: (fold: Fold, segmentEdits: { [segIdx: number]: { Length: number; Angle: number } }) => void;
}

const FoldDialog: React.FC<FoldDialogProps> = ({ open, end, lineIdx, onClose, onOk }) => {
  // Add DrawingLine type for correct typing
  interface FoldEndpointInfo {
    selectedId: string;
    segmentEdits: { [segIdx: number]: { Length: number; Angle: number } };
    direction?: string;
  }
  interface DrawingLine {
    points: { x: number; y: number }[];
    startFold?: FoldEndpointInfo;
    endFold?: FoldEndpointInfo;
    // ...other properties as needed
  }
  const lines = useDrawingStore((s: { lines: DrawingLine[] }) => s.lines);
  const setLineEndpointFold = useDrawingStore((s: { setLineEndpointFold: (lineIdx: number, endpointKey: 'startFold' | 'endFold', foldInfo: StoreFoldEndpointInfo | undefined) => void }) => s.setLineEndpointFold);
  const removeLineEndpointFold = useDrawingStore((s: { removeLineEndpointFold: (lineIdx: number, endpointKey: 'startFold' | 'endFold') => void }) => s.removeLineEndpointFold);
  const setFirstEndpoint = useDrawingStore((s: { setFirstEndpoint: (pts: Point[], idx: number, highlight?: boolean) => void }) => s.setFirstEndpoint);
  const setLastEndpoint = useDrawingStore((s: { setLastEndpoint: (pts: Point[], idx: number, highlight?: boolean) => void }) => s.setLastEndpoint);
  // Use dialogStore only for lineIdx
  const [folds, setFolds] = useState<Fold[]>([]);
  // Store fold info for endpoints in drawingStore, not localStorage
  // lineIdx is now passed as a prop
  const endpointKey = end === 'end' ? 'endFold' : 'startFold';
  // Remove type assertion to missing type
  const endpointFoldInfo = (typeof lineIdx === 'number' && lines[lineIdx] && lines[lineIdx][endpointKey]) || undefined;
  const [selectedId, setSelectedId] = useState<string>(endpointFoldInfo?.selectedId || 'NO_FOLD');
  const [segmentEdits, setSegmentEdits] = useState<{ [segIdx: number]: { Length: number; Angle: number } }>(endpointFoldInfo?.segmentEdits || {});
  const foldInfo = endpointFoldInfo || undefined;
  // Only use direction value, not setter
  const direction: string = foldInfo?.direction ?? '';
  // Selected fold for rendering and logic
  const selectedFold = selectedId === 'NO_FOLD' ? null : folds.find(f => f.Id === selectedId);

  useEffect(() => {
    // Load folds from local JSON file
    fetch('/src/folds.json')
      .then(res => res.json())
      .then(data => {
        setFolds(data);
      });
  }, []);

  // Reset segment edits when fold changes, and update store
  useEffect(() => {
    if (selectedId === 'NO_FOLD') {
      // Clear local edits; don't mutate global store here to avoid render loops
      setSegmentEdits({});
    } else {
      const fold = folds.find(f => f.Id === selectedId);
      if (fold) {
        const edits: { [segIdx: number]: { Length: number; Angle: number } } = {};
        fold.Segments.forEach((seg, idx) => {
          edits[idx] = { Length: seg.Length, Angle: seg.Angle };
        });
        // Update only local component state. Persist to store when user confirms (handleOk).
        setSegmentEdits(edits);
      }
    }
  }, [selectedId, folds, direction, endpointKey, lineIdx, lines]);

  const emptyFold: Fold = {
    Id: '',
    Name: '',
    Label: '',
    FoldsCount: 0,
    SortOrder: 0,
    IsActive: false,
    Segments: []
  };

  const handleOk = () => {
    const selectedFold = selectedId === 'NO_FOLD' ? null : folds.find(f => f.Id === selectedId);
    if (typeof lineIdx !== 'number' || !lines[lineIdx]) return;
    // If No Fold is selected, remove fold info and clear endpoint
    if (selectedId === 'NO_FOLD') {
      // remove persistent metadata and clear visible endpoint
      removeLineEndpointFold(lineIdx, endpointKey as 'startFold' | 'endFold');
      if (end === 'start') {
        setFirstEndpoint([lines[lineIdx].points[0]], 0, false);
      } else {
        setLastEndpoint([lines[lineIdx].points[lines[lineIdx].points.length - 1]], lines[lineIdx].points.length - 1, false);
      }
      onOk(emptyFold, {});
      // Close dialog after applying
      onClose();
      return;
    }
    const line = lines[lineIdx];
    let startPt;
    let pts;
    const segCount = Object.keys(segmentEdits).length;
    if (end === 'start') {
      // For first endpoint fold, use direction from B to A for first segment
      const A = line.points[0];
      const B = line.points[1];
      startPt = A;
      pts = [A];
      for (let i = 0; i < segCount; i++) {
        const { Length, Angle } = segmentEdits[i];
        let newPt;
        if (i === 0) {
          // First segment: use B → A
          newPt = GetNewPositionByAngleLength(B.x, B.y, A.x, A.y, Length, Angle);
        } else {
          // Subsequent segments: use previous fold segment
          const prev = pts[pts.length - 2] || pts[0];
          const curr = pts[pts.length - 1];
          newPt = GetNewPositionByAngleLength(prev.x, prev.y, curr.x, curr.y, Length, Angle);
        }
        pts.push(newPt);
      }
    } else {
      // For last endpoint fold, use previous logic
      startPt = line.points[line.points.length - 1];
      pts = [startPt];
      for (let i = 0; i < segCount; i++) {
        const { Length, Angle } = segmentEdits[i];
        const prevIdx = pts.length - 2;
        const p0 = pts[prevIdx] || pts[0];
        const p1 = pts[pts.length - 1];
        const newPt = GetNewPositionByAngleLength(
          p0.x, p0.y,
          p1.x, p1.y,
          Length,
          Angle
        );
        pts.push(newPt);
      }
    }
    // Debug: log all points
    console.log('Fold endpoint points:', pts);
    // Persist selection and edits in store via setter
    setLineEndpointFold(lineIdx, endpointKey as 'startFold' | 'endFold', {
      selectedId,
      segmentEdits,
      direction
    });
    // Set endpoint points and highlight the recomputed fold
    if (end === 'start') {
      setFirstEndpoint(pts, 0, true);
    } else {
      setLastEndpoint(pts, line.points.length - 1, true);
    }
    onOk(selectedFold || emptyFold, segmentEdits);
    // Close dialog after applying fold
    onClose();
  };

  if (!open) return null;

  // Show content in a centered card, not using Popover
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/10">
      <div className="min-w-[340px] max-w-[420px] p-1.5 border border-gray-300 rounded-md shadow-xl bg-white font-sans">
        <div className="flex flex-row items-center justify-between mb-3 gap-2">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="w-[180px] text-[15px] px-3 py-2 rounded-md border border-gray-300 bg-gray-50 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
              <SelectValue>
                {selectedId === 'NO_FOLD'
                  ? 'No Fold'
                  : folds.find(f => f.Id === selectedId)?.Label || folds.find(f => f.Id === selectedId)?.Name || 'Select fold'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent side="bottom" align="start" className="z-[3000] bg-white min-w-[180px] max-h-60 overflow-auto border border-gray-300 shadow-lg">
              <SelectItem value="NO_FOLD">No Fold</SelectItem>
              {folds.map(fold => (
                <SelectItem key={fold.Id} value={fold.Id}>{fold.Label || fold.Name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-row gap-2 ml-2">
            <Button variant="ghost" className="flex items-center justify-center bg-gray-200 hover:bg-gray-300 px-2 py-1" onClick={() => { console.log('Opposite clicked', selectedFold); }} aria-label="Opposite">
              <Shuffle className="w-4 h-4 text-gray-700" />
            </Button>
            <Button
              variant="ghost"
              className="flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700 px-2 py-1"
              onClick={handleOk}
              aria-label="OK"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button variant="ghost" className="flex items-center justify-center text-white bg-gray-500 hover:bg-gray-600 px-2 py-1" onClick={onClose} aria-label="Close">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Segment inputs for selected fold */}
        {(end === 'end' || end === 'start') && selectedFold && (
          <div className="mt-2 mb-4">
            {Object.keys(segmentEdits).map((idxStr) => {
              const idx = Number(idxStr);
              const seg = selectedFold.Segments[idx] || { Length: 50, Angle: 0, IsLengthEditable: true, IsAngleEditable: true, MinLength: 1, MaxLength: 999 };
              return (
                <div key={idx} className="flex gap-4 items-center mb-2">
                  <label className="text-[15px] text-gray-800 font-medium flex items-center">
                    Length
                    <input
                      type="number"
                      value={segmentEdits[idx]?.Length ?? seg.Length}
                      disabled={!seg.IsLengthEditable}
                      min={seg.MinLength}
                      max={seg.MaxLength}
                      step={0.1}
                      className={`ml-2 w-[68px] rounded-md border border-gray-300 px-2 py-1 text-[15px] ${seg.IsLengthEditable ? 'bg-white' : 'bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                      onChange={e => {
                        setSegmentEdits((edits: typeof segmentEdits) => {
                          const updated = {
                            ...edits,
                            [idx]: {
                              ...edits[idx],
                              Length: Number(e.target.value)
                            }
                          };
                          return updated;
                        });
                      }}
                    />
                    <span className="ml-1 text-gray-500 text-[15px]">px</span>
                  </label>
                  <label className="text-[15px] text-gray-800 font-medium flex items-center ml-3">
                    Angle
                    <input
                      type="number"
                      value={segmentEdits[idx]?.Angle ?? seg.Angle}
                      disabled={!seg.IsAngleEditable}
                      min={-360}
                      max={360}
                      step={0.1}
                      className={`ml-2 w-[68px] rounded-md border border-gray-300 px-2 py-1 text-[15px] ${seg.IsAngleEditable ? 'bg-white' : 'bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition`}
                      onChange={e => {
                        setSegmentEdits((edits: typeof segmentEdits) => {
                          const updated = {
                            ...edits,
                            [idx]: {
                              ...edits[idx],
                              Angle: Number(e.target.value)
                            }
                          };
                          return updated;
                        });
                      }}
                    />
                    <span className="ml-1 text-gray-500 text-[15px]">°</span>
                  </label>
                </div>
              );
            })}
            <Button
              variant="outline"
              className="mt-2 w-full text-[15px] border border-blue-400 text-blue-700 hover:bg-blue-50"
              onClick={() => {
                const nextIdx = Object.keys(segmentEdits).length;
                setSegmentEdits(edits => {
                  const updated = {
                    ...edits,
                    [nextIdx]: { Length: 50, Angle: 0 }
                  };
                  return updated;
                });
              }}
            >
              + Add Segment
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoldDialog;
