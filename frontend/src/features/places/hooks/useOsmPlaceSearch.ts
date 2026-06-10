import { useQuery } from "@tanstack/react-query";
import type { OsmSearchResult } from "../types";

interface NominatimResult {
    place_id: number;
    osm_type: string;
    osm_id: number;
    display_name: string;
    lat: string;
    lon: string;
    type?: string;
    class?: string;
    name?: string;
}

function toOsmId(result: NominatimResult): string {
    return `${result.osm_type}/${result.osm_id}`;
}

function toCategory(result: NominatimResult): string {
    if (result.type) return result.type;
    if (result.class) return result.class;
    return "place";
}

async function searchOsmPlaces(
    query: string,
    viewbox?: [number, number, number, number],
): Promise<OsmSearchResult[]> {
    const params = new URLSearchParams({
        q: query,
        format: "json",
        addressdetails: "1",
        limit: "8",
        countrycodes: "ph",
    });

    if (viewbox) {
        const [minLng, minLat, maxLng, maxLat] = viewbox;
        params.set("viewbox", `${minLng},${maxLat},${maxLng},${minLat}`);
        params.set("bounded", "1");
    }

    const response = await fetch(`/api/nominatim/search?${params}`, {
        headers: {
            "Accept-Language": "en",
        },
    });

    if (!response.ok) {
        throw new Error("Failed to search places");
    }

    const data = (await response.json()) as NominatimResult[];

    return data.map((r) => ({
        osm_id: toOsmId(r),
        name: r.name ?? r.display_name.split(",")[0],
        display_name: r.display_name,
        category: toCategory(r),
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
    }));
}

export function useOsmPlaceSearch(query: string, viewbox?: [number, number, number, number]) {
    const trimmed = query.trim();

    return useQuery({
        queryKey: ["osm-search", trimmed, viewbox],
        queryFn: () => searchOsmPlaces(trimmed, viewbox),
        enabled: trimmed.length >= 3,
        staleTime: 60_000,
        retry: 1,
    });
}

export function getGeometryBounds(geometry: GeoJSON.Geometry): [number, number, number, number] | undefined {
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
