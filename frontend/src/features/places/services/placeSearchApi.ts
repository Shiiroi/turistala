// placeSearchApi.ts — OpenStreetMap place search with municipality scoping.

import { isPointInMunicity } from "../../../lib/pointInPolygon";
import type { OsmSearchResult, PlaceSearchResponse, PlaceSearchSuggestion } from "../types";

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

interface PhotonFeature {
    properties: {
        osm_type?: string;
        osm_id?: number;
        name?: string;
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        type?: string;
        osm_key?: string;
        osm_value?: string;
    };
    geometry: {
        coordinates: [number, number];
    };
}

export interface PlaceSearchContext {
    lat?: number;
    lng?: number;
    bbox?: [number, number, number, number];
    municityName?: string;
    geometry?: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

function toOsmId(osmType: string, osmId: number): string {
    return `${osmType}/${osmId}`;
}

function toCategory(type?: string, klass?: string): string {
    if (type) return type;
    if (klass) return klass;
    return "place";
}

function nominatimToResult(r: NominatimResult): OsmSearchResult {
    return {
        osm_id: toOsmId(r.osm_type, r.osm_id),
        name: r.name ?? r.display_name.split(",")[0],
        display_name: r.display_name,
        category: toCategory(r.type, r.class),
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
    };
}

function photonToResult(f: PhotonFeature): OsmSearchResult | null {
    const p = f.properties;
    if (!p.osm_type || p.osm_id == null || !p.name) return null;
    const osmType =
        p.osm_type === "N" ? "node" : p.osm_type === "W" ? "way" : p.osm_type.toLowerCase();
    const parts = [p.name, p.street, p.city, p.state, p.country].filter(Boolean);
    return {
        osm_id: toOsmId(osmType, p.osm_id),
        name: p.name,
        display_name: parts.join(", "),
        category: toCategory(p.osm_value, p.osm_key),
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
    };
}

function normalizeKey(name: string, lat: number, lng: number): string {
    return `${name.toLowerCase().trim()}@${lat.toFixed(4)},${lng.toFixed(4)}`;
}

function tokenize(query: string): string[] {
    return query
        .toLowerCase()
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 2);
}

function scoreResult(query: string, r: OsmSearchResult, municityName?: string): number {
    const q = query.toLowerCase();
    const name = r.name.toLowerCase();
    const haystack = `${r.name} ${r.display_name}`.toLowerCase();
    const tokens = tokenize(query);
    let s = 0;

    if (name.startsWith(q)) s += 5;
    else if (haystack.startsWith(q)) s += 3;

    for (const token of tokens) {
        if (name.includes(token)) s += 3;
        else if (name.split(/\s+/).some((w) => w.startsWith(token))) s += 2;
        else if (haystack.includes(token)) s += 1;
    }

    if (municityName && haystack.includes(municityName.toLowerCase())) s += 4;

    return s;
}

function rankResults(
    query: string,
    results: OsmSearchResult[],
    municityName?: string,
): OsmSearchResult[] {
    return [...results].sort(
        (a, b) => scoreResult(query, b, municityName) - scoreResult(query, a, municityName),
    );
}

function dedupeResults(results: OsmSearchResult[]): OsmSearchResult[] {
    const seen = new Set<string>();
    const out: OsmSearchResult[] = [];
    for (const r of results) {
        const key = r.osm_id || normalizeKey(r.name, r.lat, r.lng);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(r);
    }
    return out;
}

function levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
        }
    }
    return dp[m][n];
}

function isInMunicity(r: OsmSearchResult, ctx: PlaceSearchContext): boolean {
    if (!ctx.geometry) return true;
    return isPointInMunicity(r.lng, r.lat, ctx.geometry);
}

function extractLocationLabel(displayName: string): string | undefined {
    const parts = displayName.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length < 2) return undefined;
    return parts[1];
}

function hasStrongNameMatch(query: string, r: OsmSearchResult): boolean {
    const q = query.toLowerCase().trim();
    const name = r.name.toLowerCase();
    if (name.includes(q) || q.includes(name)) return true;

    const tokens = tokenize(query);
    if (tokens.length === 0) return false;

    let matched = 0;
    for (const token of tokens) {
        if (name.includes(token) || name.split(/\s+/).some((w) => w.startsWith(token))) {
            matched += 1;
        }
    }
    return matched >= Math.ceil(tokens.length * 0.6);
}

