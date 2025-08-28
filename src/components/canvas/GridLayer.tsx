import React from 'react';
import { Layer, Line } from 'react-konva';
import useSettingsStore from '../../store/settingsStore';

interface GridLayerProps {
  width: number;
  height: number;
}

const GridLayer: React.FC<GridLayerProps> = ({ width, height }) => {
  const { settings } = useSettingsStore();

  if (!settings.canvas.showGrid) return null;

  const gridLines: React.ReactNode[] = [];
  const gridSize = settings.canvas.gridSize;
  const gridOpacity = settings.canvas.gridOpacity;
  
  // Vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    gridLines.push(
      <Line
        key={`grid-v-${x}`}
        points={[x, 0, x, height]}
        stroke={settings.appearance.darkMode ? '#333' : '#e0e0e0'}
        strokeWidth={0.5}
        opacity={gridOpacity}
        listening={false}
      />
    );
  }
  
  // Horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    gridLines.push(
      <Line
        key={`grid-h-${y}`}
        points={[0, y, width, y]}
        stroke={settings.appearance.darkMode ? '#333' : '#e0e0e0'}
        strokeWidth={0.5}
        opacity={gridOpacity}
        listening={false}
      />
    );
  }

  return (
    <Layer listening={false}>
      {gridLines}
    </Layer>
  );
};

export default GridLayer;
