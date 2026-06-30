// GeoJSON point-in-polygon containment checks.
// Implements ray-casting for Polygon and MultiPolygon geometries, including holes in polygon rings.

 /**
  * Checks if a coordinate point is inside a single linear ring of coordinates using ray-casting.
  * @param lng - Longitude coordinate of the point.
  * @param lat - Latitude coordinate of the point.
  * @param ring - Array of positions forming the closed loop boundary.
  * @returns True if the point lies inside the ring, false otherwise.
 */
function isPointInRing(lng: number, lat: number, ring: GeoJSON.Position[]): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        const intersects =
            yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
        if (intersects) inside = !inside;
    }
    return inside;
}

 /**
  * Checks if a coordinate point is inside a GeoJSON Polygon's coordinate rings,
  * respecting outer boundaries (must be inside) and inner exclusion rings/holes (must be outside).
  * @param lng - Longitude coordinate of the point.
  * @param lat - Latitude coordinate of the point.
  * @param coordinates - Double-nested array of positions representing the polygon rings.
  * @returns True if the point is inside the outer ring and outside all inner rings.
 */
function isPointInPolygonCoords(lng: number, lat: number, coordinates: GeoJSON.Position[][]): boolean {
    if (coordinates.length === 0) return false;
    if (!isPointInRing(lng, lat, coordinates[0])) return false;
    for (let i = 1; i < coordinates.length; i++) {
        if (isPointInRing(lng, lat, coordinates[i])) return false;
    }
    return true;
}

 /**
  * Performs a point-in-polygon check against a GeoJSON Polygon or MultiPolygon geometry.
  * @param lng - Longitude of the point to check.
  * @param lat - Latitude of the point to check.
  * @param geometry - The Polygon or MultiPolygon geometry representing the boundary.
  * @returns True if the coordinate is inside the boundary, false otherwise.
 */
export function isPointInMunicity(
    lng: number,
    lat: number,
    geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
): boolean {
    if (geometry.type === "Polygon") {
        return isPointInPolygonCoords(lng, lat, geometry.coordinates);
    }
    return geometry.coordinates.some((polygon) => isPointInPolygonCoords(lng, lat, polygon));
}