function buildFuzzySuggestions(
    query: string,
    inMuni: OsmSearchResult[],
    primary: OsmSearchResult[],
    municityName?: string,
): PlaceSearchSuggestion[] {
    if (inMuni.length === 0) return [];

    const q = query.toLowerCase().trim();
    const primaryHasStrong = primary.some(
        (r) => r.name.toLowerCase().startsWith(q) || scoreResult(query, r, municityName) >= 5,
    );
    if (primaryHasStrong) return [];

    const candidates = inMuni.filter((r) => !primary.some((p) => p.osm_id === r.osm_id));
    if (candidates.length === 0) return [];

    const best = [...candidates].sort((a, b) => {
        const distA = levenshtein(a.name.toLowerCase(), q);
        const distB = levenshtein(b.name.toLowerCase(), q);
        if (distA !== distB) return distA - distB;
        return scoreResult(query, b, municityName) - scoreResult(query, a, municityName);
    })[0];

    const dist = levenshtein(best.name.toLowerCase(), q);
    const maxDist = Math.max(2, Math.floor(q.length / 3));
    if (dist > maxDist && scoreResult(query, best, municityName) < 3) return [];

    return [{ result: best, kind: "fuzzy" }];
}

function buildNearbySuggestions(
    query: string,
    outMuni: OsmSearchResult[],
    municityName?: string,
): PlaceSearchSuggestion[] {
    if (outMuni.length === 0) return [];

    const ranked = rankResults(query, outMuni, municityName).filter((r) =>
        hasStrongNameMatch(query, r),
    );

    return ranked.slice(0, 3).map((r) => {
        const location = extractLocationLabel(r.display_name);
        const reason = location
            ? `In ${location}${municityName ? `, not ${municityName}` : ""}`
            : municityName
              ? `Outside ${municityName}`
              : "Outside selected municipality";
        return { result: r, kind: "nearby" as const, reason };
    });
}

async function searchNominatim(
    query: string,
    ctx: PlaceSearchContext,
): Promise<OsmSearchResult[]> {
    const params = new URLSearchParams({
        q: query,
        format: "json",
        addressdetails: "1",
        limit: "10",
        countrycodes: "ph",
    });

    if (ctx.bbox) {
        const [minLng, minLat, maxLng, maxLat] = ctx.bbox;
        params.set("viewbox", `${minLng},${maxLat},${maxLng},${minLat}`);
    }

    const response = await fetch(`/api/nominatim/search?${params}`, {
        headers: { "Accept-Language": "en" },
    });
    if (!response.ok) return [];
    const data = (await response.json()) as NominatimResult[];
    return data.map(nominatimToResult);
}

async function searchPhoton(query: string, ctx: PlaceSearchContext): Promise<OsmSearchResult[]> {
    const params = new URLSearchParams({
        q: query,
        limit: "10",
        lang: "en",
    });

    if (ctx.lat != null && ctx.lng != null) {
        params.set("lat", String(ctx.lat));
        params.set("lon", String(ctx.lng));
    }

    if (ctx.bbox) {
        const [minLng, minLat, maxLng, maxLat] = ctx.bbox;
        params.set("bbox", `${minLng},${minLat},${maxLng},${maxLat}`);
    }

    const response = await fetch(`/api/photon/api?${params}`);
    if (!response.ok) return [];

    const data = (await response.json()) as { features: PhotonFeature[] };
    return data.features.map(photonToResult).filter((r): r is OsmSearchResult => r != null);
}

export async function searchPlaces(
    query: string,
    ctx: PlaceSearchContext = {},
): Promise<PlaceSearchResponse> {
    const trimmed = query.trim();
    if (trimmed.length < 2) return { results: [], suggestions: [] };

    const queries: Promise<OsmSearchResult[]>[] = [
        searchPhoton(trimmed, ctx),
        searchNominatim(trimmed, ctx),
    ];

    if (ctx.municityName) {
        queries.push(searchNominatim(`${trimmed} ${ctx.municityName}`, ctx));
    }

    const batches = await Promise.all(queries);
    const merged = dedupeResults(batches.flat());

    const inMuni: OsmSearchResult[] = [];
    const outMuni: OsmSearchResult[] = [];
    for (const r of merged) {
        if (isInMunicity(r, ctx)) inMuni.push(r);
        else outMuni.push(r);
    }

    const rankedInMuni = rankResults(trimmed, inMuni, ctx.municityName);
    const results = rankedInMuni.slice(0, 10);

    const fuzzySuggestions = buildFuzzySuggestions(trimmed, rankedInMuni, results, ctx.municityName);
    const nearbySuggestions =
        results.length === 0 ? buildNearbySuggestions(trimmed, outMuni, ctx.municityName) : [];

    const suggestions = [...fuzzySuggestions, ...nearbySuggestions];

    return { results, suggestions };
}

export function isSearchResultInMunicity(
    result: OsmSearchResult,
    geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon,
): boolean {
    return isPointInMunicity(result.lng, result.lat, geometry);
}
