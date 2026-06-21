// exportMapDimensions.ts — Sizing and scale helpers for off-screen map PNG exports.

import type L from "leaflet";

// Longest export frame side (px)
const EXPORT_MAX = 1440;
const EXPORT_MIN = 520;

// Cap ~4 MP so canvas copy stays fast
const TARGET_OUTPUT_MP = 4_000_000;

export function exportMapDimensions(bounds: L.LatLngBounds): { width: number; height: number } {
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const latSpan = Math.max(ne.lat - sw.lat, 0.01);
    const lngSpan = Math.max(ne.lng - sw.lng, 0.01);
    const aspect = lngSpan / latSpan;

    if (aspect >= 1) {
        return {
            width: EXPORT_MAX,
            height: Math.max(Math.round(EXPORT_MAX / aspect), EXPORT_MIN),
        };
    }

    return {
        width: Math.max(Math.round(EXPORT_MAX * aspect), EXPORT_MIN),
        height: EXPORT_MAX,
    };
}

export function exportCaptureScale(width: number, height: number): number {
    const area = width * height;
    if (area * 4 <= TARGET_OUTPUT_MP) return 2;
    return Math.max(2, Math.sqrt(TARGET_OUTPUT_MP / area));
}

// deprecated: use exportMapDimensions
export const EXPORT_WIDTH = 1200;
// deprecated: use exportMapDimensions
export const EXPORT_HEIGHT = 800;
export const EXPORT_CAPTURE_SCALE = 2;
