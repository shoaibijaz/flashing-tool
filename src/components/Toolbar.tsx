import React from 'react';


interface ToolbarProps {
  mode: 'polyline' | 'freehand';
  setMode: (mode: 'polyline' | 'freehand') => void;
  onClear: () => void;
  onFinishPolyline?: () => void;
  canFinishPolyline?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  mode,
  setMode,
  onClear,
  onFinishPolyline,
  canFinishPolyline,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => (
  <div className="flex gap-2 items-center">
    <button
      className={`px-3 py-1 rounded text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50`}
      onClick={onUndo}
      disabled={!canUndo}
      title="Undo (Ctrl+Z)"
    >
      Undo
    </button>
    <button
      className={`px-3 py-1 rounded text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50`}
      onClick={onRedo}
      disabled={!canRedo}
      title="Redo (Ctrl+Y)"
    >
      Redo
    </button>
    <button
      className={`px-3 py-1 rounded text-xs ${mode === 'polyline' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
      onClick={() => setMode('polyline')}
    >
      Polyline
    </button>
    <button
      className={`px-3 py-1 rounded text-xs ${mode === 'freehand' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
      onClick={() => setMode('freehand')}
    >
      Freehand
    </button>
    <button className="ml-2 px-3 py-1 rounded bg-red-500 text-white text-xs hover:bg-red-600" onClick={onClear}>
      Clear
    </button>
    {mode === 'polyline' && canFinishPolyline && onFinishPolyline && (
      <button className="ml-2 px-4 py-1 rounded bg-blue-500 text-white text-xs hover:bg-blue-600" onClick={onFinishPolyline}>
        Finish Polyline
      </button>
    )}
  </div>
);

export default Toolbar;
