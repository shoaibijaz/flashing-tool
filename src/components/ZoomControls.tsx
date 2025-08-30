import React from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Box, Button } from '@radix-ui/themes';
import * as Tooltip from '@radix-ui/react-tooltip';

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
}) => {
  return (
    <Box className="absolute bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 flex flex-row items-center gap-2 z-20">
      <Tooltip.Root delayDuration={200}>
        <Tooltip.Trigger asChild>
          <Button
            onClick={onZoomOut}
            color="gray"
            variant="soft"
            className="p-2 rounded cursor-pointer"
            size="2"
          >
            <ZoomOut size={20} />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content side="top" className="radix-tooltip z-50 bg-gray-900 text-white px-3 py-2 rounded shadow-md text-xs font-medium">Zoom Out</Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
      <Box className="px-2 py-1 text-sm font-medium text-gray-700 bg-gray-50 rounded min-w-[56px] text-center select-none">
        {Math.round(zoom * 100)}%
      </Box>
      <Tooltip.Root delayDuration={200}>
        <Tooltip.Trigger asChild>
          <Button
            onClick={onZoomIn}
            color="gray"
            variant="soft"
            className="p-2 rounded cursor-pointer"
            size="2"
          >
            <ZoomIn size={20} />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content side="top" className="radix-tooltip z-50 bg-gray-900 text-white px-3 py-2 rounded shadow-md text-xs font-medium">Zoom In</Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Box>
  );
};

export default ZoomControls;
