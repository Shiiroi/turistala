import { MapPin } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { PillTabs } from "../../../components/ui/PillTabs";
import { cn } from "../../../lib/cn";
import {
    municityMetaToDivision,
    municityToDivision,
    provinceToDivision,
} from "../hooks/useMapSelection";
import type { Division } from "../types";
import { PlaceCard, type PlaceFilterTab } from "../../travel/components/PlaceActions";
import type { MockPlace } from "../../travel/types";
import type { TravelStore } from "../../travel/types";
import type { MunicityGeoJSON, MunicityMeta, ProvinceGeoJSON } from "../../map/types";
import type { ExploreViewTab } from "./divisionExploreUtils";

interface SubdivisionRow {
    id: number;
    name: string;
    subtitle?: string;
    explored: boolean;
}

interface DivisionExploreSectionProps {
    division: Division;
    provinces: ProvinceGeoJSON[];
    municities: MunicityGeoJSON[];
    municityMeta: MunicityMeta[];
    provinceMunicities: MunicityMeta[];
    places: MockPlace[];
    store: TravelStore;
    viewTab: ExploreViewTab;
    statusFilter: PlaceFilterTab;
    onStatusFilterChange: (filter: PlaceFilterTab) => void;
    onSelectDivision: (division: Division) => void;
    onNewJournal?: (placeId: string) => void;
}

function isMuniExplored(
    muniId: number,
    store: TravelStore,
    visitedPlaceIds: Set<string>,
): boolean {
    return store.places.some((p) => p.municity_id === muniId && visitedPlaceIds.has(p.id));
}

function isProvinceExplored(
    provinceId: number,
    store: TravelStore,
    municityMeta: MunicityMeta[],
    visitedPlaceIds: Set<string>,
): boolean {
    return store.places.some(
        (p) =>
            visitedPlaceIds.has(p.id) &&
            municityMeta.some((m) => m.id === p.municity_id && m.province_id === provinceId),
    );
}

function filterByStatus<T extends { explored: boolean }>(
    items: T[],
    statusFilter: PlaceFilterTab,
): T[] {
    switch (statusFilter) {
        case "all":
            return items;
        case "visited":
            return items.filter((i) => i.explored);
        case "unvisited":
            return items.filter((i) => !i.explored);
    }
}

