import React from 'react';

interface ZoomControlsProps {
  zoom: number;
  setZoom: (z: number) => void;
  minZoom: number;
  maxZoom: number;
  zoomStep: number;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({ zoom, setZoom, minZoom, maxZoom, zoomStep }) => (
  <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-white/80 dark:bg-neutral-800/80 rounded shadow px-2 py-1">
    <button
      className="px-2 py-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-lg font-bold"
      onClick={() => setZoom(Math.max(minZoom, +(zoom - zoomStep).toFixed(2)))}
      aria-label="Zoom out"
    >
      -
    </button>
    <span className="text-xs w-12 text-center select-none">{Math.round(zoom * 100)}%</span>
    <button
      className="px-2 py-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-lg font-bold"
      onClick={() => setZoom(Math.min(maxZoom, +(zoom + zoomStep).toFixed(2)))}
      aria-label="Zoom in"
    >
      +
    </button>
  </div>
);

export default ZoomControls;
