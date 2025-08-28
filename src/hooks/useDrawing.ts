import { useState, useCallback } from 'react';
import useDrawingsStore from '../store/drawingsStore';
import { useSettingsStore } from '../store/settingsStore';
import type { Point, Line as LineType } from '../types/core';
import type { KonvaEventObject } from 'konva/lib/Node';

export const useDrawing = () => {
    const {
        drawings,
        activeDrawingId,
        addDrawing,
        setActiveDrawing,
        updateDrawingLines,
        updateDrawing
    } = useDrawingsStore();

    const { settings } = useSettingsStore();

    // Canvas state for drawing
    const [polyPoints, setPolyPoints] = useState<Point[]>([]);
    const [hoverPoint, setHoverPoint] = useState<Point | null>(null);
    const [isDrawingMode, setIsDrawingMode] = useState<boolean>(true);

    const activeDrawing = activeDrawingId ? drawings[activeDrawingId] : null;

    const handleCreateDrawing = useCallback(() => {
        const newDrawing = {
            id: `drawing-${Date.now()}`,
            name: `Drawing ${Object.keys(drawings).length + 1}`,
            type: 'original' as const,
            lines: [],
            visible: true,
            locked: false
        };
        addDrawing(newDrawing);
        setActiveDrawing(newDrawing.id);
    }, [drawings, addDrawing, setActiveDrawing]);

    const handleStageClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
        if (!activeDrawing || activeDrawing.locked || !isDrawingMode) {
            console.log('Drawing disabled: locked or not in drawing mode');
            return;
        }

        const stage = e.target.getStage();
        if (!stage) return;

        const pos = stage.getPointerPosition();
        if (!pos) return;

        // Transform coordinates to account for zoom and pan
        const transform = stage.getAbsoluteTransform().copy();
        transform.invert();
        const transformedPos = transform.point(pos);

        const newPoint: Point = { x: transformedPos.x, y: transformedPos.y };
        console.log('Adding point:', newPoint, 'from screen pos:', pos);

        // Add point to polyline
        const newPolyPoints = [...polyPoints, newPoint];
        setPolyPoints(newPolyPoints);

        // If we have at least 2 points, create/update a line
        if (newPolyPoints.length >= 2) {
            const newLine: LineType = {
                id: `line-${Date.now()}`,
                points: newPolyPoints,
                color: settings.appearance.lineColor
            };

            // Update the drawing with the new line
            const newLines = [...activeDrawing.lines];
            if (newLines.length === 0) {
                newLines.push(newLine);
            } else {
                // Update the last line with new points
                newLines[newLines.length - 1] = newLine;
            }

            updateDrawingLines(activeDrawing.id, newLines);
            console.log('Line updated with', newPolyPoints.length, 'points');
        }
    }, [activeDrawing, isDrawingMode, polyPoints, settings.appearance.lineColor, updateDrawingLines]);

    const handleStageMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
        if (!activeDrawing) return;

        const stage = e.target.getStage();
        if (!stage) return;

        const pos = stage.getPointerPosition();
        if (pos) {
            // Transform coordinates to account for zoom and pan
            const transform = stage.getAbsoluteTransform().copy();
            transform.invert();
            const transformedPos = transform.point(pos);

            setHoverPoint({ x: transformedPos.x, y: transformedPos.y });
        }
    }, [activeDrawing]);

    const handleStageMouseLeave = useCallback(() => {
        setHoverPoint(null);
    }, []);

    const handlePointDrag = useCallback((idx: number, e: KonvaEventObject<DragEvent>) => {
        // Prevent dragging if drawing is locked
        if (!activeDrawing || activeDrawing.locked) {
            return;
        }

        const newPoints = [...polyPoints];
        const pos = e.target.position();
        // Point drag coordinates are already in the correct coordinate space
        newPoints[idx] = { x: pos.x, y: pos.y };
        setPolyPoints(newPoints);
    }, [polyPoints, activeDrawing]);

    const handleFinishedLinePointDrag = useCallback((lineIdx: number, ptIdx: number, e: KonvaEventObject<DragEvent>) => {
        // Prevent dragging if drawing is locked
        if (!activeDrawing || activeDrawing.locked) {
            return;
        }

        const pos = e.target.position();
        // Point drag coordinates are already in the correct coordinate space
        const newLines = [...activeDrawing.lines];
        const newPoints = [...newLines[lineIdx].points];
        newPoints[ptIdx] = { x: pos.x, y: pos.y };
        newLines[lineIdx] = { ...newLines[lineIdx], points: newPoints };

        updateDrawingLines(activeDrawing.id, newLines);
    }, [activeDrawing, updateDrawingLines]);

    const handleLabelDragMove = useCallback((lineIdx: number, segmentIdx: number, e: KonvaEventObject<DragEvent>) => {
        // Prevent dragging if drawing is locked
        if (!activeDrawing || activeDrawing.locked) {
            return;
        }

        const pos = e.target.position();
        const newLines = [...activeDrawing.lines];
        const line = newLines[lineIdx];

        // Initialize labelPositions array if it doesn't exist
        if (!line.labelPositions) {
            line.labelPositions = [];
        }

        // Ensure labelPositions array has enough elements
        while (line.labelPositions.length <= segmentIdx) {
            line.labelPositions.push({ x: 0, y: 0 });
        }

        // Update the label position
        line.labelPositions[segmentIdx] = { x: pos.x, y: pos.y };
        newLines[lineIdx] = { ...line };

        updateDrawingLines(activeDrawing.id, newLines);
    }, [activeDrawing, updateDrawingLines]);

    const handleAngleLabelDragMove = useCallback((lineIdx: number, vertexIdx: number, e: KonvaEventObject<DragEvent>) => {
        // Prevent dragging if drawing is locked
        if (!activeDrawing || activeDrawing.locked) {
            return;
        }

        const pos = e.target.position();
        const newLines = [...activeDrawing.lines];
        const line = newLines[lineIdx];

        // Calculate the correct array length for interior vertices
        const numInteriorVertices = Math.max(0, line.points.length - 2);

        // Initialize angleLabelPositions array if it doesn't exist
        if (!line.angleLabelPositions) {
            line.angleLabelPositions = new Array(numInteriorVertices).fill(null);
        }

        // Ensure angleLabelPositions array has the correct length
        if (line.angleLabelPositions.length !== numInteriorVertices) {
            const newArray = new Array(numInteriorVertices).fill(null);
            // Copy existing positions to new array
            for (let i = 0; i < Math.min(line.angleLabelPositions.length, numInteriorVertices); i++) {
                newArray[i] = line.angleLabelPositions[i];
            }
            line.angleLabelPositions = newArray;
        }

        // Update the angle label position if vertexIdx is valid
        if (vertexIdx >= 0 && vertexIdx < line.angleLabelPositions.length) {
            line.angleLabelPositions[vertexIdx] = { x: pos.x, y: pos.y };
        }

        newLines[lineIdx] = { ...line };

        updateDrawingLines(activeDrawing.id, newLines);
    }, [activeDrawing, updateDrawingLines]);

    const finishDrawing = useCallback(() => {
        if (isDrawingMode && polyPoints.length >= 2) {
            console.log('Finishing current drawing');
            console.log('Current polyPoints:', polyPoints);

            // Finish current polyline and switch to move mode (only with 2+ points)
            console.log('Completing drawing with', polyPoints.length, 'points');
            // The line is already saved in the store from the last click, so we just need to reset
            setPolyPoints([]);
            setIsDrawingMode(false);
            console.log('Drawing completed, switched to move mode');
        } else {
            console.log('Cannot finish drawing: need at least 2 points, current:', polyPoints.length);
        }
    }, [isDrawingMode, polyPoints]);

    const handleContextMenu = useCallback((e: KonvaEventObject<PointerEvent>) => {
        e.evt.preventDefault();
        finishDrawing();
    }, [finishDrawing]);

    const clearDrawing = useCallback(() => {
        if (!activeDrawing) return;

        console.log('Clearing current drawing');
        // Clear all lines from the current drawing
        updateDrawingLines(activeDrawing.id, []);
        // Clear current polyline points
        setPolyPoints([]);
        // Switch back to drawing mode
        setIsDrawingMode(true);
        console.log('Drawing cleared, switched to drawing mode');
    }, [activeDrawing, updateDrawingLines]);

    const toggleLock = useCallback(() => {
        if (!activeDrawing) return;

        updateDrawing(activeDrawing.id, {
            locked: !activeDrawing.locked
        });

        // If locking while in drawing mode, finish current drawing
        if (!activeDrawing.locked && isDrawingMode && polyPoints.length >= 2) {
            finishDrawing();
        }
    }, [activeDrawing, updateDrawing, isDrawingMode, polyPoints.length, finishDrawing]);

    return {
        // State
        polyPoints,
        hoverPoint,
        isDrawingMode,
        activeDrawing,
        drawings,

        // Handlers
        handleCreateDrawing,
        handleStageClick,
        handleStageMouseMove,
        handleStageMouseLeave,
        handlePointDrag,
        handleFinishedLinePointDrag,
        handleLabelDragMove,
        handleAngleLabelDragMove,
        handleContextMenu,
        finishDrawing,
        clearDrawing,
        toggleLock,

        // Computed
        canFinishDrawing: polyPoints.length >= 2
    };
};
