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

function isPointInPolygonCoords(lng: number, lat: number, coordinates: GeoJSON.Position[][]): boolean {
    if (coordinates.length === 0) return false;
    if (!isPointInRing(lng, lat, coordinates[0])) return false;
    for (let i = 1; i < coordinates.length; i++) {
        if (isPointInRing(lng, lat, coordinates[i])) return false;
    }
    return true;
}

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
