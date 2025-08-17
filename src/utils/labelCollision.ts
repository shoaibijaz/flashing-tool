// New utilities for label collision detection and deterministic resolution
export interface LabelDescriptor {
    id: string; // unique key used in offsets maps
    type: 'segment' | 'angle';
    anchor: { x: number; y: number };
    rotation: number; // degrees
    text: string;
    fontSize?: number;
    priority?: number; // higher stays put
    preferredOffset?: { dx: number; dy: number };
}

function measureTextWidth(text: string, fontSize = 12, fontFamily = 'Arial') {
    // use an offscreen canvas to measure text width
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return { width: text.length * fontSize * 0.6, height: fontSize * 1.2 };
    ctx.font = `${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(text);
    const width = metrics.width || text.length * fontSize * 0.6;
    const height = fontSize * 1.2;
    return { width, height };
}

function getRotatedRectPoints(cx: number, cy: number, w: number, h: number, rotationDeg: number, offset = { dx: 0, dy: 0 }) {
    const rad = (rotationDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const hw = w / 2;
    const hh = h / 2;
    const corners = [
        { x: -hw + offset.dx, y: -hh + offset.dy },
        { x: hw + offset.dx, y: -hh + offset.dy },
        { x: hw + offset.dx, y: hh + offset.dy },
        { x: -hw + offset.dx, y: hh + offset.dy },
    ];
    return corners.map(p => ({ x: cx + p.x * cos - p.y * sin, y: cy + p.x * sin + p.y * cos }));
}

// SAT for convex polygons
function polygonsIntersect(a: { x: number; y: number }[], b: { x: number; y: number }[]) {
    const polygons = [a, b];
    for (let i = 0; i < polygons.length; i++) {
        const polygon = polygons[i];
        for (let j = 0; j < polygon.length; j++) {
            const k = (j + 1) % polygon.length;
            const edge = { x: polygon[k].x - polygon[j].x, y: polygon[k].y - polygon[j].y };
            // perpendicular axis
            const axis = { x: -edge.y, y: edge.x };
            const normalize = Math.hypot(axis.x, axis.y) || 1;
            axis.x /= normalize; axis.y /= normalize;
            let minA = Infinity, maxA = -Infinity;
            let minB = Infinity, maxB = -Infinity;
            for (const p of a) {
                const proj = p.x * axis.x + p.y * axis.y;
                minA = Math.min(minA, proj); maxA = Math.max(maxA, proj);
            }
            for (const p of b) {
                const proj = p.x * axis.x + p.y * axis.y;
                minB = Math.min(minB, proj); maxB = Math.max(maxB, proj);
            }
            if (maxA < minB || maxB < minA) {
                return false; // separation found
            }
        }
    }
    return true; // no separating axis
}

export function resolveCollisions(descriptors: LabelDescriptor[], existingOffsets: Record<string, { dx: number; dy: number }>) {
    // For each descriptor, compute size and try to place it without colliding with already placed labels.
    // Deterministic order: sort by priority descending, then by id
    const byOrder = [...descriptors].sort((a, b) => {
        const pa = a.priority ?? 0;
        const pb = b.priority ?? 0;
        if (pa !== pb) return pb - pa; // higher priority first
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });

    const placed: { id: string; poly: { x: number; y: number }[]; descriptor: LabelDescriptor; offset: { dx: number; dy: number } }[] = [];
    const results: Record<string, { dx: number; dy: number }> = {};

    for (const desc of byOrder) {
        // If user has an explicit offset in existingOffsets, keep it and treat as placed
        const existing = existingOffsets[desc.id];
        const fontSize = desc.fontSize ?? (desc.type === 'segment' ? 12 : 13);
        const measured = measureTextWidth(desc.text, fontSize);
        const w = measured.width + 12; // padding
        const h = measured.height + 6;
        const preferred = desc.preferredOffset ?? { dx: 0, dy: 0 };
        if (existing) {
            const poly = getRotatedRectPoints(desc.anchor.x, desc.anchor.y, w, h, desc.rotation, existing);
            placed.push({ id: desc.id, poly, descriptor: desc, offset: existing });
            results[desc.id] = existing;
            continue;
        }

        // Try candidate offsets: preferred first, then perpendicular shifts
        const candidates: { dx: number; dy: number }[] = [];
        candidates.push(preferred);
        // perpendicular vector to rotation angle
        const rad = (desc.rotation * Math.PI) / 180;
        const perp = { x: -Math.sin(rad), y: Math.cos(rad) };
        const magnitudes = [12, -12, 24, -24, 36, -36, 48, -48];
        for (const m of magnitudes) candidates.push({ dx: preferred.dx + perp.x * m, dy: preferred.dy + perp.y * m });
        // small radial outward moves
        for (const m of magnitudes) candidates.push({ dx: preferred.dx + Math.cos(rad) * m, dy: preferred.dy + Math.sin(rad) * m });

        let placedPoly: { x: number; y: number }[] | null = null;
        let chosenOffset = preferred;
        for (const c of candidates) {
            const poly = getRotatedRectPoints(desc.anchor.x, desc.anchor.y, w, h, desc.rotation, c);
            let hits = false;
            for (const p of placed) {
                // quick AABB check
                const minAx = Math.min(...poly.map(pt => pt.x));
                const maxAx = Math.max(...poly.map(pt => pt.x));
                const minAy = Math.min(...poly.map(pt => pt.y));
                const maxAy = Math.max(...poly.map(pt => pt.y));
                const minBx = Math.min(...p.poly.map(pt => pt.x));
                const maxBx = Math.max(...p.poly.map(pt => pt.x));
                const minBy = Math.min(...p.poly.map(pt => pt.y));
                const maxBy = Math.max(...p.poly.map(pt => pt.y));
                if (maxAx < minBx || maxBx < minAx || maxAy < minBy || maxBy < minAy) {
                    continue; // no AABB overlap
                }
                // SAT precise
                if (polygonsIntersect(poly, p.poly)) {
                    hits = true;
                    break;
                }
            }
            if (!hits) {
                placedPoly = poly;
                chosenOffset = c;
                break;
            }
        }
        if (!placedPoly) {
            // fallback: use preferred even if colliding
            const poly = getRotatedRectPoints(desc.anchor.x, desc.anchor.y, w, h, desc.rotation, preferred);
            placedPoly = poly;
            chosenOffset = preferred;
        }
        placed.push({ id: desc.id, poly: placedPoly, descriptor: desc, offset: chosenOffset });
        results[desc.id] = chosenOffset;
    }

    return results;
}
