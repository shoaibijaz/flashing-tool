import { create } from 'zustand';
import type { Line } from '../types';

interface DrawingState {
    lines: Line[];
    history: Line[][];
    future: Line[][];
    addLine: (line: Line) => void;
    clear: () => void;
    setLines: (lines: Line[]) => void;
    undo: () => void;
    redo: () => void;
}

export const useDrawingStore = create<DrawingState>((set, get) => ({
    lines: [],
    history: [],
    future: [],
    addLine: (line: Line) => {
        const { lines, history } = get();
        set({
            history: [...history, lines],
            lines: [...lines, line],
            future: [],
        });
    },
    clear: () => {
        const { lines, history } = get();
        if (lines.length === 0) return;
        set({
            history: [...history, lines],
            lines: [],
            future: [],
        });
    },
    setLines: (newLines: Line[]) => {
        const { lines, history } = get();
        set({
            history: [...history, lines],
            lines: newLines,
            future: [],
        });
    },
    undo: () => {
        const { history, lines, future } = get();
        if (history.length === 0) return;
        const prev = history[history.length - 1];
        set({
            lines: prev,
            history: history.slice(0, -1),
            future: [lines, ...future],
        });
    },
    redo: () => {
        const { history, lines, future } = get();
        if (future.length === 0) return;
        const next = future[0];
        set({
            lines: next,
            history: [...history, lines],
            future: future.slice(1),
        });
    },
}));
