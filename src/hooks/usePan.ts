import { useState, useCallback } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import type { Point } from '../types/core';
import type { KonvaEventObject } from 'konva/lib/Node';

export const usePan = (isDrawingMode: boolean) => {
    const { settings, updateCanvas } = useSettingsStore();

    // Right-click drag for move mode
    const [dragStartPosition, setDragStartPosition] = useState<Point | null>(null);
    const [initialPan, setInitialPan] = useState<Point | null>(null);

    const handleRightClickDragStart = useCallback((e: KonvaEventObject<MouseEvent>) => {
        if (isDrawingMode) return;
        console.log('Started right-click dragging drawing');

        const stage = e.target.getStage();
        if (!stage) return;

        const pos = stage.getPointerPosition();
        if (pos) {
            setDragStartPosition(pos);
            setInitialPan({ x: settings.canvas.panX, y: settings.canvas.panY });
        }
    }, [isDrawingMode, settings.canvas.panX, settings.canvas.panY]);

    const handleRightClickDragMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
        if (isDrawingMode || !dragStartPosition || !initialPan) return;

        const stage = e.target.getStage();
        if (!stage) return;

        const pos = stage.getPointerPosition();
        if (pos) {
            const deltaX = pos.x - dragStartPosition.x;
            const deltaY = pos.y - dragStartPosition.y;

            updateCanvas({
                panX: initialPan.x + deltaX,
                panY: initialPan.y + deltaY
            });
        }
    }, [isDrawingMode, dragStartPosition, initialPan, updateCanvas]);

    const handleRightClickDragEnd = useCallback(() => {
        if (isDrawingMode) return;
        console.log('Finished right-click dragging drawing');
        setDragStartPosition(null);
        setInitialPan(null);
    }, [isDrawingMode]);

    return {
        panX: settings.canvas.panX,
        panY: settings.canvas.panY,
        handleRightClickDragStart,
        handleRightClickDragMove,
        handleRightClickDragEnd
    };
};