export function DivisionExploreSection({
    division,
    provinces,
    municities,
    municityMeta,
    provinceMunicities,
    places,
    store,
    viewTab,
    statusFilter,
    onStatusFilterChange,
    onSelectDivision,
    onNewJournal,
}: DivisionExploreSectionProps) {
    const visitedPlaceIds = new Set(store.visited.map((v) => v.place_id));

    const subdivisionRows: SubdivisionRow[] = (() => {
        if (viewTab === "provinces" && division.level === "region") {
            return provinces
                .filter((p) => p.region_id === division.id)
                .map((p) => ({
                    id: p.id,
                    name: p.name,
                    explored: isProvinceExplored(p.id, store, municityMeta, visitedPlaceIds),
                }));
        }
        if (viewTab === "municipalities") {
            const munis =
                division.level === "province"
                    ? provinceMunicities.length > 0
                        ? provinceMunicities
                        : municityMeta.filter((m) => m.province_id === division.id)
                    : municityMeta.filter((m) => {
                          const prov = provinces.find((p) => p.id === m.province_id);
                          return prov?.region_id === division.id;
                      });
            return munis.map((m) => ({
                id: m.id,
                name: m.name,
                subtitle: m.type === "city" ? "City" : "Municipality",
                explored: isMuniExplored(m.id, store, visitedPlaceIds),
            }));
        }
        return [];
    })();

    const filteredSubdivisions = filterByStatus(subdivisionRows, statusFilter);

    const destinations = places.filter((p) => store.getPlaceStatus(p.id) != null);
    const visitedPlaces = destinations.filter((p) => store.getPlaceStatus(p.id) === "visited");
    const unvisitedPlaces = destinations.filter((p) => store.getPlaceStatus(p.id) === "goal");
    const filteredPlaces = (() => {
        switch (statusFilter) {
            case "all":
                return destinations;
            case "visited":
                return visitedPlaces;
            case "unvisited":
                return unvisitedPlaces;
        }
    })();

    const statusCounts = (() => {
        if (viewTab === "places") {
            return {
                all: destinations.length,
                visited: visitedPlaces.length,
                unvisited: unvisitedPlaces.length,
            };
        }
        return {
            all: subdivisionRows.length,
            visited: subdivisionRows.filter((r) => r.explored).length,
            unvisited: subdivisionRows.filter((r) => !r.explored).length,
        };
    })();

    const statusTabs: { id: PlaceFilterTab; label: string; count: number }[] = [
        { id: "all", label: "All", count: statusCounts.all },
        { id: "unvisited", label: "Unvisited", count: statusCounts.unvisited },
        { id: "visited", label: "Visited", count: statusCounts.visited },
    ];

    const viewTabLabels: Record<ExploreViewTab, string> = {
        provinces: "Provinces",
        municipalities: "Municipalities",
        places: "Places",
    };

    function handleSubdivisionSelect(id: number) {
        if (viewTab === "provinces") {
            const p = provinces.find((x) => x.id === id);
            if (p) onSelectDivision(provinceToDivision(p));
            return;
        }
        const withGeo = municities.find((x) => x.id === id);
        if (withGeo) {
            onSelectDivision(municityToDivision(withGeo));
            return;
        }
        const meta =
            provinceMunicities.find((x) => x.id === id) ?? municityMeta.find((x) => x.id === id);
        if (meta) onSelectDivision(municityMetaToDivision(meta, provinces));
    }

    const emptyHint =
        viewTab === "places"
            ? "No places added yet. Use Add a place above to start your list."
            : `No ${viewTabLabels[viewTab].toLowerCase()} match this filter.`;

    return (
        <div className="mb-4">
            <div className="mb-2.5 flex items-baseline justify-between gap-2">
                <div className="font-display text-[17px] font-semibold text-primary">
                    Exploring {division.name}
                </div>
            </div>

            <PillTabs
                value={statusFilter}
                options={statusTabs.map((tab) => ({
                    value: tab.id,
                    label: `${tab.label} (${tab.count})`,
                }))}
                onChange={onStatusFilterChange}
                className="mb-3 border-t border-border-light pt-3.5"
            />

            {viewTab === "places" ? (
                filteredPlaces.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border bg-parchment px-4 py-4 text-center text-[13px] italic text-muted">
                        {emptyHint}
                    </div>
                ) : (
                    filteredPlaces.map((place) => {
                        const status = store.getPlaceStatus(place.id)!;
                        return (
                            <PlaceCard
                                key={place.id}
                                place={place}
                                status={status}
                                store={store}
                                onNewJournal={status === "visited" ? onNewJournal : undefined}
                            />
                        );
                    })
                )
            ) : filteredSubdivisions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-parchment px-4 py-4 text-center text-[13px] italic text-muted">
                    {emptyHint}
                </div>
            ) : (
                <div className="mt-3 overflow-hidden rounded-lg border border-border-light">
                    {filteredSubdivisions.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSubdivisionSelect(item.id)}
                            className={cn(
                                "flex w-full cursor-pointer items-center gap-2.5 border-none border-b border-border-light bg-transparent px-3.5 py-2.5 text-left font-body select-none last:border-b-0",
                                "transition-colors duration-150 hover:bg-parchment active:bg-border-light",
                            )}
                        >
                            <MapPin
                                size={14}
                                className={cn(
                                    "shrink-0",
                                    item.explored ? "text-accent" : "text-muted",
                                )}
                            />
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-primary">{item.name}</div>
                                {item.subtitle && (
                                    <div className="font-mono text-xs text-muted">{item.subtitle}</div>
                                )}
                            </div>
                            <Badge variant={item.explored ? "visited" : "default"}>
                                {item.explored ? "Visited" : "Unvisited"}
                            </Badge>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
