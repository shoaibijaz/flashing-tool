import React from 'react';
import useDrawingsStore from '../../store/drawingsStore';
import type { Drawing, Point } from '../../types/core';

interface LayerSegmentsListProps {
  drawing: Drawing;
}

export const LayerSegmentsList: React.FC<LayerSegmentsListProps> = ({ drawing }) => {
  const { updateDrawingLines } = useDrawingsStore();

  const handlePointEdit = (lineIndex: number, pointIndex: number, newPoint: Point) => {
    const newLines = [...drawing.lines];
    const newPoints = [...newLines[lineIndex].points];
    newPoints[pointIndex] = newPoint;
    newLines[lineIndex] = { ...newLines[lineIndex], points: newPoints };
    updateDrawingLines(drawing.id, newLines);
  };

  const formatLength = (length: number): string => {
    return length.toFixed(2);
  };

  const getSegmentLength = (p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  if (drawing.lines.length === 0) {
    return (
      <div className="segments-list">
        <h4>Lines & Points</h4>
        <p className="empty-state">No lines in this drawing</p>
      </div>
    );
  }

  return (
    <div className="segments-list">
      <h4>Lines & Points ({drawing.lines.length} lines)</h4>
      <div className="lines-container">
        {drawing.lines.map((line, lineIndex) => (
          <div key={line.id} className="line-item">
            <div className="line-header">
              <span className="line-label">Line {lineIndex + 1}</span>
              <span className="line-info">
                {line.points.length} points
              </span>
            </div>
            
            <div className="line-details">
              <div className="points-list">
                {line.points.map((point, pointIndex) => (
                  <div key={pointIndex} className="point-row">
                    <label>Point {pointIndex + 1}:</label>
                    <div className="point-inputs">
                      <input
                        type="number"
                        value={point.x.toFixed(2)}
                        onChange={(e) => handlePointEdit(lineIndex, pointIndex, {
                          x: Number(e.target.value),
                          y: point.y
                        })}
                        step="0.01"
                        className="coord-input"
                        placeholder="X"
                      />
                      <input
                        type="number"
                        value={point.y.toFixed(2)}
                        onChange={(e) => handlePointEdit(lineIndex, pointIndex, {
                          x: point.x,
                          y: Number(e.target.value)
                        })}
                        step="0.01"
                        className="coord-input"
                        placeholder="Y"
                      />
                    </div>
                    {pointIndex > 0 && (
                      <div className="segment-info">
                        <span>
                          Length: {formatLength(getSegmentLength(line.points[pointIndex - 1], point))}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="line-properties">
                <div className="property-row">
                  <label>Color:</label>
                  <input
                    type="color"
                    value={line.color}
                    onChange={(e) => {
                      const newLines = [...drawing.lines];
                      newLines[lineIndex] = { ...line, color: e.target.value };
                      updateDrawingLines(drawing.id, newLines);
                    }}
                    className="color-input"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LayerSegmentsList;
