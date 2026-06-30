// Shared type definitions for place search.

export interface OsmSearchResult {
    osm_id: string;
    name: string;
    display_name: string;
    category: string;
    lat: number;
    lng: number;
}

export interface PlaceSearchSuggestion {
    result: OsmSearchResult;
    kind: "fuzzy" | "nearby";
    reason?: string;
}

export interface PlaceSearchResponse {
    results: OsmSearchResult[];
    suggestions: PlaceSearchSuggestion[];
}
