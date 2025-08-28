import type { Point, Line, SegmentData, AngleData, GeometryInfo } from '../types/core';

// Basic geometric utility functions
export function getSegmentLength(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

export function degToRad(deg: number): number {
    return deg * Math.PI / 180;
}

export function radToDeg(rad: number): number {
    return rad * 180 / Math.PI;
}

// Returns signed angle (degrees) at vertex 'b' formed by points a-b-c. Range (-180, 180].
export function angleAtVertexDegrees(a: Point, b: Point, c: Point): number {
    const v1x = a.x - b.x;
    const v1y = a.y - b.y;
    const v2x = c.x - b.x;
    const v2y = c.y - b.y;
    const angle = Math.atan2(v1x * v2y - v2x * v1y, v1x * v2x + v1y * v2y);
    let deg = angle * 180 / Math.PI;
    // normalize to (-180, 180]
    if (deg <= -180) deg += 360;
    if (deg > 180) deg -= 360;
    return deg;
}

// Rotate an array of points around a pivot by delta radians (rigid rotation preserves lengths and internal angles)
export function rotatePointsAround(pivot: Point, points: Point[], deltaRad: number): Point[] {
    const cos = Math.cos(deltaRad);
    const sin = Math.sin(deltaRad);
    return points.map(p => {
        const dx = p.x - pivot.x;
        const dy = p.y - pivot.y;
        return {
            x: pivot.x + dx * cos - dy * sin,
            y: pivot.y + dx * sin + dy * cos,
        };
    });
}

// --- Enhanced geometry utilities for the new architecture ---

/**
 * Calculate segment angle from previous segment (in degrees)
 * For first segment, returns 0 (or could be horizontal reference)
 */
export function calculateSegmentAngle(prevPoint: Point | null, startPoint: Point, endPoint: Point): number {
    if (!prevPoint) {
        // First segment - return angle from horizontal
        const dx = endPoint.x - startPoint.x;
        const dy = endPoint.y - startPoint.y;
        return Math.atan2(dy, dx) * 180 / Math.PI;
    }

    // Angle between previous segment and current segment
    const prevDx = startPoint.x - prevPoint.x;
    const prevDy = startPoint.y - prevPoint.y;
    const currDx = endPoint.x - startPoint.x;
    const currDy = endPoint.y - startPoint.y;

    const prevAngle = Math.atan2(prevDy, prevDx);
    const currAngle = Math.atan2(currDy, currDx);

    let angleDiff = (currAngle - prevAngle) * 180 / Math.PI;

    // Normalize to [-180, 180]
    while (angleDiff > 180) angleDiff -= 360;
    while (angleDiff <= -180) angleDiff += 360;

    return angleDiff;
}

/**
 * Calculate interior angle at a vertex (in degrees)
 * Returns positive angle for interior angles
 */
export function calculateInteriorAngle(prevPoint: Point, vertex: Point, nextPoint: Point): number {
    const angle = angleAtVertexDegrees(prevPoint, vertex, nextPoint);
    // Convert to interior angle (0-180 degrees)
    return Math.abs(angle);
}

/**
 * Extract segment data from a line
 */
export function extractSegments(line: Line): SegmentData[] {
    if (line.points.length < 2) return [];

    const segments: SegmentData[] = [];

    for (let i = 0; i < line.points.length - 1; i++) {
        const startPoint = line.points[i];
        const endPoint = line.points[i + 1];
        const prevPoint = i > 0 ? line.points[i - 1] : null;

        segments.push({
            index: i,
            length: getSegmentLength(startPoint, endPoint),
            angle: calculateSegmentAngle(prevPoint, startPoint, endPoint),
            startPoint,
            endPoint,
        });
    }

    return segments;
}

/**
 * Extract angle data from a line
 */
export function extractAngles(line: Line): AngleData[] {
    if (line.points.length < 3) return [];

    const angles: AngleData[] = [];
    const segments = extractSegments(line);

    for (let i = 1; i < line.points.length - 1; i++) {
        const prevPoint = line.points[i - 1];
        const vertex = line.points[i];
        const nextPoint = line.points[i + 1];

        angles.push({
            index: i - 1,
            angle: calculateInteriorAngle(prevPoint, vertex, nextPoint),
            vertex,
            prevSegment: segments[i - 1],
            nextSegment: segments[i],
        });
    }

    return angles;
}

/**
 * Calculate complete geometry information for a line
 */
export function calculateGeometry(line: Line): GeometryInfo {
    const segments = extractSegments(line);
    const angles = extractAngles(line);
    const totalLength = segments.reduce((sum, seg) => sum + seg.length, 0);

    return {
        totalLength,
        segmentCount: segments.length,
        segments,
        angles,
    };
}

/**
 * Calculate geometry for multiple lines
 */
export function calculateMultiLineGeometry(lines: Line[]): GeometryInfo[] {
    return lines.map(calculateGeometry);
}

/**
 * Check if two points are approximately equal within tolerance
 */
export function pointsEqual(p1: Point, p2: Point, tolerance = 1e-6): boolean {
    return Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.y - p2.y) < tolerance;
}

/**
 * Find closest point on a line segment to a given point
 */
export function closestPointOnSegment(point: Point, segStart: Point, segEnd: Point): Point {
    const dx = segEnd.x - segStart.x;
    const dy = segEnd.y - segStart.y;
    const length = dx * dx + dy * dy;

    if (length === 0) return segStart;

    const t = Math.max(0, Math.min(1, ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / length));

    return {
        x: segStart.x + t * dx,
        y: segStart.y + t * dy,
    };
}

/**
 * Calculate distance from point to line segment
 */
export function distanceToSegment(point: Point, segStart: Point, segEnd: Point): number {
    const closest = closestPointOnSegment(point, segStart, segEnd);
    return getSegmentLength(point, closest);
}

/**
 * Legacy function compatibility - geometric position calculation
 */
export function GetPointFromAngleDistance(x: number, y: number, angle: number, distance: number): Point {
    return {
        x: Math.cos(angle * Math.PI / 180) * distance + x,
        y: Math.sin(angle * Math.PI / 180) * distance + y,
    };
}
