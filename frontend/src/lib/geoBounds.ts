// geoBounds.ts — Bounding-box computation for GeoJSON geometries.
// Derives min/max longitude and latitude from Polygon and MultiPolygon coordinate arrays.

export function getGeometryBounds(
    geometry: GeoJSON.Geometry,
): [number, number, number, number] | undefined {
    if (geometry.type === "Polygon") {
        const coords = geometry.coordinates[0];
        let minLng = Infinity,
            minLat = Infinity,
            maxLng = -Infinity,
            maxLat = -Infinity;
        for (const [lng, lat] of coords) {
            minLng = Math.min(minLng, lng);
            minLat = Math.min(minLat, lat);
            maxLng = Math.max(maxLng, lng);
            maxLat = Math.max(maxLat, lat);
        }
        return [minLng, minLat, maxLng, maxLat];
    }
    if (geometry.type === "MultiPolygon") {
        let minLng = Infinity,
            minLat = Infinity,
            maxLng = -Infinity,
            maxLat = -Infinity;
        for (const polygon of geometry.coordinates) {
            for (const [lng, lat] of polygon[0]) {
                minLng = Math.min(minLng, lng);
                minLat = Math.min(minLat, lat);
                maxLng = Math.max(maxLng, lng);
                maxLat = Math.max(maxLat, lat);
            }
        }
        return [minLng, minLat, maxLng, maxLat];
    }
    return undefined;
}
