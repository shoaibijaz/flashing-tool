import { create } from 'zustand';
import type { Line, Point, FoldEndpointInfo } from '../types';
import { rotatePointsAround } from '../utils/geometryUtils';

interface EndpointInfo {
    points: Point[];
    connectedIdx: number | null;
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
    setFirstEndpoint: (points: Point[], connectedIdx: number | null, highlight?: boolean) => void;
    setLastEndpoint: (points: Point[], connectedIdx: number | null, highlight?: boolean) => void;
    removeFirstEndpoint: () => void;
    removeLastEndpoint: () => void;
    undo: () => void;
    redo: () => void;
    rotateSubchainAroundIndex: (lineIdx: number, pivotIndex: number, rotateNext: boolean, deltaRad: number) => void;
    // New setters for fold metadata on lines
    setLineEndpointFold: (lineIdx: number, endpointKey: 'startFold' | 'endFold', foldInfo: FoldEndpointInfo | undefined) => void;
    removeLineEndpointFold: (lineIdx: number, endpointKey: 'startFold' | 'endFold') => void;
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
    setFirstEndpoint: (points, connectedIdx, highlight = false) => {
        set({ firstEndpoint: { points, connectedIdx, highlight } });
    },
    setLastEndpoint: (points, connectedIdx, highlight = false) => {
        set({ lastEndpoint: { points, connectedIdx, highlight } });
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
    setLineEndpointFold: (lineIdx: number, endpointKey: 'startFold' | 'endFold', foldInfo: FoldEndpointInfo | undefined) => {
        const { lines } = get();
        if (!lines[lineIdx]) return;
        const updatedLines = [...lines];
        const line = { ...updatedLines[lineIdx] } as Line & Partial<Record<'startFold' | 'endFold', FoldEndpointInfo>>;
        line[endpointKey] = foldInfo;
        updatedLines[lineIdx] = line;
        set({ history: [...get().history, get().lines], lines: updatedLines, future: [] });
    },
    removeLineEndpointFold: (lineIdx: number, endpointKey: 'startFold' | 'endFold') => {
        const { lines } = get();
        if (!lines[lineIdx]) return;
        const updatedLines = [...lines];
        const line = { ...updatedLines[lineIdx] } as Line & Partial<Record<'startFold' | 'endFold', FoldEndpointInfo>>;
        delete line[endpointKey];
        updatedLines[lineIdx] = line;
        set({ history: [...get().history, get().lines], lines: updatedLines, future: [] });
    },
}));
