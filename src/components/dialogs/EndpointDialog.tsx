
import React from 'react';
import { Button } from '../ui/button';
import { Popover, PopoverContent } from '../ui/popover';
import { Plus, Split, X } from 'lucide-react';
import { useDialogStore } from '../../store/dialogStore';

export interface EndpointDialogProps {
  open: boolean;
  anchor: { x: number; y: number };
}

const EndpointDialog: React.FC<EndpointDialogProps> = ({ open, anchor }) => {
  const { switchDialog, closeDialog } = useDialogStore();
  if (!open || !anchor) return null;
  const handleSwitchDialog = (dialogType: 'addSegment' | 'fold') => {
    switchDialog(dialogType, { anchor });
  };
  return (
    <Popover open>
      <PopoverContent
        sideOffset={8}
        align="start"
        className="min-w-[200px] p-1.5 border border-gray-300 rounded-md shadow-xl bg-white"
        style={{ position: 'absolute', left: anchor.x + 80, top: anchor.y + 50 }}
      >
        <div className="flex flex-row gap-2 items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => handleSwitchDialog('addSegment')}
            className="flex items-center gap-1 bg-blue-600 text-white hover:bg-blue-700 px-2 py-1"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Segment</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleSwitchDialog('fold')}
            className="flex items-center gap-1 bg-blue-600 text-white hover:bg-blue-700 px-2 py-1"
          >
            <Split className="w-4 h-4" />
            <span className="font-medium">Folding</span>
          </Button>
          <Button
            variant="ghost"
            onClick={closeDialog}
            className="flex items-center gap-1 bg-gray-300 text-gray-700 hover:bg-gray-400 px-2 py-1"
          >
            <X className="w-4 h-4" />
            <span className="font-medium">Cancel</span>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EndpointDialog;
