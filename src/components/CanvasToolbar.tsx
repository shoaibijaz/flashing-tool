import React, { useState } from 'react';
import { Lock, LockOpen, Image, Grid, Settings } from 'lucide-react';
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

      <div className="absolute top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-1 flex flex-col gap-1 z-20 pointer-events-auto">
        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded transition-colors ${showSettings
              ? 'bg-purple-100 hover:bg-purple-200 text-purple-700'
              : 'hover:bg-gray-100 text-gray-700'
            }`}
          title="Background Settings"
        >
          <Settings size={18} />
        </button>
        {/* Grid Toggle Button */}
        <button
          onClick={handleGridToggle}
          className={`p-2 rounded transition-colors ${canvas.showGrid
            ? 'bg-blue-100 hover:bg-blue-200 text-blue-700'
            : 'hover:bg-gray-100 text-gray-400'
            }`}
          title={canvas.showGrid ? "Hide Grid" : "Show Grid"}
        >
          <Grid size={18} />
        </button>

        {/* Background Image Toggle Button */}
        <button
          onClick={handleBackgroundImageToggle}
          className={`p-2 rounded transition-colors ${canvas.showBackgroundImage
            ? 'bg-green-100 hover:bg-green-200 text-green-700'
            : 'hover:bg-gray-100 text-gray-400'
            }`}
          title={canvas.showBackgroundImage ? "Hide Background Image" : "Show Background Image"}
        >
          <Image size={18} />
        </button>

        {/* Lock Button */}
        <button
          onClick={onLockClick}
          className={`p-2 rounded transition-colors ${isLocked
            ? 'bg-red-100 hover:bg-red-200 text-red-700'
            : 'hover:bg-gray-100 text-gray-700'
            }`}
          title={isLocked ? "Unlock Drawing" : "Lock Drawing"}
        >
          {isLocked ? (
            <Lock size={18} className="text-red-700" />
          ) : (
            <LockOpen size={18} className="text-gray-700" />
          )}
        </button>
      </div>
    </>
  );
};

export default CanvasToolbar;
