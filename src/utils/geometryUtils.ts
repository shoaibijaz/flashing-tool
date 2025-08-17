import type { Point } from '../types';

// Geometry utility functions for polyline and fold calculations

export function GetNewPositionByAngleLength(firstX: number, firstY: number, secondPntX: number, secondPntY: number, newLength: number, newAngle: number) {
    const firstPnt = { x: firstX, y: firstY };
    const secondPnt = { x: secondPntX, y: secondPntY };
    const thirdPnt = { x: 100000, y: secondPnt.y };

    let angleDegree = CalculateAngle(firstPnt.x, firstPnt.y, secondPnt.x, secondPnt.y, thirdPnt.x, thirdPnt.y);
    angleDegree = 360 - (angleDegree + newAngle);
    if (angleDegree < 0) {
        angleDegree = 360 + angleDegree;
    }

    return GetPointFromAngleDistance(secondPntX, secondPntY, angleDegree, newLength);
}

export function CalculateAngle(x00: number, y00: number, x01: number, y01: number, x02: number, y02: number) {
    const dx0 = x01 - x00;
    const dy0 = y01 - y00;
    const dx1 = x02 - x01;
    const dy1 = y02 - y01;
    const angle = Math.atan2(dx0 * dy1 - dx1 * dy0, dx0 * dx1 + dy0 * dy1);
    const angleDegree = angle * 180 / Math.PI;
    if (angleDegree) {
        return 180 + angleDegree;
    }
    if (angleDegree === 0) {
        return 180;
    }
    return angleDegree;
}

export function GetPointFromAngleDistance(x: number, y: number, angle: number, distance: number) {
    return {
        x: Math.cos(angle * Math.PI / 180) * distance + x,
        y: Math.sin(angle * Math.PI / 180) * distance + y,
    };
}

export function getSegmentLength(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// --- New helpers: degree/radian conversions, angle at vertex, and rotation of point arrays ---
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
