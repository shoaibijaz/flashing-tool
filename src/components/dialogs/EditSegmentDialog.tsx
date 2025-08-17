import React from 'react';
import { Button } from '../ui/button';
import { useDialogStore } from '../../store/dialogStore';
import { useDrawingStore } from '../../store/drawingStore';

export interface EditSegmentDialogProps {
  open: boolean;
  anchor: { x: number; y: number };
  length: string;
  segIdx: number;
  lineIdx: number;
}

const EditSegmentDialog: React.FC<EditSegmentDialogProps> = ({ open, anchor, length, segIdx, lineIdx }) => {
  const { closeDialog } = useDialogStore();
  const lines = useDrawingStore((s) => s.lines);
  const setLines = useDrawingStore((s) => s.setLines);
  const [localLength, setLocalLength] = React.useState(length);

  React.useEffect(() => {
    setLocalLength(length);
  }, [length]);

  const handleOk = () => {
    const newLength = Number(localLength);
    if (typeof lineIdx === 'number' && typeof segIdx === 'number' && !isNaN(newLength) && newLength > 0) {
      const updatedLines = [...lines];
      const line = updatedLines[lineIdx];
      if (line && line.points && line.points.length > segIdx) {
        // Update the segment by moving the endpoint at segIdx
        const ptA = line.points[segIdx - 1];
        const ptB = line.points[segIdx];
        if (!ptA || !ptB) return;
        const angleRad = Math.atan2(ptB.y - ptA.y, ptB.x - ptA.x);
        const newPt = {
          x: ptA.x + newLength * Math.cos(angleRad),
          y: ptA.y + newLength * Math.sin(angleRad),
        };
        // Move all subsequent points to preserve their relative positions
        const deltaX = newPt.x - ptB.x;
        const deltaY = newPt.y - ptB.y;
        line.points[segIdx] = newPt;
        for (let i = segIdx + 1; i < line.points.length; i++) {
          line.points[i] = {
            x: line.points[i].x + deltaX,
            y: line.points[i].y + deltaY,
          };
        }
        setLines(updatedLines);
      }
    }
    closeDialog();
  };
  if (!open || !anchor) return null;

  // Position dialog near anchor (label)
  // Offset dialog so it doesn't overlap the label
  const DIALOG_OFFSET_Y = 24;
  const dialogStyle: React.CSSProperties = {
    position: 'absolute',
    left: anchor.x,
    top: anchor.y + DIALOG_OFFSET_Y,
    zIndex: 1000,
    transform: 'translate(-50%, 0)', // Center horizontally, offset vertically
    pointerEvents: 'auto',
  };

  return (
    <div style={dialogStyle}>
      <div className="bg-white rounded-lg shadow-lg p-2 min-w-[220px]">
        <div className="flex flex-row items-center gap-2 mb-2">
          <input
            type="number"
            value={localLength}
            onChange={e => setLocalLength(e.target.value)}
            min={0.1}
            className="w-[100px] px-3 py-2 rounded-md border border-gray-300 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            autoFocus
          />
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

export default EditSegmentDialog;
