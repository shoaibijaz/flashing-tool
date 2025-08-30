import { useState, useCallback } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import type { Point } from '../types/core';
import type { KonvaEventObject } from 'konva/lib/Node';

export const usePan = (isDrawingMode: boolean) => {
    const { settings, updateCanvas } = useSettingsStore();

    // Pan drag for both right-click and Ctrl+left-click in move mode
    const [dragStartPosition, setDragStartPosition] = useState<Point | null>(null);
    const [initialPan, setInitialPan] = useState<Point | null>(null);
    const [isPanning, setIsPanning] = useState(false);

    const handleRightClickDragStart = useCallback((e: KonvaEventObject<MouseEvent>) => {
        // Handle right-click OR Ctrl+left-click for panning
        const isRightClick = e.evt.button === 2;
        const isCtrlLeftClick = e.evt.button === 0 && (e.evt.ctrlKey || e.evt.metaKey);
        
        if (isDrawingMode || (!isRightClick && !isCtrlLeftClick)) return;
        
        console.log('Started pan dragging:', isRightClick ? 'right-click' : 'Ctrl+left-click');

        const stage = e.target.getStage();
        if (!stage) return;

        const pos = stage.getPointerPosition();
        if (pos) {
            setDragStartPosition(pos);
            setInitialPan({ x: settings.canvas.panX, y: settings.canvas.panY });
            setIsPanning(true);
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
        if (isDrawingMode || !dragStartPosition) return;
        console.log('Finished pan dragging');
        setDragStartPosition(null);
        setInitialPan(null);
        setIsPanning(false);
    }, [isDrawingMode, dragStartPosition]);

    return {
        panX: settings.canvas.panX,
        panY: settings.canvas.panY,
        isPanning,
        handleRightClickDragStart,
        handleRightClickDragMove,
        handleRightClickDragEnd
    };
};
