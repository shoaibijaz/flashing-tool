import React, { useState } from 'react';
import { Lock, LockOpen, Image, Grid, Settings } from 'lucide-react';
import { IconButton } from '@radix-ui/themes';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useSettingsStore } from '../store/settingsStore';
import BackgroundSettingsPanel from './BackgroundSettingsPanel';

interface CanvasToolbarProps {
  isLocked?: boolean;
  onLockClick?: () => void;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  isLocked = false,
  onLockClick
}) => {
  const { settings, updateCanvas } = useSettingsStore();
  const { canvas } = settings;
  const [showSettings, setShowSettings] = useState(false);

  const handleGridToggle = () => {
    updateCanvas({ showGrid: !canvas.showGrid });
  };

  const handleBackgroundImageToggle = () => {
    updateCanvas({ showBackgroundImage: !canvas.showBackgroundImage });
  };

  return (
    <>
      {/* Settings Panel */}
      <BackgroundSettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <div className="absolute top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex flex-col gap-2 z-20 pointer-events-auto">
        {/* Settings Button */}
        <Tooltip.Root delayDuration={200}>
          <Tooltip.Trigger asChild>
            <IconButton
              onClick={() => setShowSettings(!showSettings)}
              color={showSettings ? 'purple' : 'gray'}
              variant="soft"
              size="2"
              aria-label="Background Settings"
            >
              <Settings size={24} />
            </IconButton>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="left" className="radix-tooltip z-50 bg-gray-900 text-white px-3 py-2 rounded shadow-md text-xs font-medium">Background Settings</Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
        {/* Grid Toggle Button */}
        <Tooltip.Root delayDuration={200}>
          <Tooltip.Trigger asChild>
            <IconButton
              onClick={handleGridToggle}
              color={canvas.showGrid ? 'blue' : 'gray'}
              variant="soft"
              size="2"
              aria-label={canvas.showGrid ? 'Hide Grid' : 'Show Grid'}
            >
              <Grid size={24} />
            </IconButton>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="left" className="radix-tooltip z-50 bg-gray-900 text-white px-3 py-2 rounded shadow-md text-xs font-medium">{canvas.showGrid ? 'Hide Grid' : 'Show Grid'}</Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>

        {/* Background Image Toggle Button */}
        <Tooltip.Root delayDuration={200}>
          <Tooltip.Trigger asChild>
            <IconButton
              onClick={handleBackgroundImageToggle}
              color={canvas.showBackgroundImage ? 'green' : 'gray'}
              variant="soft"
              size="2"
              aria-label={canvas.showBackgroundImage ? 'Hide Background Image' : 'Show Background Image'}
            >
              <Image size={24} />
            </IconButton>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="left" className="radix-tooltip z-50 bg-gray-900 text-white px-3 py-2 rounded shadow-md text-xs font-medium">{canvas.showBackgroundImage ? 'Hide Background Image' : 'Show Background Image'}</Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>

        {/* Lock Button */}
        <Tooltip.Root delayDuration={200}>
          <Tooltip.Trigger asChild>
            <IconButton
              onClick={onLockClick}
              color={isLocked ? 'red' : 'gray'}
              variant="soft"
              size="2"
              aria-label={isLocked ? 'Unlock Drawing' : 'Lock Drawing'}
            >
              {isLocked ? (
                <Lock size={24} className="text-red-700" />
              ) : (
                <LockOpen size={24} className="text-gray-700" />
              )}
            </IconButton>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="left" className="radix-tooltip z-50 bg-gray-900 text-white px-3 py-2 rounded shadow-md text-xs font-medium">{isLocked ? 'Unlock Drawing' : 'Lock Drawing'}</Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>
    </>
  );
};

export default CanvasToolbar;
