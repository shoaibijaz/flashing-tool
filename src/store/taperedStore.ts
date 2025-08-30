import { create } from 'zustand';
import type { TaperedDiagram, TaperedSegment, Point, Line, DrawingId, CanvasMode } from '../types/core';

interface TaperedState {
    // Currently active tapered diagram
    activeTaperedDiagram: TaperedDiagram | null;

    // Current canvas mode
    canvasMode: CanvasMode;

    // Actions
    createTaperedDiagram: (originalDrawing: Line, originalDrawingId: DrawingId) => void;
    updateTaperedSegmentLength: (segmentIndex: number, newLength: number) => void;
    switchToOriginal: () => void;
    switchToTapered: () => void;
    clearTaperedDiagram: () => void;
}

// Helper function to calculate distance between two points
const calculateDistance = (p1: Point, p2: Point): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

// Helper function to recalculate points based on tapered lengths while preserving angles
const recalculatePoints = (segments: TaperedSegment[]): Point[] => {
    if (segments.length === 0) return [];

    const points: Point[] = [segments[0].startPoint];
    let currentAngle = segments[0].angle; // Start with first segment's direction

    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const startPoint = points[i];

        if (i === 0) {
            // First segment: use stored angle as direction
            currentAngle = segment.angle;
        } else {
            // Subsequent segments: add turn angle to current direction
            currentAngle += segment.angle;
        }

        // Calculate end point based on angle and tapered length
        const endPoint = {
            x: startPoint.x + Math.cos(currentAngle) * segment.taperedLength,
            y: startPoint.y + Math.sin(currentAngle) * segment.taperedLength
        };

        points.push(endPoint);
    }

    return points;
};

const useTaperedStore = create<TaperedState>((set, get) => ({
    activeTaperedDiagram: null,
    canvasMode: 'original',

    createTaperedDiagram: (originalDrawing: Line, originalDrawingId: DrawingId) => {
        const points = originalDrawing.points;
        if (points.length < 2) return;

        // Create segments from the original drawing
        const segments: TaperedSegment[] = [];

        for (let i = 0; i < points.length - 1; i++) {
            const startPoint = points[i];
            const endPoint = points[i + 1];
            const originalLength = calculateDistance(startPoint, endPoint);

            // Calculate angle for this segment (direction angle relative to horizontal)
            let angle = 0;
            if (i === 0) {
                // First segment: calculate direction angle
                angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
            } else {
                // For subsequent segments, calculate the turn angle from previous segment
                const prevPoint = points[i - 1];
                const currentPoint = points[i];
                const nextPoint = points[i + 1];

                // Direction vectors
                const prevDir = {
                    x: currentPoint.x - prevPoint.x,
                    y: currentPoint.y - prevPoint.y
                };
                const nextDir = {
                    x: nextPoint.x - currentPoint.x,
                    y: nextPoint.y - currentPoint.y
                };

                // Calculate angle between vectors
                const prevAngle = Math.atan2(prevDir.y, prevDir.x);
                const nextAngle = Math.atan2(nextDir.y, nextDir.x);

                angle = nextAngle - prevAngle;
                // Normalize angle to [0, 2π]
                if (angle < 0) angle += 2 * Math.PI;
            }

            segments.push({
                originalLength,
                taperedLength: originalLength, // Start with original length
                angle,
                startPoint: { ...startPoint },
                endPoint: { ...endPoint }
            });
        }

        const taperedDiagram: TaperedDiagram = {
            id: `tapered_${Date.now()}`,
            name: 'Tapered Diagram',
            originalDrawingId,
            segments,
            points: [...points], // Copy of original points
            createdAt: new Date(),
            modifiedAt: new Date()
        };

        set({
            activeTaperedDiagram: taperedDiagram,
            canvasMode: 'tapered'
        });
    },

    updateTaperedSegmentLength: (segmentIndex: number, newLength: number) => {
        const { activeTaperedDiagram } = get();
        if (!activeTaperedDiagram || segmentIndex >= activeTaperedDiagram.segments.length) {
            return;
        }

        // Update the segment length
        const updatedSegments = [...activeTaperedDiagram.segments];
        updatedSegments[segmentIndex] = {
            ...updatedSegments[segmentIndex],
            taperedLength: newLength
        };

        // Recalculate all points to preserve angles
        const newPoints = recalculatePoints(updatedSegments);

        // Update start and end points for all segments
        for (let i = 0; i < updatedSegments.length; i++) {
            updatedSegments[i].startPoint = newPoints[i];
            updatedSegments[i].endPoint = newPoints[i + 1];
        }

        const updatedDiagram: TaperedDiagram = {
            ...activeTaperedDiagram,
            segments: updatedSegments,
            points: newPoints,
            modifiedAt: new Date()
        };

        set({
            activeTaperedDiagram: updatedDiagram
        });
    },

    switchToOriginal: () => {
        set({ canvasMode: 'original' });
    },

    switchToTapered: () => {
        const { activeTaperedDiagram } = get();
        if (activeTaperedDiagram) {
            set({ canvasMode: 'tapered' });
        }
    },

    clearTaperedDiagram: () => {
        set({
            activeTaperedDiagram: null,
            canvasMode: 'original'
        });
    }
}));

export default useTaperedStore;
