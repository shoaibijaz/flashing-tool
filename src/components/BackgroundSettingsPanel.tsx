import React from 'react';
import { X } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';

interface BackgroundSettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const BackgroundSettingsPanel: React.FC<BackgroundSettingsPanelProps> = ({
    isOpen,
    onClose
}) => {
    const { settings, updateCanvas } = useSettingsStore();
    const { canvas } = settings;

    const backgroundOptions = [
        { label: 'None', value: '' },
        { label: 'Test Background', value: '/test-background.svg' },
        { label: 'Blueprint Style', value: '/blueprint-background.svg' },
        { label: 'Roof Diagram', value: '/roof-diagram.svg' },
        { label: 'Vite Logo', value: '/vite.svg' },
    ];

    const fitOptions = [
        { label: 'Contain', value: 'contain' },
        { label: 'Cover', value: 'cover' },
        { label: 'Fill', value: 'fill' },
        { label: 'None', value: 'none' },
        { label: 'Scale Down', value: 'scale-down' },
    ];

    if (!isOpen) return null;

    return (
        <div className="absolute top-4 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-30 min-w-64">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Background Settings</h3>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 rounded"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="space-y-4">
                {/* Show Background Image Toggle */}
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="showBackgroundImage"
                        checked={canvas.showBackgroundImage}
                        onChange={(e) => updateCanvas({ showBackgroundImage: e.target.checked })}
                        className="rounded border-gray-300"
                    />
                    <label htmlFor="showBackgroundImage" className="text-sm text-gray-700">
                        Show Background Image
                    </label>
                </div>

                {/* Background Image URL */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Background Image
                    </label>
                    <select
                        value={canvas.backgroundImageUrl}
                        onChange={(e) => updateCanvas({ backgroundImageUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                        {backgroundOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Background Fit Mode */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fit Mode
                    </label>
                    <select
                        value={canvas.backgroundImageFit}
                        onChange={(e) => updateCanvas({ backgroundImageFit: e.target.value as 'contain' | 'cover' | 'fill' | 'none' | 'scale-down' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                        {fitOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Background Opacity */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Opacity: {Math.round(canvas.backgroundImageOpacity * 100)}%
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={canvas.backgroundImageOpacity}
                        onChange={(e) => updateCanvas({ backgroundImageOpacity: parseFloat(e.target.value) })}
                        className="w-full"
                    />
                </div>

                {/* Grid Settings */}
                <hr className="border-gray-200" />
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="showGrid"
                        checked={canvas.showGrid}
                        onChange={(e) => updateCanvas({ showGrid: e.target.checked })}
                        className="rounded border-gray-300"
                    />
                    <label htmlFor="showGrid" className="text-sm text-gray-700">
                        Show Grid
                    </label>
                </div>

                {/* Grid Size */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grid Size: {canvas.gridSize}px
                    </label>
                    <input
                        type="range"
                        min="10"
                        max="50"
                        step="5"
                        value={canvas.gridSize}
                        onChange={(e) => updateCanvas({ gridSize: parseInt(e.target.value) })}
                        className="w-full"
                    />
                </div>

                {/* Grid Opacity */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grid Opacity: {Math.round(canvas.gridOpacity * 100)}%
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={canvas.gridOpacity}
                        onChange={(e) => updateCanvas({ gridOpacity: parseFloat(e.target.value) })}
                        className="w-full"
                    />
                </div>
            </div>
        </div>
    );
};

export default BackgroundSettingsPanel;
