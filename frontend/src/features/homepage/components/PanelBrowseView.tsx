// PanelBrowseView.tsx — Primary browse mode for the detail sidebar.

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { cn } from "../../../lib/cn";
import type { Division, PanelBrowseTab } from "../types";
import { placesInDivision, resolveRegionId } from "../utils/divisionPlaces";
import { DivisionSummary } from "./DivisionSummary";
import { DivisionExploreSection } from "./DivisionExploreSection";
import { computeExploreProgress, type ExploreViewTab } from "./divisionExploreUtils";
import { PanelJournalsView } from "./PanelJournalsView";
import type { PlaceFilterTab } from "../../travel/components/PlaceActions";
import type { TravelStore } from "../../travel/types";
import { fetchMunicitiesMetaByProvince } from "../../map/services/mapApi";
import type { MunicityGeoJSON, MunicityMeta, ProvinceGeoJSON, Region } from "../../map/types";

interface PanelBrowseViewProps {
    selectedDivision: Division;
    regions: Region[];
    provinces: ProvinceGeoJSON[];
    municities: MunicityGeoJSON[];
    municityMeta: MunicityMeta[];
    travelStore: TravelStore;
    browseTab: PanelBrowseTab;
    onBrowseTabChange: (tab: PanelBrowseTab) => void;
    viewTab: ExploreViewTab;
    onViewTabChange: (tab: ExploreViewTab) => void;
    statusFilter: PlaceFilterTab;
    onStatusFilterChange: (filter: PlaceFilterTab) => void;
    onSelectDivision: (division: Division) => void;
    onClose: () => void;
    onAddPlace: () => void;
    onOpenJournal: (journalId: string, placeId: string) => void;
    onNewJournal: (placeId: string) => void;
}

