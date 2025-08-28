import { useCallback } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import type { KonvaEventObject } from 'konva/lib/Node';

export const useZoom = () => {
    const { settings, updateCanvas } = useSettingsStore();

    // Zoom controls
    const ZOOM_STEP = 0.1;
    const MIN_ZOOM = 0.1;
    const MAX_ZOOM = 5;

    const handleZoomIn = useCallback(() => {
        const newZoom = Math.min(settings.canvas.zoom + ZOOM_STEP, MAX_ZOOM);
        updateCanvas({ zoom: newZoom });
    }, [settings.canvas.zoom, updateCanvas]);

    const handleZoomOut = useCallback(() => {
        const newZoom = Math.max(settings.canvas.zoom - ZOOM_STEP, MIN_ZOOM);
        updateCanvas({ zoom: newZoom });
    }, [settings.canvas.zoom, updateCanvas]);

    const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();

        const scaleBy = 1.02;
        const stage = e.target.getStage();
        if (!stage) return;

        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        let direction = e.evt.deltaY > 0 ? -1 : 1;
        if (e.evt.ctrlKey) {
            direction = -direction;
        }

        const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
        const clampedScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newScale));

        const newPos = {
            x: pointer.x - mousePointTo.x * clampedScale,
            y: pointer.y - mousePointTo.y * clampedScale,
        };

        updateCanvas({
            zoom: clampedScale,
            panX: newPos.x,
            panY: newPos.y
        });
    }, [updateCanvas]);

    return {
        zoom: settings.canvas.zoom,
        handleZoomIn,
        handleZoomOut,
        handleWheel
    };
};
