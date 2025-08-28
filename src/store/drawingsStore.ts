import { create } from 'zustand';
import type { Line, Drawing, DrawingId, DrawingType } from '../types/core';

// Options for sync operations
export interface SyncOptions {
    preserveEndpoints?: boolean;
    scaleProportionally?: boolean;
    preserveAngles?: boolean;
    syncOnlySegments?: number[];
}

// Store interface
interface DrawingsState {
    // Registry of all drawings
    drawings: Record<DrawingId, Drawing>;

    // Currently active drawing ID
    activeDrawingId: DrawingId | null;

    // Drawing order for rendering (first is bottom layer)
    drawingOrder: DrawingId[];

    // History for undo/redo per drawing
    history: {
        past: Record<DrawingId, Line[][]>;
        future: Record<DrawingId, Line[][]>;
    };

    // Actions
    addDrawing: (drawing: Drawing) => void;
    removeDrawing: (id: DrawingId) => void;
    setActiveDrawing: (id: DrawingId) => void;
    updateDrawingLines: (id: DrawingId, lines: Line[]) => void;
    updateDrawing: (id: DrawingId, updates: Partial<Omit<Drawing, 'id'>>) => void;
    syncDrawings: (sourceId: DrawingId, targetId: DrawingId, syncOptions?: SyncOptions) => void;
    clearAll: () => void;
    undo: (id?: DrawingId) => void;
    redo: (id?: DrawingId) => void;
    getDrawingByType: (type: DrawingType) => Drawing | undefined;
}

const DEFAULT_DRAWING_ID = 'original';

// Helper for deep copying lines (simplified for new types)
const deepCopyLines = (lines: Line[]): Line[] => {
    return lines.map(line => ({
        ...line,
        points: line.points.map(pt => ({ ...pt })),
        metadata: line.metadata ? { ...line.metadata } : undefined,
    }));
};

