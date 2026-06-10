import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../../../components/ui/Button";
import { PlaceSearchCombobox } from "../../places/components/PlaceSearchCombobox";
import type { OsmSearchResult } from "../../places/types";
import type { PlaceStatus } from "../../travel/types";
import type { MockTravelStore } from "../../travel/hooks/useMockTravelStore";
import type { Division } from "../types";
import { resolveProvinceId, resolveRegionId } from "../utils/divisionPlaces";
import { fetchMunicitiesMetaByProvince } from "../../map/services/mapApi";
import type { MunicityMeta, ProvinceGeoJSON, Region } from "../../map/types";

interface AddPlaceWizardProps {
    contextDivision: Division;
    regions: Region[];
    provinces: ProvinceGeoJSON[];
    municityMeta: MunicityMeta[];
    travelStore: MockTravelStore;
    existingOsmIds: Set<string>;
    onComplete: () => void;
    onCancel: () => void;
    hideHeading?: boolean;
}

export function AddPlaceWizard({
    contextDivision,
    regions,
    provinces,
    municityMeta,
    travelStore,
    existingOsmIds,
    onComplete,
    onCancel,
    hideHeading = false,
}: AddPlaceWizardProps) {
    const regionId = resolveRegionId(contextDivision, provinces);
    const initialProvinceId = resolveProvinceId(contextDivision);

    const [provinceId, setProvinceId] = useState<number | null>(
        contextDivision.level === "region" ? null : initialProvinceId,
    );
    const [municityId, setMunicityId] = useState<number | null>(
        contextDivision.level === "municipality" ? contextDivision.id : null,
    );
    const [pendingPlace, setPendingPlace] = useState<OsmSearchResult | null>(null);
    const [status, setStatus] = useState<PlaceStatus>("goal");

    const regionProvinces = useMemo(
        () => (regionId != null ? provinces.filter((p) => p.region_id === regionId) : []),
        [regionId, provinces],
    );

    const provinceMunicitiesQuery = useQuery({
        queryKey: ["municities", "meta", "province", provinceId],
        queryFn: () => fetchMunicitiesMetaByProvince(provinceId!),
        enabled: provinceId != null,
        staleTime: 20 * 60 * 1000,
    });

    const provinceMunicities = provinceMunicitiesQuery.data ?? [];

    const breadcrumb = useMemo(() => {
        const parts: string[] = [];
        if (regionId != null) parts.push(regions.find((r) => r.id === regionId)?.name ?? "");
        if (provinceId != null) parts.push(provinces.find((p) => p.id === provinceId)?.name ?? "");
        if (municityId != null) {
            const name =
                provinceMunicities.find((m) => m.id === municityId)?.name ??
                municityMeta.find((m) => m.id === municityId)?.name ??
                "";
            if (name) parts.push(name);
        }
        return parts.filter(Boolean).join(" → ");
    }, [regionId, provinceId, municityId, regions, provinces, provinceMunicities, municityMeta]);

    const showProvinceStep = contextDivision.level === "region";
    const showMunicityStep = contextDivision.level === "region" || contextDivision.level === "province";

    function handleOsmSelect(result: OsmSearchResult) {
        setPendingPlace(result);
    }

    function handleConfirm() {
        if (!pendingPlace || municityId == null) return;

        const place = travelStore.addPlace({
            osm_id: pendingPlace.osm_id,
            name: pendingPlace.name,
            category: pendingPlace.category,
            municity_id: municityId,
            lat: pendingPlace.lat,
            lng: pendingPlace.lng,
        });

        if (!travelStore.getPlaceStatus(place.id)) {
            if (status === "goal") travelStore.addAsGoal(place.id);
            else travelStore.addAsVisited(place.id);
        }

        onComplete();
    }

    return (
        <div>
            {!hideHeading && (
                <div className="label-mono" style={{ marginBottom: 8 }}>
                    Add a place
                </div>
            )}
            {breadcrumb && (
                <p
                    style={{
                        fontSize: 13,
                        color: "var(--text-muted)",
                        marginBottom: 16,
                        fontFamily: "var(--font-mono)",
                    }}
                >
                    {breadcrumb}
                </p>
            )}

            {showProvinceStep && (
                <div style={{ marginBottom: 16 }}>
                    <label className="label-mono" style={{ display: "block", marginBottom: 6 }}>
                        Province
                    </label>
                    <select
                        value={provinceId ?? ""}
                        onChange={(e) => {
                            const id = Number(e.target.value);
                            setProvinceId(id || null);
                            setMunicityId(null);
                            setPendingPlace(null);
                        }}
                        style={selectStyle}
                    >
                        <option value="">Select province…</option>
                        {regionProvinces.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {showMunicityStep && (
                <div style={{ marginBottom: 16 }}>
                    <label className="label-mono" style={{ display: "block", marginBottom: 6 }}>
                        Municipality / City
                    </label>
                    <select
                        value={municityId ?? ""}
                        onChange={(e) => {
                            setMunicityId(Number(e.target.value) || null);
                            setPendingPlace(null);
                        }}
                        disabled={showProvinceStep && provinceId == null}
                        style={selectStyle}
                    >
                        <option value="">Select municipality…</option>
                        {provinceMunicities.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.name} ({m.type})
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {municityId != null && !pendingPlace && (
                <PlaceSearchCombobox
                    municityId={municityId}
                    onSelect={handleOsmSelect}
                    existingOsmIds={existingOsmIds}
                    hideHeading
                />
            )}

            {pendingPlace && (
                <div
                    style={{
                        background: "var(--bg-parchment)",
                        border: "1px solid var(--border-light)",
                        borderRadius: 8,
                        padding: 14,
                        marginBottom: 16,
                    }}
                >
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{pendingPlace.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
                        {pendingPlace.category}
                    </div>
                    <div className="label-mono" style={{ marginBottom: 6 }}>
                        Save as
                    </div>
                    <div className="segmented-control" style={{ marginBottom: 12 }}>
                        <button
                            type="button"
                            className={status === "goal" ? "active" : ""}
                            onClick={() => setStatus("goal")}
                        >
                            Goal
                        </button>
                        <button
                            type="button"
                            className={status === "visited" ? "active" : ""}
                            onClick={() => setStatus("visited")}
                        >
                            Visited
                        </button>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Button size="sm" onClick={handleConfirm}>
                            Save place
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setPendingPlace(null)}>
                            Change place
                        </Button>
                    </div>
                </div>
            )}

            <Button variant="secondary" size="sm" onClick={onCancel} style={{ marginTop: 16 }}>
                Cancel
            </Button>
        </div>
    );
}

const selectStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--bg-parchment)",
    fontFamily: "var(--font-body)",
    fontSize: 14,
};
