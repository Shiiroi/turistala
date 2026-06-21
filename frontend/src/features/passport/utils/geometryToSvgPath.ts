// geometryToSvgPath.ts — GeoJSON-to-SVG path projection utilities.

import type { Geometry } from "geojson";
import { getGeometryBounds } from "../../../lib/geoBounds";

function collectRings(geometry: Geometry): number[][][] {
    if (geometry.type === "Polygon") {
        return geometry.coordinates;
    }
    if (geometry.type === "MultiPolygon") {
        return geometry.coordinates.flatMap((polygon) => polygon);
    }
    return [];
}

function projectRing(
    ring: number[][],
    bounds: [number, number, number, number],
    width: number,
    height: number,
    pad: number,
): string {
    const [minLng, minLat, maxLng, maxLat] = bounds;
    const innerW = width - pad * 2;
    const innerH = height - pad * 2;
    const spanLng = maxLng - minLng || 1;
    const spanLat = maxLat - minLat || 1;
    const scale = Math.min(innerW / spanLng, innerH / spanLat);

    const project = (lng: number, lat: number): [number, number] => {
        const x = pad + (lng - minLng) * scale + (innerW - spanLng * scale) / 2;
        const y = pad + (maxLat - lat) * scale + (innerH - spanLat * scale) / 2;
        return [x, y];
    };

    return ring
        .map(([lng, lat], i) => {
            const [x, y] = project(lng, lat);
            return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(" ")
        .concat(" Z");
}

// GeoJSON → SVG path with one shared bbox for all rings
export function geometryToSvgPath(geometry: Geometry, size = 48, pad = 4): string {
    const bounds = getGeometryBounds(geometry);
    if (!bounds) return "";

    const rings = collectRings(geometry);
    return rings.map((ring) => projectRing(ring, bounds, size, size, pad)).filter(Boolean).join(" ");
}

// Merge geometries into one path (e.g. PH outline)
export function geometriesToSvgPath(geometries: Geometry[], size = 48, pad = 4): string {
    const allRings: number[][][] = [];
    let minLng = Infinity,
        minLat = Infinity,
        maxLng = -Infinity,
        maxLat = -Infinity;

    for (const geometry of geometries) {
        const bounds = getGeometryBounds(geometry);
        if (!bounds) continue;
        allRings.push(...collectRings(geometry));
        minLng = Math.min(minLng, bounds[0]);
        minLat = Math.min(minLat, bounds[1]);
        maxLng = Math.max(maxLng, bounds[2]);
        maxLat = Math.max(maxLat, bounds[3]);
    }

    if (allRings.length === 0) return "";
    const bounds: [number, number, number, number] = [minLng, minLat, maxLng, maxLat];
    return allRings.map((ring) => projectRing(ring, bounds, size, size, pad)).join(" ");
}
