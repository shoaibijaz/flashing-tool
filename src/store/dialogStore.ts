
import { create } from 'zustand';

export type DialogType = 'addSegment' | 'editSegment' | 'endpoint' | 'fold' | 'editAngle' | null;

export interface BaseDialog {
    open: boolean;
    type: DialogType;
    anchor: { x: number; y: number } | null;
}

export interface AddSegmentDialog extends BaseDialog {
    type: 'addSegment';
    end: 'start' | 'end';
    lineIdx: number;
}

export interface EditSegmentDialog extends BaseDialog {
    type: 'editSegment';
    length: string;
    segIdx: number;
    lineIdx: number;
}

export interface EndpointDialog extends BaseDialog {
    type: 'endpoint';
}

export interface FoldDialog extends BaseDialog {
    type: 'fold';
    end?: 'start' | 'end';
    lineIdx?: number;
}

export interface EditAngleDialog extends BaseDialog {
    type: 'editAngle';
    angle: string;
    segIdx: number;
    lineIdx: number;
}

export type DialogState =
    | AddSegmentDialog
    | EditSegmentDialog
    | EndpointDialog
    | FoldDialog
    | EditAngleDialog
    | BaseDialog;

export const useDialogStore = create<DialogState & {
    openDialog: (type: DialogType, options?: Partial<DialogState>) => void;
    closeDialog: () => void;
    setField: <K extends keyof DialogState>(field: K, value: DialogState[K]) => void;
    switchDialog: (type: DialogType, options?: Partial<DialogState>) => void;
}>(set => ({
    open: false,
    type: null,
    anchor: null,
    openDialog: (type, options = {}) => set(state => ({ ...state, ...options, open: true, type })),
    closeDialog: () => set(state => ({ ...state, open: false, type: null })),
    setField: (field, value) => set(state => ({ ...state, [field]: value })),
    switchDialog: (type, options = {}) => set(state => ({ ...state, ...options, open: true, type })),
}));