export function PanelBrowseView({
    selectedDivision,
    regions,
    provinces,
    municities,
    municityMeta,
    travelStore,
    browseTab,
    onBrowseTabChange,
    viewTab,
    onViewTabChange,
    statusFilter,
    onStatusFilterChange,
    onSelectDivision,
    onClose,
    onAddPlace,
    onOpenJournal,
    onNewJournal,
}: PanelBrowseViewProps) {
    const provinceIdForQuery =
        selectedDivision.level === "province" ? selectedDivision.id : null;

    const provinceMunicitiesQuery = useQuery({
        queryKey: ["municities", "meta", "province", provinceIdForQuery],
        queryFn: () => fetchMunicitiesMetaByProvince(provinceIdForQuery!),
        enabled: provinceIdForQuery != null,
        staleTime: 20 * 60 * 1000,
    });

    const provinceMunicities = useMemo(
        () => provinceMunicitiesQuery.data ?? [],
        [provinceMunicitiesQuery.data],
    );

    const parentRegionName = useMemo(() => {
        if (selectedDivision.level === "region") return undefined;
        const regionId = resolveRegionId(selectedDivision, provinces);
        if (!regionId) return undefined;
        return regions.find((r) => r.id === regionId)?.name;
    }, [selectedDivision, regions, provinces]);

    const parentProvinceName = useMemo(() => {
        if (selectedDivision.level !== "municipality") return undefined;
        if (!selectedDivision.province_id) return undefined;
        return provinces.find((p) => p.id === selectedDivision.province_id)?.name;
    }, [selectedDivision, provinces]);

    const areaPlaces = useMemo(
        () => placesInDivision(selectedDivision, travelStore.places, municityMeta, provinces),
        [selectedDivision, travelStore.places, municityMeta, provinces],
    );

    const destinationStats = useMemo(() => {
        const destinations = areaPlaces.filter((p) => travelStore.getPlaceStatus(p.id) != null);
        const visited = destinations.filter((p) => travelStore.getPlaceStatus(p.id) === "visited").length;
        return { destinations: destinations.length, visited };
    }, [areaPlaces, travelStore]);

    const progress = useMemo(
        () =>
            computeExploreProgress(
                selectedDivision,
                viewTab,
                provinces,
                municityMeta,
                provinceMunicities,
                areaPlaces,
                travelStore,
            ),
        [
            selectedDivision,
            viewTab,
            provinces,
            municityMeta,
            provinceMunicities,
            areaPlaces,
            travelStore,
        ],
    );

    const progressLabel = useMemo(() => {
        switch (viewTab) {
            case "provinces":
                return "provinces explored";
            case "municipalities":
                return "municipalities explored";
            case "places":
                return "places visited";
        }
    }, [viewTab]);

    const stats = useMemo(() => {
        const { destinations } = destinationStats;

        switch (selectedDivision.level) {
            case "region": {
                const provCount = provinces.filter((p) => p.region_id === selectedDivision.id).length;
                return [
                    { label: "Provinces", value: provCount },
                    { label: "Destinations", value: destinations },
                ];
            }
            case "province": {
                const muniCount = provinceMunicities.length;
                return [
                    { label: "Municities", value: muniCount },
                    { label: "Destinations", value: destinations },
                ];
            }
            case "municipality":
                return [{ label: "Destinations", value: destinations }];
        }
    }, [selectedDivision, provinces, provinceMunicities, destinationStats]);

    const journalCount = useMemo(() => {
        const placeIds = new Set(areaPlaces.map((p) => p.id));
        return travelStore.journals.filter((j) => placeIds.has(j.place_id)).length;
    }, [areaPlaces, travelStore.journals]);

    return (
        <>
            <DivisionSummary
                division={selectedDivision}
                parentRegionName={parentRegionName}
                parentProvinceName={parentProvinceName}
                stats={stats}
                progress={progress}
                progressLabel={progressLabel}
                viewTab={viewTab}
                onViewTabChange={onViewTabChange}
                onClose={onClose}
            />

            <div className="mb-4 mt-1 flex border-b border-border-light">
                <button
                    type="button"
                    className={cn(
                        "-mb-px inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 border-none border-b-2 border-transparent bg-transparent py-2.5 font-body text-sm text-muted transition-[color,border-color] duration-150 select-none",
                        browseTab === "explore" && "border-b-accent font-semibold text-primary",
                    )}
                    onClick={() => onBrowseTabChange("explore")}
                >
                    Explore
                </button>
                <button
                    type="button"
                    className={cn(
                        "-mb-px inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 border-none border-b-2 border-transparent bg-transparent py-2.5 font-body text-sm text-muted transition-[color,border-color] duration-150 select-none",
                        browseTab === "journals" && "border-b-accent font-semibold text-primary",
                    )}
                    onClick={() => onBrowseTabChange("journals")}
                >
                    Journals
                    {journalCount > 0 && (
                        <span
                            className={cn(
                                "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-border-light px-[5px] font-mono text-[10px] font-medium text-muted",
                                browseTab === "journals" && "bg-accent/12 text-accent-dark",
                            )}
                        >
                            {journalCount}
                        </span>
                    )}
                </button>
            </div>

            {browseTab === "explore" ? (
                <>
                    <Button onClick={onAddPlace} className="mb-5 w-full">
                        <Plus size={16} className="mr-1.5" />
                        Add a place
                    </Button>

                    <DivisionExploreSection
                        division={selectedDivision}
                        provinces={provinces}
                        municities={municities}
                        municityMeta={municityMeta}
                        provinceMunicities={provinceMunicities}
                        places={areaPlaces}
                        store={travelStore}
                        viewTab={viewTab}
                        statusFilter={statusFilter}
                        onStatusFilterChange={onStatusFilterChange}
                        onSelectDivision={onSelectDivision}
                        onNewJournal={onNewJournal}
                    />
                </>
            ) : (
                <PanelJournalsView
                    places={areaPlaces}
                    store={travelStore}
                    onOpenJournal={onOpenJournal}
                />
            )}
        </>
    );
}
