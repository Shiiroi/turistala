// PlaceSearchCombobox.tsx — Municipality-scoped place search combobox.

import { useState } from "react";
import { usePlaceSearch, getGeometryBounds } from "../hooks/usePlaceSearch";
import { useMunicityGeometry } from "../hooks/useMunicityGeometry";
import { isSearchResultInMunicity } from "../services/placeSearchApi";
import type { OsmSearchResult } from "../types";
import { Label } from "../../../components/ui/Label";
import { cn } from "../../../lib/cn";

interface PlaceSearchComboboxProps {
    municityId: number;
    municityName?: string;
    onSelect: (result: OsmSearchResult) => void;
    existingOsmIds: Set<string>;
    hideHeading?: boolean;
}

export function PlaceSearchCombobox({
    municityId,
    municityName,
    onSelect,
    existingOsmIds,
    hideHeading = false,
}: PlaceSearchComboboxProps) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [dedupMessage, setDedupMessage] = useState<string | null>(null);
    const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

    const { data: municityGeo, isLoading: geoLoading } = useMunicityGeometry(municityId);
    const viewbox = municityGeo?.geometry ? getGeometryBounds(municityGeo.geometry) : undefined;
    const geometry =
        municityGeo?.geometry?.type === "Polygon" ||
        municityGeo?.geometry?.type === "MultiPolygon"
            ? municityGeo.geometry
            : undefined;

    const center = municityGeo?.geometry
        ? (() => {
              const b = getGeometryBounds(municityGeo.geometry);
              if (!b) return {};
              const [minLng, minLat, maxLng, maxLat] = b;
              return { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };
          })()
        : {};

    const { data: searchData, isFetching } = usePlaceSearch(query, {
        bbox: viewbox,
        municityName,
        geometry,
        ...center,
    });

    const results = searchData?.results ?? [];
    const suggestions = searchData?.suggestions ?? [];
    const fuzzySuggestions = suggestions.filter((s) => s.kind === "fuzzy");
    const nearbySuggestions = suggestions.filter((s) => s.kind === "nearby");
    const hasDropdownContent = results.length > 0 || suggestions.length > 0;

    function trySelect(result: OsmSearchResult) {
        if (existingOsmIds.has(result.osm_id)) {
            setDedupMessage(`"${result.name}" is already in your list.`);
            setBlockedMessage(null);
            setQuery("");
            setOpen(false);
            return;
        }

        if (geometry && !isSearchResultInMunicity(result, geometry)) {
            const location = result.display_name.split(",").map((p) => p.trim())[1];
            setBlockedMessage(
                location
                    ? `This place is in ${location}. Select that municipality to add it.`
                    : "This place is outside the selected municipality.",
            );
            setDedupMessage(null);
            return;
        }

        setDedupMessage(null);
        setBlockedMessage(null);
        onSelect(result);
        setQuery("");
        setOpen(false);
    }

    function handleNearbyClick(suggestion: (typeof nearbySuggestions)[number]) {
        const location = suggestion.result.display_name.split(",").map((p) => p.trim())[1];
        setBlockedMessage(
            location
                ? `This place is in ${location}. Select ${location} as municipality to add it.`
                : suggestion.reason ?? "This place is outside the selected municipality.",
        );
        setDedupMessage(null);
    }

    const placeholder = municityName
        ? `Search places in ${municityName}…`
        : "Search places…";

    return (
        <div className={hideHeading ? "" : "mb-5"}>
            {!hideHeading && (
                <>
                    <Label className="mb-2 block">Search place</Label>
                    <p className="mb-2 text-[13px] text-muted">
                        {municityName
                            ? `Results are limited to ${municityName}. Try name, type, or landmark — e.g. mall, sm center`
                            : "Try name, type, or landmark — e.g. mall, sm center"}
                    </p>
                </>
            )}
            {geoLoading && (
                <p className="mb-2 text-[13px] text-muted">Loading area bounds…</p>
            )}
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    placeholder={placeholder}
                    disabled={geoLoading}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                        setDedupMessage(null);
                        setBlockedMessage(null);
                    }}
                    onFocus={() => setOpen(true)}
                    className={cn(
                        "w-full rounded-lg border border-border bg-parchment px-3 py-2.5",
                        "font-body text-sm text-primary outline-none",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                    )}
                />
                {open && query.length >= 2 && (
                    <div
                        className={cn(
                            "absolute inset-x-0 top-full z-[100] mt-1 max-h-[280px] overflow-y-auto",
                            "rounded-lg border border-border bg-parchment shadow-[var(--shadow-lg)]",
                        )}
                    >
                        {isFetching && (
                            <div className="p-3 text-[13px] text-muted">Searching…</div>
                        )}
                        {!isFetching && !hasDropdownContent && (
                            <div className="p-3 text-[13px] text-muted">
                                {municityName
                                    ? `No places found in ${municityName}. Try a shorter name or local landmark.`
                                    : "No places found. Try a different search."}
                            </div>
                        )}
                        {!isFetching &&
                            results.map((r) => (
                                <button
                                    key={r.osm_id}
                                    type="button"
                                    onClick={() => trySelect(r)}
                                    className={cn(
                                        "block w-full cursor-pointer border-none px-3 py-2.5 text-left",
                                        "border-b border-border-light last:border-b-0",
                                        existingOsmIds.has(r.osm_id)
                                            ? "bg-border-light"
                                            : "bg-transparent",
                                    )}
                                >
                                    <div className="text-sm font-medium">{r.name}</div>
                                    <div className="font-mono text-[11px] text-muted">
                                        {r.category} ·{" "}
                                        {r.display_name.split(",").slice(0, 2).join(",")}
                                    </div>
                                </button>
                            ))}
                        {!isFetching && fuzzySuggestions.length > 0 && (
                            <>
                                <div className="border-t border-border-light px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-muted">
                                    Did you mean?
                                </div>
                                {fuzzySuggestions.map((s) => (
                                    <button
                                        key={`fuzzy-${s.result.osm_id}`}
                                        type="button"
                                        onClick={() => trySelect(s.result)}
                                        className="block w-full cursor-pointer border-none border-b border-border-light bg-transparent px-3 py-2.5 text-left last:border-b-0"
                                    >
                                        <div className="text-sm font-medium">{s.result.name}</div>
                                        <div className="font-mono text-[11px] text-muted">
                                            {s.result.category} ·{" "}
                                            {s.result.display_name.split(",").slice(0, 2).join(",")}
                                        </div>
                                    </button>
                                ))}
                            </>
                        )}
                        {!isFetching && nearbySuggestions.length > 0 && (
                            <>
                                <div className="border-t border-border-light px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-muted">
                                    Did you mean?
                                </div>
                                {nearbySuggestions.map((s) => (
                                    <button
                                        key={`nearby-${s.result.osm_id}`}
                                        type="button"
                                        onClick={() => handleNearbyClick(s)}
                                        className={cn(
                                            "block w-full cursor-not-allowed border-none border-b border-border-light",
                                            "bg-transparent px-3 py-2.5 text-left opacity-60 last:border-b-0",
                                        )}
                                    >
                                        <div className="text-sm font-medium">{s.result.name}</div>
                                        <div className="font-mono text-[11px] text-muted">
                                            {s.reason ?? "Outside selected municipality"}
                                        </div>
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>
            {dedupMessage && (
                <p className="mt-2 text-[13px] text-accent">{dedupMessage}</p>
            )}
            {blockedMessage && (
                <p className="mt-2 text-[13px] text-amber-800">{blockedMessage}</p>
            )}
        </div>
    );
}
