// Core geometric types for the Flashing Creator
export interface Point {
    x: number;
    y: number;
}

export interface Line {
    id: string;
    points: Point[];
    color: string;
    // Custom label positions for each segment (optional)
    labelPositions?: Point[];
    // Custom angle label positions for each vertex (optional)
    angleLabelPositions?: Point[];
    // Optional metadata for future features
    metadata?: Record<string, unknown>;
}

// Drawing registry types
export type DrawingId = string;
export type DrawingType = 'original' | 'tapered' | 'custom';

export interface Drawing {
    id: DrawingId;
    name: string;
    type: DrawingType;
    lines: Line[];
    visible: boolean;
    locked: boolean;
    sourceId?: DrawingId; // For derived drawings like tapered
    metadata?: Record<string, unknown>;
}

// Segment data for layers panel (simplified, no labels)
export interface SegmentData {
    index: number;
    length: number;
    angle: number; // Angle in degrees from previous segment
    startPoint: Point;
    endPoint: Point;
}

// Angle data for layers panel (simplified, no labels)
export interface AngleData {
    index: number;
    angle: number; // Interior angle in degrees
    vertex: Point;
    prevSegment: SegmentData;
    nextSegment: SegmentData;
}

// Settings types (simplified for initial implementation)
export interface AppearanceSettings {
    lineColor: string;
    lineWidth: number;
    pointSize: number;
    highlightColor: string;
    backgroundColor: string;
    darkMode: boolean;
}

export interface PrecisionSettings {
    lengthDecimals: number;
    angleDecimals: number;
    units: 'imperial' | 'metric';
}

export interface SnappingSettings {
    enabled: boolean;
    tolerance: number;
    snapToGrid: boolean;
    snapToPoints: boolean;
    snapToLines: boolean;
}

export interface CanvasSettings {
    showGrid: boolean;
    gridSize: number;
    gridOpacity: number;
    zoom: number;
    panX: number;
    panY: number;
    showLengths: boolean;
    showLengthBubbles: boolean;
    showAngles: boolean;
    // Background image settings
    showBackgroundImage: boolean;
    backgroundImageUrl: string;
    backgroundImageOpacity: number;
    backgroundImageFit: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

export interface AppSettings {
    appearance: AppearanceSettings;
    precision: PrecisionSettings;
    snapping: SnappingSettings;
    canvas: CanvasSettings;
}

// Operation types for undo/redo system
export type OperationType =
    | 'addLine'
    | 'removeLine'
    | 'modifyLine'
    | 'addPoint'
    | 'removePoint'
    | 'movePoint'
    | 'clear';

export interface Operation {
    type: OperationType;
    drawingId: DrawingId;
    timestamp: number;
    data: unknown; // Operation-specific data
}

// Geometry calculation results
export interface GeometryInfo {
    totalLength: number;
    segmentCount: number;
    segments: SegmentData[];
    angles: AngleData[];
}
