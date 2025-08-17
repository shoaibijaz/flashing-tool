import { create } from 'zustand';
import type { Line } from '../types';
import { rotatePointsAround } from '../utils/geometryUtils';

interface EndpointInfo {
    selectedId: string;
    segmentEdits: { [segIdx: number]: { Length: number; Angle: number } };
    direction: string;
    highlight?: boolean;
}

interface DrawingState {
    lines: Line[];
    history: Line[][];
    future: Line[][];
    firstEndpoint: EndpointInfo | null;
    lastEndpoint: EndpointInfo | null;
    addLine: (line: Line) => void;
    clear: () => void;
    setLines: (lines: Line[]) => void;
    setFirstEndpoint: (info: Omit<EndpointInfo, 'highlight'>, highlight?: boolean) => void;
    setLastEndpoint: (info: Omit<EndpointInfo, 'highlight'>, highlight?: boolean) => void;
    removeFirstEndpoint: () => void;
    removeLastEndpoint: () => void;
    undo: () => void;
    redo: () => void;
    rotateSubchainAroundIndex: (lineIdx: number, pivotIndex: number, rotateNext: boolean, deltaRad: number) => void;
}

export const useDrawingStore = create<DrawingState>((set, get) => ({
    lines: [],
    history: [],
    future: [],
    firstEndpoint: null,
    lastEndpoint: null,
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
            firstEndpoint: null,
            lastEndpoint: null,
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
    setFirstEndpoint: (info, highlight = false) => {
        set({ firstEndpoint: { ...info, highlight } });
    },
    setLastEndpoint: (info, highlight = false) => {
        set({ lastEndpoint: { ...info, highlight } });
    },
    removeFirstEndpoint: () => {
        set({ firstEndpoint: null });
    },
    removeLastEndpoint: () => {
        set({ lastEndpoint: null });
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
    rotateSubchainAroundIndex: (lineIdx: number, pivotIndex: number, rotateNext: boolean, deltaRad: number) => {
        const { lines } = get();
        if (!lines[lineIdx]) return;
        const updatedLines = [...lines];
        const line = { ...updatedLines[lineIdx], points: [...updatedLines[lineIdx].points] };
        const pivot = line.points[pivotIndex];
        if (!pivot) return;
        if (rotateNext) {
            const tail = line.points.slice(pivotIndex + 1);
            const newTail = rotatePointsAround(pivot, tail, deltaRad);
            line.points = [
                ...line.points.slice(0, pivotIndex + 1),
                ...newTail,
            ];
        } else {
            const head = line.points.slice(0, pivotIndex);
            const newHead = rotatePointsAround(pivot, head, deltaRad);
            line.points = [
                ...newHead,
                ...line.points.slice(pivotIndex),
            ];
        }
        updatedLines[lineIdx] = line;
        set({ history: [...get().history, get().lines], lines: updatedLines, future: [] });
    },
}));
