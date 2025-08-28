import React from 'react';
import type { Drawing, Point } from '../../types/core';

interface LayerAnglesListProps {
  drawing: Drawing;
}

export const LayerAnglesList: React.FC<LayerAnglesListProps> = ({ drawing }) => {
  const formatAngle = (angle: number): string => {
    return angle.toFixed(1) + '°';
  };

  const calculateAngle = (p1: Point, vertex: Point, p2: Point): number => {
    const v1x = p1.x - vertex.x;
    const v1y = p1.y - vertex.y;
    const v2x = p2.x - vertex.x;
    const v2y = p2.y - vertex.y;
    
    const angle1 = Math.atan2(v1y, v1x);
    const angle2 = Math.atan2(v2y, v2x);
    
    let angle = angle2 - angle1;
    if (angle < 0) angle += 2 * Math.PI;
    
    return (angle * 180) / Math.PI;
  };

  // Calculate angles from the lines in the drawing
  const angles: Array<{ vertex: Point; angle: number; index: number }> = [];
  
  drawing.lines.forEach((line) => {
    if (line.points.length >= 3) {
      for (let i = 1; i < line.points.length - 1; i++) {
        const p1 = line.points[i - 1];
        const vertex = line.points[i];
        const p2 = line.points[i + 1];
        
        const angle = calculateAngle(p1, vertex, p2);
        angles.push({ vertex, angle, index: i });
      }
    }
  });

  if (angles.length === 0) {
    return (
      <div className="angles-list">
        <h4>Angles</h4>
        <p className="empty-state">No angles in this drawing (need at least 3 points in a line)</p>
      </div>
    );
  }

  return (
    <div className="angles-list">
      <h4>Angles ({angles.length})</h4>
      <div className="angles-container">
        {angles.map((angleData, index) => (
          <div key={index} className="angle-item">
            <div className="angle-header">
              <span className="angle-label">Angle {index + 1}</span>
              <span className="angle-value">
                {formatAngle(angleData.angle)}
              </span>
            </div>
            
            <div className="angle-details">
              <div className="vertex-info">
                <label>Vertex:</label>
                <span className="coordinates">
                  ({angleData.vertex.x.toFixed(2)}, {angleData.vertex.y.toFixed(2)})
                </span>
              </div>
              
              <div className="angle-type">
                <span className={`type ${angleData.angle > 180 ? 'reflex' : 'normal'}`}>
                  {angleData.angle > 180 ? 'Reflex' : 
                   Math.abs(angleData.angle - 180) < 0.1 ? 'Straight' :
                   Math.abs(angleData.angle - 90) < 0.1 ? 'Right' : 
                   angleData.angle < 90 ? 'Acute' : 'Obtuse'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LayerAnglesList;
