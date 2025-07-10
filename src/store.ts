import { create } from 'zustand';

export type Point = { x: number; y: number };
export type Line = { id: string; points: Point[]; color: string };

interface DrawingState {
    lines: Line[];
    currentLine: Point[];
    startLine: (point: Point) => void;
    addPoint: (point: Point) => void;
    endLine: () => void;
    clear: () => void;
    addLine: (line: Line) => void;
}

export const useDrawingStore = create<DrawingState>((set) => ({
    lines: [],
    currentLine: [],
    startLine: (point) => set({ currentLine: [point] }),
    addPoint: (point) => set((state) => ({ currentLine: [...state.currentLine, point] })),
    endLine: () => set((state) => state.currentLine.length > 1 ? {
        lines: [...state.lines, { id: Date.now().toString(), points: state.currentLine, color: '#60a5fa' }],
        currentLine: []
    } : { currentLine: [] }),
    clear: () => set({ lines: [], currentLine: [] }),
    addLine: (line) => set((state) => ({ lines: [...state.lines, line] })),
}));
