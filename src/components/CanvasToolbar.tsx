import React from 'react';
import { Lock, LockOpen } from 'lucide-react';

interface CanvasToolbarProps {
  isLocked?: boolean;
  onLockClick?: () => void;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({ 
  isLocked = false, 
  onLockClick
}) => {
  return (
    <div className="absolute top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-1 flex flex-col gap-1 z-20 pointer-events-auto">
      {/* Lock Button */}
      <button
        onClick={onLockClick}
        className={`p-2 rounded transition-colors ${
          isLocked 
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
  );
};

export default CanvasToolbar;
