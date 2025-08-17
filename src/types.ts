export type Point = { x: number; y: number };
export type FoldEndpointInfo = {
    selectedId: string;
    segmentEdits: { [segIdx: number]: { Length: number; Angle: number } };
    direction: string;
};
export type Line = {
    id: string;
    points: Point[];
    color: string;
    startFold?: FoldEndpointInfo;
    endFold?: FoldEndpointInfo;
};
