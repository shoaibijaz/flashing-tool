import React, { useEffect, useState } from 'react';
// No longer need StoreFoldEndpointInfo
import { Button } from "../ui/button";
import { Check, X, Shuffle } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";
import { useDrawingStore } from '../../store/drawingStore';


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
  onClose: () => void;
}

const FoldDialog: React.FC<FoldDialogProps> = ({ open, end, onClose }) => {
  // No longer need DrawingLine or FoldEndpointInfo interfaces
  const firstEndpoint = useDrawingStore(s => s.firstEndpoint);
  const lastEndpoint = useDrawingStore(s => s.lastEndpoint);
  const setFirstEndpoint = useDrawingStore(s => s.setFirstEndpoint);
  const setLastEndpoint = useDrawingStore(s => s.setLastEndpoint);
  const removeFirstEndpoint = useDrawingStore(s => s.removeFirstEndpoint);
  const removeLastEndpoint = useDrawingStore(s => s.removeLastEndpoint);
  // Use dialogStore only for lineIdx
  const [folds, setFolds] = useState<Fold[]>([]);
  // Use global endpoint state for fold info
  const endpointInfo = end === 'start' ? firstEndpoint : end === 'end' ? lastEndpoint : null;
  const [selectedId, setSelectedId] = useState<string>(endpointInfo?.selectedId || 'NO_FOLD');
  const [segmentEdits, setSegmentEdits] = useState<{ [segIdx: number]: { Length: number; Angle: number } }>(endpointInfo?.segmentEdits || {});
  const direction: string = endpointInfo?.direction ?? '';
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
  }, [selectedId, folds, direction]);



  const handleOk = () => {
    if (selectedId === 'NO_FOLD') {
      if (end === 'start') removeFirstEndpoint();
      if (end === 'end') removeLastEndpoint();
      onClose();
      return;
    }
    const info = { selectedId, segmentEdits, direction };
    console.log('FoldDialog handleOk:', info, end);
    if (end === 'start') setFirstEndpoint(info);
    if (end === 'end') setLastEndpoint(info);
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

// Live preview recompute effect injected below component definition
// (Keep outside default export modifications above)
