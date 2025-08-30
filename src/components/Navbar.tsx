import React from 'react';
import { Box, Button } from '@radix-ui/themes';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Eraser, CheckCircle2, PlusCircle, Eye, EyeOff, Trash2 } from 'lucide-react';
import useTaperedStore from '../store/taperedStore';
import type { Drawing } from '../types/core';

interface NavbarProps {
  isDrawingMode?: boolean;
  canFinishDrawing?: boolean;
  onFinishDrawing?: () => void;
  onClearDrawing?: () => void;
  hasFinishedDrawing?: boolean;
  currentDrawing?: Drawing; // Current drawing data for creating tapered
}

const Navbar: React.FC<NavbarProps> = ({
  isDrawingMode = false,
  canFinishDrawing = false,
  onFinishDrawing,
  onClearDrawing,
  hasFinishedDrawing = false,
  currentDrawing
}) => {
  const {
    canvasMode,
    activeTaperedDiagram,
    createTaperedDiagram,
    switchToOriginal,
    switchToTapered,
    clearTaperedDiagram
  } = useTaperedStore();

  const handleCreateTapered = () => {
    if (currentDrawing && currentDrawing.lines && currentDrawing.lines.length > 0) {
      const lastLine = currentDrawing.lines[currentDrawing.lines.length - 1];
      createTaperedDiagram(lastLine, currentDrawing.id);
    }
  };

  const handleSwitchMode = () => {
    if (canvasMode === 'original') {
      switchToTapered();
    } else {
      switchToOriginal();
    }
  };

  const canCreateTapered = hasFinishedDrawing && !isDrawingMode && (currentDrawing?.lines?.length ?? 0) > 0;
  const showTaperedControls = activeTaperedDiagram !== null;

  return (
  <Box as="div" role="navigation" className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-10 relative">
      <Box className="flex items-center">
        <h1 className="text-lg font-semibold text-gray-900">
          Flashing Creator
        </h1>
        {/* Mode indicator */}
        {canvasMode === 'tapered' && (
          <Box as="span" className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
            Tapered Mode
          </Box>
        )}
      </Box>

      <Box className="flex items-center gap-2">
        {/* Tapered diagram controls */}
        {showTaperedControls && (
          <>
            <Tooltip.Root delayDuration={200}>
              <Tooltip.Trigger asChild>
                <Button
                  onClick={handleSwitchMode}
                  color={canvasMode === 'original' ? 'blue' : 'gray'}
                  variant="solid"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {canvasMode === 'original' ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  <span className="hidden sm:inline">{canvasMode === 'original' ? 'View Tapered' : 'View Original'}</span>
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content side="bottom" className="radix-tooltip z-50 bg-gray-900 text-white px-3 py-2 rounded shadow-md text-xs font-medium">{canvasMode === 'original' ? 'View Tapered' : 'View Original'}</Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
            <Tooltip.Root delayDuration={200}>
              <Tooltip.Trigger asChild>
                <Button
                  onClick={() => clearTaperedDiagram()}
                  color="gray"
                  variant="solid"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="hidden sm:inline">Clear Tapered</span>
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content side="bottom" className="radix-tooltip z-50 bg-gray-900 text-white px-3 py-2 rounded shadow-md text-xs font-medium">Clear Tapered</Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </>
        )}

        {/* Create tapered button - only show when original has finished drawing */}
        {canCreateTapered && !showTaperedControls && (
          <Tooltip.Root delayDuration={200}>
            <Tooltip.Trigger asChild>
              <Button
                onClick={handleCreateTapered}
                color="green"
                variant="solid"
                className="flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-5 h-5" />
                <span className="hidden sm:inline">Create Tapered</span>
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="bottom" className="radix-tooltip z-50 bg-gray-900 text-white px-3 py-2 rounded shadow-md text-xs font-medium">Create Tapered</Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        )}

        {/* Clear button - always visible */}
        {onClearDrawing && (
          <Tooltip.Root delayDuration={200}>
            <Tooltip.Trigger asChild>
              <Button
                onClick={() => {
                  if (showTaperedControls) {
                    clearTaperedDiagram();
                  }
                  onClearDrawing();
                }}
                color="red"
                variant="solid"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Eraser className="w-5 h-5" />
                <span className="hidden sm:inline">Clear All</span>
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="bottom" className="radix-tooltip z-50 bg-gray-900 text-white px-3 py-2 rounded shadow-md text-xs font-medium">Clear All</Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        )}

        {/* Finish button - only in drawing mode with 2+ points */}
        {isDrawingMode && canFinishDrawing && onFinishDrawing && (
          <Tooltip.Root delayDuration={200}>
            <Tooltip.Trigger asChild>
              <Button
                onClick={onFinishDrawing}
                color="blue"
                variant="solid"
                className="flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span className="hidden sm:inline">Finish</span>
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="bottom" className="radix-tooltip z-50 bg-gray-900 text-white px-3 py-2 rounded shadow-md text-xs font-medium">Finish</Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        )}
      </Box>
    </Box>
  );
};

export default Navbar;
