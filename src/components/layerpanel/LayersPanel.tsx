import React from 'react';
import useDrawingsStore from '../../store/drawingsStore';
import { LayerSegmentsList, LayerAnglesList } from './index';

export const LayersPanel: React.FC = () => {
  const { drawings, activeDrawingId } = useDrawingsStore();
  const activeDrawing = activeDrawingId ? drawings[activeDrawingId] : null;

  if (!activeDrawing) {
    return (
      <div className="layers-panel">
        <h3>Layers</h3>
        <p className="empty-state">No active drawing</p>
      </div>
    );
  }

  return (
    <div className="layers-panel">
      <div className="panel-header">
        <h3>Drawing: {activeDrawing.name}</h3>
        <div className="drawing-info">
          <span>Type: {activeDrawing.type}</span>
          <span>Lines: {activeDrawing.lines.length}</span>
          <span>Visible: {activeDrawing.visible ? 'Yes' : 'No'}</span>
          <span>Locked: {activeDrawing.locked ? 'Yes' : 'No'}</span>
        </div>
      </div>

      <div className="panel-content">
        <LayerSegmentsList drawing={activeDrawing} />
        <LayerAnglesList drawing={activeDrawing} />
      </div>
    </div>
  );
};

export default LayersPanel;
