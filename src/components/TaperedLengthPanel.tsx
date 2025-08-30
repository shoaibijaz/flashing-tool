import React, { useState } from 'react';
import useTaperedStore from '../store/taperedStore';

const TaperedLengthPanel: React.FC = () => {
    const { activeTaperedDiagram, updateTaperedSegmentLength, canvasMode } = useTaperedStore();
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [tempValue, setTempValue] = useState<string>('');

    if (canvasMode !== 'tapered' || !activeTaperedDiagram) {
        return null;
    }

    const handleEditStart = (index: number, currentLength: number) => {
        setEditingIndex(index);
        setTempValue(currentLength.toString());
    };

    const handleEditSave = (index: number) => {
        const newLength = parseFloat(tempValue);
        if (!isNaN(newLength) && newLength > 0) {
            updateTaperedSegmentLength(index, newLength);
        }
        setEditingIndex(null);
        setTempValue('');
    };

    const handleEditCancel = () => {
        setEditingIndex(null);
        setTempValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Enter') {
            handleEditSave(index);
        } else if (e.key === 'Escape') {
            handleEditCancel();
        }
    };

    return (
        <div className="absolute top-16 right-4 bg-white border border-gray-300 rounded-md shadow-lg p-4 z-20 w-64">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Tapered Lengths</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {activeTaperedDiagram.segments.map((segment, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                        <div className="flex flex-col flex-1">
                            <span className="text-xs text-gray-500">Segment {index + 1}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">
                                    Orig: {segment.originalLength.toFixed(1)}
                                </span>
                                {editingIndex === index ? (
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            value={tempValue}
                                            onChange={(e) => setTempValue(e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, index)}
                                            className="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded"
                                            autoFocus
                                            step="0.1"
                                            min="0.1"
                                        />
                                        <button
                                            onClick={() => handleEditSave(index)}
                                            className="px-1 py-0.5 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                        >
                                            ✓
                                        </button>
                                        <button
                                            onClick={handleEditCancel}
                                            className="px-1 py-0.5 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleEditStart(index, segment.taperedLength)}
                                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        {segment.taperedLength.toFixed(1)}
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="text-xs text-gray-500">
                            {segment.angle > 0 ? `∠${segment.angle.toFixed(1)}°` : ''}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-3 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                    Click on any length to edit. Angles are preserved.
                </p>
            </div>
        </div>
    );
};

export default TaperedLengthPanel;
