// boundsFromGeometries.ts — Computes a Leaflet bounds envelope from GeoJSON geometries.

import type { Geometry } from "geojson";
import L from "leaflet";
import { getGeometryBounds } from "../../../lib/geoBounds";

export function boundsFromGeometries(geometries: Geometry[]): L.LatLngBounds | null {
    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;

    for (const geometry of geometries) {
        const b = getGeometryBounds(geometry);
        if (!b) continue;
        minLng = Math.min(minLng, b[0]);
        minLat = Math.min(minLat, b[1]);
        maxLng = Math.max(maxLng, b[2]);
        maxLat = Math.max(maxLat, b[3]);
    }

    if (!Number.isFinite(minLng)) return null;
    return L.latLngBounds([
        [minLat, minLng],
        [maxLat, maxLng],
    ]);
}
