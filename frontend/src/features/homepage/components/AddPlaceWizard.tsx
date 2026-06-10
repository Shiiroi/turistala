import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../../../components/ui/Button";
import { Label } from "../../../components/ui/Label";
import { SegmentedControl } from "../../../components/ui/SegmentedControl";
import { cn } from "../../../lib/cn";
import { useSaveFeedback, useToast } from "../../../hooks/useToast";
import { PlaceSearchCombobox } from "../../places/components/PlaceSearchCombobox";
import type { OsmSearchResult } from "../../places/types";
import type { PlaceStatus } from "../../travel/types";
import type { TravelStore } from "../../travel/types";
import type { Division } from "../types";
import { resolveProvinceId, resolveRegionId } from "../utils/divisionPlaces";
import { fetchMunicitiesMetaByProvince } from "../../map/services/mapApi";
import type { MunicityMeta, ProvinceGeoJSON, Region } from "../../map/types";

interface AddPlaceWizardProps {
    contextDivision: Division;
    regions: Region[];
    provinces: ProvinceGeoJSON[];
    municityMeta: MunicityMeta[];
    travelStore: TravelStore;
    existingOsmIds: Set<string>;
    onComplete: () => void;
    onCancel: () => void;
    hideHeading?: boolean;
}

const selectClassName =
    "w-full rounded-lg border border-border bg-parchment px-3 py-2.5 font-body text-sm text-primary";

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
    const showSaved = useSaveFeedback();
    const { error: toastError } = useToast();
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
    const [isSaving, setIsSaving] = useState(false);

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

    const selectedMunicityName = useMemo(() => {
        if (municityId == null) return undefined;
        return (
            provinceMunicities.find((m) => m.id === municityId)?.name ??
            municityMeta.find((m) => m.id === municityId)?.name
        );
    }, [municityId, provinceMunicities, municityMeta]);

    function handleOsmSelect(result: OsmSearchResult) {
        setPendingPlace(result);
    }

    async function handleConfirm() {
        if (!pendingPlace || municityId == null || isSaving) return;
        setIsSaving(true);
        try {
            const place = await Promise.resolve(
                travelStore.addPlace({
                    osm_id: pendingPlace.osm_id,
                    name: pendingPlace.name,
                    category: pendingPlace.category,
                    municity_id: municityId,
                    lat: pendingPlace.lat,
                    lng: pendingPlace.lng,
                }),
            );

            if (!travelStore.getPlaceStatus(place.id)) {
                if (status === "goal") await Promise.resolve(travelStore.addAsGoal(place.id));
                else await Promise.resolve(travelStore.addAsVisited(place.id));
            }

            showSaved(travelStore.isDemo);
            onComplete();
        } catch {
            toastError("Could not save place");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div>
            {!hideHeading && <Label className="mb-2">Add a place</Label>}
            {breadcrumb && (
                <p className="mb-4 font-mono text-[13px] text-muted">{breadcrumb}</p>
            )}

            {showProvinceStep && (
                <div className="mb-4">
                    <Label as="label" className="mb-1.5 block">
                        Province
                    </Label>
                    <select
                        value={provinceId ?? ""}
                        onChange={(e) => {
                            const id = Number(e.target.value);
                            setProvinceId(id || null);
                            setMunicityId(null);
                            setPendingPlace(null);
                        }}
                        className={selectClassName}
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
                <div className="mb-4">
                    <Label as="label" className="mb-1.5 block">
                        Municipality / City
                    </Label>
                    <select
                        value={municityId ?? ""}
                        onChange={(e) => {
                            setMunicityId(Number(e.target.value) || null);
                            setPendingPlace(null);
                        }}
                        disabled={showProvinceStep && provinceId == null}
                        className={cn(selectClassName, "disabled:cursor-not-allowed disabled:opacity-50")}
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
                    municityName={selectedMunicityName}
                    onSelect={handleOsmSelect}
                    existingOsmIds={existingOsmIds}
                    hideHeading
                />
            )}

            {pendingPlace && (
                <div className="mb-4 rounded-lg border border-border-light bg-parchment p-3.5">
                    <div className="mb-1 font-semibold text-primary">{pendingPlace.name}</div>
                    <div className="mb-3 text-xs text-muted">{pendingPlace.category}</div>
                    <Label className="mb-1.5">Save as</Label>
                    <SegmentedControl
                        value={status}
                        options={[
                            { value: "goal", label: "Goal" },
                            { value: "visited", label: "Visited" },
                        ]}
                        onChange={setStatus}
                        className="mb-3"
                    />
                    <div className="flex flex-wrap gap-2">
                        <Button size="sm" onClick={handleConfirm} loading={isSaving} disabled={isSaving}>
                            Save place
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setPendingPlace(null)}>
                            Change place
                        </Button>
                    </div>
                </div>
            )}

            <Button variant="secondary" size="sm" onClick={onCancel} className="mt-4">
                Cancel
            </Button>
        </div>
    );
}
