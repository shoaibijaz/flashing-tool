import type { Point } from '../types/core';

/**
 * Calculate the distance between two points
 */
export const calculateDistance = (p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calculate the midpoint between two points
 */
export const calculateMidpoint = (p1: Point, p2: Point): Point => {
    return {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2
    };
};

/**
 * Calculate the angle of a line segment in degrees
 * Returns angle from horizontal (0° = horizontal right, 90° = vertical up)
 */
export const calculateAngle = (p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.atan2(-dy, dx) * (180 / Math.PI); // Negative dy for screen coordinates
};

/**
 * Calculate perpendicular offset for bubble positioning
 * Returns offset point to position bubble perpendicular to line
 */
export const calculatePerpendicularOffset = (p1: Point, p2: Point, distance: number): Point => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return { x: 0, y: 0 };

    // Normalize the direction vector
    const unitX = dx / length;
    const unitY = dy / length;

    // Get perpendicular vector (rotate 90 degrees)
    const perpX = -unitY;
    const perpY = unitX;

    // Scale by distance
    return {
        x: perpX * distance,
        y: perpY * distance
    };
};

/**
 * Determine if text should be rotated vertically based on line angle
 * Returns true if line is more vertical than horizontal
 */
export const shouldRotateText = (angle: number): boolean => {
    const normalizedAngle = Math.abs(angle) % 180;
    return normalizedAngle > 45 && normalizedAngle < 135;
};

/**
 * Format length value based on precision settings
 */
export const formatLength = (length: number, decimals: number = 2): string => {
    return length.toFixed(decimals);
};

/**
 * Calculate the interior angle at a vertex between three points
 * Returns angle in degrees
 */
export const calculateInteriorAngle = (p1: Point, vertex: Point, p3: Point): number => {
    const v1x = p1.x - vertex.x;
    const v1y = p1.y - vertex.y;
    const v2x = p3.x - vertex.x;
    const v2y = p3.y - vertex.y;

    const dot = v1x * v2x + v1y * v2y;
    const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
    const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);

    if (mag1 === 0 || mag2 === 0) return 0;

    const cosAngle = dot / (mag1 * mag2);
    const clampedCos = Math.max(-1, Math.min(1, cosAngle));
    const angleRad = Math.acos(clampedCos);

    return angleRad * (180 / Math.PI);
};

/**
 * Calculate a position for angle label offset from vertex
 * Returns a point offset from the vertex in the bisector direction
 */
export const calculateAngleLabelPosition = (p1: Point, vertex: Point, p3: Point, offset: number = 30): Point => {
    const v1x = p1.x - vertex.x;
    const v1y = p1.y - vertex.y;
    const v2x = p3.x - vertex.x;
    const v2y = p3.y - vertex.y;

    // Normalize vectors
    const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
    const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);

    if (mag1 === 0 || mag2 === 0) return { x: Math.round(vertex.x), y: Math.round(vertex.y) };

    const n1x = v1x / mag1;
    const n1y = v1y / mag1;
    const n2x = v2x / mag2;
    const n2y = v2y / mag2;

    // Calculate bisector direction
    const bisectorX = n1x + n2x;
    const bisectorY = n1y + n2y;
    const bisectorMag = Math.sqrt(bisectorX * bisectorX + bisectorY * bisectorY);

    if (bisectorMag === 0) {
        // Vectors are opposite, use perpendicular
        return {
            x: Math.round(vertex.x + n1y * offset),
            y: Math.round(vertex.y - n1x * offset)
        };
    }

    // Normalize bisector and apply offset
    const normalizedBisectorX = bisectorX / bisectorMag;
    const normalizedBisectorY = bisectorY / bisectorMag;

    // Round coordinates to avoid Chrome rendering issues with fractional pixels
    return {
        x: Math.round(vertex.x + normalizedBisectorX * offset),
        y: Math.round(vertex.y + normalizedBisectorY * offset)
    };
};

/**
 * Format angle value based on precision settings
 */
export const formatAngle = (angle: number, decimals: number = 1): string => {
    return angle.toFixed(decimals) + '°';
};