const useDrawingsStore = create<DrawingsState>((set, get) => ({
    drawings: {
        [DEFAULT_DRAWING_ID]: {
            id: DEFAULT_DRAWING_ID,
            name: 'Original',
            type: 'original',
            lines: [],
            visible: true,
            locked: false
        }
    },
    activeDrawingId: DEFAULT_DRAWING_ID,
    drawingOrder: [DEFAULT_DRAWING_ID],
    history: {
        past: { [DEFAULT_DRAWING_ID]: [] },
        future: { [DEFAULT_DRAWING_ID]: [] }
    },

    addDrawing: (drawing: Drawing) => set((state) => {
        // Initialize history entries for the new drawing
        const updatedPast = { ...state.history.past };
        const updatedFuture = { ...state.history.future };
        updatedPast[drawing.id] = [];
        updatedFuture[drawing.id] = [];

        return {
            drawings: { ...state.drawings, [drawing.id]: drawing },
            drawingOrder: [...state.drawingOrder, drawing.id],
            history: {
                past: updatedPast,
                future: updatedFuture
            }
        };
    }),

    removeDrawing: (id: DrawingId) => set((state) => {
        // Can't remove default original drawing
        if (id === DEFAULT_DRAWING_ID) return state;

        // Create new objects without the removed drawing
        const newDrawings = { ...state.drawings };
        delete newDrawings[id];

        const newOrder = state.drawingOrder.filter((drawingId: DrawingId) => drawingId !== id);

        // If removing active drawing, switch to original
        const newActiveId = state.activeDrawingId === id
            ? DEFAULT_DRAWING_ID
            : state.activeDrawingId;

        // Remove from history
        const newPast = { ...state.history.past };
        const newFuture = { ...state.history.future };
        delete newPast[id];
        delete newFuture[id];

        return {
            drawings: newDrawings,
            drawingOrder: newOrder,
            activeDrawingId: newActiveId,
            history: {
                past: newPast,
                future: newFuture
            }
        };
    }),

    setActiveDrawing: (id: DrawingId) => set((state) => {
        if (!state.drawings[id]) return state;
        return { activeDrawingId: id };
    }),

    updateDrawingLines: (id: DrawingId, lines: Line[]) => set((state) => {
        if (!state.drawings[id]) return state;

        // Save current lines to history
        const currentLines = state.drawings[id].lines;
        const updatedPast = { ...state.history.past };
        if (!updatedPast[id]) updatedPast[id] = [];
        updatedPast[id] = [...updatedPast[id], currentLines];

        // Cap history length for memory management
        if (updatedPast[id].length > 30) {
            updatedPast[id] = updatedPast[id].slice(-30);
        }

        // Clear future history on new change
        const updatedFuture = { ...state.history.future };
        updatedFuture[id] = [];

        return {
            drawings: {
                ...state.drawings,
                [id]: {
                    ...state.drawings[id],
                    lines
                }
            },
            history: {
                past: updatedPast,
                future: updatedFuture
            }
        };
    }),

    updateDrawing: (id: DrawingId, updates: Partial<Omit<Drawing, 'id'>>) => set((state) => {
        if (!state.drawings[id]) return state;

        // Lines updates should go through updateDrawingLines to handle history
        const { lines, ...otherUpdates } = updates;

        // If lines are included, handle through updateDrawingLines
        if (lines) {
            get().updateDrawingLines(id, lines);
        }

        // Apply other updates
        if (Object.keys(otherUpdates).length > 0) {
            return {
                drawings: {
                    ...state.drawings,
                    [id]: {
                        ...state.drawings[id],
                        ...otherUpdates
                    }
                }
            };
        }

        return state;
    }),

    syncDrawings: (sourceId: DrawingId, targetId: DrawingId, syncOptions: SyncOptions = {}) => set((state) => {
        const source = state.drawings[sourceId];
        const target = state.drawings[targetId];

        if (!source || !target) return state;

        let newLines: Line[];

        // Default full copy if no special options
        if (Object.keys(syncOptions).length === 0) {
            // Deep copy lines from source
            newLines = deepCopyLines(source.lines);
        } else {
            // Handle special sync options
            // TODO: Implement special sync options like preserveEndpoints, preserveAngles

            // This would be expanded based on your specific requirements
            // For now just do a basic copy
            newLines = deepCopyLines(source.lines);
        }

        // Update target with new lines through updateDrawingLines to trigger history
        get().updateDrawingLines(targetId, newLines);

        // Update the sourceId relationship
        return {
            drawings: {
                ...state.drawings,
                [targetId]: {
                    ...state.drawings[targetId],
                    sourceId
                }
            }
        };
    }),

    clearAll: () => set({
        drawings: {
            [DEFAULT_DRAWING_ID]: {
                id: DEFAULT_DRAWING_ID,
                name: 'Original',
                type: 'original',
                lines: [],
                visible: true,
                locked: false
            }
        },
        activeDrawingId: DEFAULT_DRAWING_ID,
        drawingOrder: [DEFAULT_DRAWING_ID],
        history: {
            past: { [DEFAULT_DRAWING_ID]: [] },
            future: { [DEFAULT_DRAWING_ID]: [] }
        }
    }),

    undo: (id?: DrawingId) => set((state) => {
        // If no ID provided, use active drawing
        const drawingId = id || state.activeDrawingId;
        if (!drawingId || !state.drawings[drawingId]) return state;

        const past = state.history.past[drawingId];
        if (!past || past.length === 0) return state;

        // Get the previous lines state
        const previousLines = past[past.length - 1];

        // Update future history
        const currentLines = state.drawings[drawingId].lines;
        const updatedFuture = { ...state.history.future };
        if (!updatedFuture[drawingId]) updatedFuture[drawingId] = [];
        updatedFuture[drawingId] = [currentLines, ...updatedFuture[drawingId]];

        // Remove last item from past
        const updatedPast = { ...state.history.past };
        updatedPast[drawingId] = past.slice(0, -1);

        return {
            drawings: {
                ...state.drawings,
                [drawingId]: {
                    ...state.drawings[drawingId],
                    lines: previousLines
                }
            },
            history: {
                past: updatedPast,
                future: updatedFuture
            }
        };
    }),

    redo: (id?: DrawingId) => set((state) => {
        // If no ID provided, use active drawing
        const drawingId = id || state.activeDrawingId;
        if (!drawingId || !state.drawings[drawingId]) return state;

        const future = state.history.future[drawingId];
        if (!future || future.length === 0) return state;

        // Get the next lines state
        const nextLines = future[0];

        // Update past history
        const currentLines = state.drawings[drawingId].lines;
        const updatedPast = { ...state.history.past };
        if (!updatedPast[drawingId]) updatedPast[drawingId] = [];
        updatedPast[drawingId] = [...updatedPast[drawingId], currentLines];

        // Remove first item from future
        const updatedFuture = { ...state.history.future };
        updatedFuture[drawingId] = future.slice(1);

        return {
            drawings: {
                ...state.drawings,
                [drawingId]: {
                    ...state.drawings[drawingId],
                    lines: nextLines
                }
            },
            history: {
                past: updatedPast,
                future: updatedFuture
            }
        };
    }),

    getDrawingByType: (type: DrawingType) => {
        const { drawings } = get();
        return Object.values(drawings).find(drawing => drawing.type === type);
    }
}));

export default useDrawingsStore;
export type { DrawingType };
