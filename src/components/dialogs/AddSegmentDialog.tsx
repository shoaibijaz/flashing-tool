import React from 'react';
import { useDialogStore } from '../../store/dialogStore';
import { useDrawingStore } from '../../store/drawingStore';
import { Button } from '../ui/button';
import { Popover, PopoverContent } from '../ui/popover';
import { Check, X } from 'lucide-react';
import type { Point, Line } from '../../types';
import { GetNewPositionByAngleLength } from '../../utils/geometryUtils';

export interface AddSegmentDialogProps {
  open: boolean;
  anchor: { x: number; y: number };
  end: 'start' | 'end';
  lineIdx: number;
}

const AddSegmentDialog: React.FC<AddSegmentDialogProps> = ({ open, anchor, end, lineIdx }) => {
  const { closeDialog } = useDialogStore();
  const [length, setLength] = React.useState<number>(50);
  const [angle, setAngle] = React.useState<number>(90);
  const setLines = useDrawingStore(state => state.setLines);
  const lines = useDrawingStore(state => state.lines);
  if (!open || !anchor) return null;
  // Ensure length and angle are always valid numbers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'length') {
      const num = Number(value);
      setLength(num > 0 ? num : 50);
    } else if (name === 'angle') {
      const num = Number(value);
      setAngle(!isNaN(num) ? num : 90);
    }
  };

  function addSegmentToLine(
    lines: Line[],
    lineIdx: number,
    end: 'start' | 'end',
    length: number,
    angle: number,
    setLines: (lines: Line[]) => void,
    closeDialog: () => void
  ) {
    if (lineIdx !== undefined && end) {
      // Validate length and angle before adding
      if (!length || isNaN(length) || length <= 0) {
        alert('Please enter a valid segment length (> 0).');
        return;
      }
      if (isNaN(angle)) {
        alert('Please enter a valid angle.');
        return;
      }
      // Add a new segment to the selected line in global store
      const updatedLines = [...lines];
      const line = updatedLines[lineIdx];
      if (!line) return;
      const points = [...line.points];
      let basePt: Point, nextPt: Point;
      if (end === 'end') {
        basePt = points[points.length - 1];
        nextPt = points[points.length - 2] || basePt;
      } else {
        basePt = points[0];
        nextPt = points[1] || basePt;
      }
      // Use geometry util for new segment endpoint
      const newPt: Point = GetNewPositionByAngleLength(
        nextPt.x, nextPt.y,
        basePt.x, basePt.y,
        length,
        angle
      );
      if (end === 'end') {
        points.push(newPt);
      } else {
        points.unshift(newPt);
      }
      line.points = points;
      setLines(updatedLines);
      closeDialog();
    }
  }

  return (
    <Popover open>
      <PopoverContent
        sideOffset={8}
        align="start"
        className="min-w-[260px] p-1.5 border border-gray-300 rounded-md shadow-xl bg-white"
        style={{ position: 'absolute', left: anchor.x + 80, top: anchor.y + 50 }}
      >
        <div className="flex flex-row gap-4 mb-3">
          <div className="flex flex-col items-start">
            <label className="text-[15px] mb-1">Length (px):</label>
            <input
              type="number"
              name="length"
              value={length}
              onChange={handleChange}
              min={0.1}
              className="w-[120px] px-3 py-2 rounded-md border border-gray-300 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              autoFocus
            />
          </div>
          <div className="flex flex-col items-start">
            <label className="text-[15px] mb-1">Angle (deg):</label>
            <input
              type="number"
              name="angle"
              value={angle}
              onChange={handleChange}
              min={1}
              className="w-[120px] px-3 py-2 rounded-md border border-gray-300 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>
        </div>
        <div className="flex flex-row gap-2 justify-end">
          <Button
            variant="default"
            className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-2"
            onClick={() => addSegmentToLine(lines, lineIdx, end, length, angle, setLines, closeDialog)}
          >
            <Check className="w-4 h-4 mr-1" />
            Add Segment
          </Button>
          <Button
            variant="secondary"
            className="bg-gray-300 text-gray-700 hover:bg-gray-400 px-3 py-2"
            onClick={closeDialog}
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AddSegmentDialog;
