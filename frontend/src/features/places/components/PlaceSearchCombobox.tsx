import { useState } from "react";
import { useOsmPlaceSearch, getGeometryBounds } from "../hooks/useOsmPlaceSearch";
import { useMunicityGeometry } from "../hooks/useMunicityGeometry";
import type { OsmSearchResult } from "../types";

interface PlaceSearchComboboxProps {
    municityId: number;
    onSelect: (result: OsmSearchResult) => void;
    existingOsmIds: Set<string>;
    hideHeading?: boolean;
}

export function PlaceSearchCombobox({
    municityId,
    onSelect,
    existingOsmIds,
    hideHeading = false,
}: PlaceSearchComboboxProps) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [dedupMessage, setDedupMessage] = useState<string | null>(null);

    const { data: municityGeo, isLoading: geoLoading } = useMunicityGeometry(municityId);
    const viewbox = municityGeo?.geometry ? getGeometryBounds(municityGeo.geometry) : undefined;
    const { data: results = [], isFetching } = useOsmPlaceSearch(query, viewbox);

    function handleSelect(result: OsmSearchResult) {
        if (existingOsmIds.has(result.osm_id)) {
            setDedupMessage(`"${result.name}" is already in your list.`);
            setQuery("");
            setOpen(false);
            return;
        }
        setDedupMessage(null);
        onSelect(result);
        setQuery("");
        setOpen(false);
    }

    return (
        <div style={{ marginBottom: hideHeading ? 0 : 20 }}>
            {!hideHeading && (
                <>
                    <div className="label-mono" style={{ marginBottom: 8 }}>
                        Search place
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>
                        Search OpenStreetMap — select from suggestions to avoid duplicates.
                    </p>
                </>
            )}
            {geoLoading && (
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>
                    Loading area bounds…
                </p>
            )}
            <div style={{ position: "relative" }}>
                <input
                    type="text"
                    value={query}
                    placeholder="Search places…"
                    disabled={geoLoading}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                        setDedupMessage(null);
                    }}
                    onFocus={() => setOpen(true)}
                    style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "var(--bg-parchment)",
                        fontFamily: "var(--font-body)",
                        fontSize: 14,
                    }}
                />
                {open && query.length >= 3 && (
                    <div
                        style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            marginTop: 4,
                            background: "var(--bg-parchment)",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            boxShadow: "var(--shadow-lg)",
                            maxHeight: 220,
                            overflowY: "auto",
                            zIndex: 100,
                        }}
                    >
                        {isFetching && (
                            <div style={{ padding: 12, color: "var(--text-muted)", fontSize: 13 }}>
                                Searching…
                            </div>
                        )}
                        {!isFetching && results.length === 0 && (
                            <div style={{ padding: 12, color: "var(--text-muted)", fontSize: 13 }}>
                                No places found. Try a different search.
                            </div>
                        )}
                        {results.map((r) => (
                            <button
                                key={r.osm_id}
                                type="button"
                                onClick={() => handleSelect(r)}
                                style={{
                                    display: "block",
                                    width: "100%",
                                    padding: "10px 12px",
                                    border: "none",
                                    borderBottom: "1px solid var(--border-light)",
                                    background: existingOsmIds.has(r.osm_id)
                                        ? "var(--border-light)"
                                        : "transparent",
                                    textAlign: "left",
                                    cursor: "pointer",
                                }}
                            >
                                <div style={{ fontWeight: 500, fontSize: 14 }}>{r.name}</div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: "var(--text-muted)",
                                        fontFamily: "var(--font-mono)",
                                    }}
                                >
                                    {r.category} · {r.display_name.split(",").slice(0, 2).join(",")}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {dedupMessage && (
                <p style={{ fontSize: 13, color: "var(--accent)", marginTop: 8 }}>{dedupMessage}</p>
            )}
        </div>
    );
}
