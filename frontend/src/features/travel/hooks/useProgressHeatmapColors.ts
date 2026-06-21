// useProgressHeatmapColors.ts — Progress-driven heatmap colors from travel data.

import { useMemo } from "react";
import type { MapMode } from "../../homepage/types";
import type { ExploreViewTab } from "../../homepage/components/divisionExploreUtils";
import type { TravelStore } from "../types";
import type { MunicityGeoJSON, MunicityMeta, ProvinceGeoJSON } from "../../map/types";
import { buildHeatmapPalette, getHeatmapColorFromRatio } from "./useMockHeatmapData";

function visitedPlaceIds(store: TravelStore): Set<string> {
    return new Set(store.visited.map((v) => v.place_id));
}

function isMuniExplored(muniId: number, store: TravelStore, visited: Set<string>): boolean {
    return store.places.some((p) => p.municity_id === muniId && visited.has(p.id));
}

function isProvinceExplored(
    provinceId: number,
    store: TravelStore,
    municityMeta: MunicityMeta[],
    visited: Set<string>,
): boolean {
    return store.places.some(
        (p) =>
            visited.has(p.id) &&
            municityMeta.some((m) => m.id === p.municity_id && m.province_id === provinceId),
    );
}

function ratioColor(visited: number, total: number, palette: string[]): string {
    if (total === 0) return palette[0];
    return getHeatmapColorFromRatio(visited / total, palette);
}

// Derives heatmap colors from real visit progress for the current map mode and tab.
export function useProgressHeatmapColors(
    mapMode: MapMode,
    progressBy: ExploreViewTab,
    store: TravelStore,
    regions: { id: number }[],
    provinces: ProvinceGeoJSON[],
    municityMeta: MunicityMeta[],
    municities: MunicityGeoJSON[],
    accentColor: string,
): Map<number, string> {
    return useMemo(() => {
        const palette = buildHeatmapPalette(accentColor);
        const visited = visitedPlaceIds(store);
        const colors = new Map<number, string>();

        switch (mapMode) {
            case "region": {
                for (const region of regions) {
                    const regionProvinces = provinces.filter((p) => p.region_id === region.id);
                    const regionMunis = municityMeta.filter((m) =>
                        regionProvinces.some((p) => p.id === m.province_id),
                    );
                    const regionPlaces = store.places.filter((p) =>
                        regionMunis.some((m) => m.id === p.municity_id),
                    );
                    const destinations = regionPlaces.filter((p) => store.getPlaceStatus(p.id) != null);

                    let visitedCount = 0;
                    let total = 0;

                    switch (progressBy) {
                        case "provinces":
                            total = regionProvinces.length;
                            visitedCount = regionProvinces.filter((p) =>
                                isProvinceExplored(p.id, store, municityMeta, visited),
                            ).length;
                            break;
                        case "municipalities":
                            total = regionMunis.length;
                            visitedCount = regionMunis.filter((m) =>
                                isMuniExplored(m.id, store, visited),
                            ).length;
                            break;
                        case "places":
                            total = destinations.length;
                            visitedCount = destinations.filter(
                                (p) => store.getPlaceStatus(p.id) === "visited",
                            ).length;
                            break;
                    }

                    colors.set(region.id, ratioColor(visitedCount, total, palette));
                }
                break;
            }
            case "province": {
                for (const province of provinces) {
                    const provMunis = municityMeta.filter((m) => m.province_id === province.id);
                    const provPlaces = store.places.filter((p) =>
                        provMunis.some((m) => m.id === p.municity_id),
                    );
                    const destinations = provPlaces.filter((p) => store.getPlaceStatus(p.id) != null);

                    let visitedCount: number;
                    let total: number;

                    switch (progressBy) {
                        case "municipalities":
                            total = provMunis.length;
                            visitedCount = provMunis.filter((m) =>
                                isMuniExplored(m.id, store, visited),
                            ).length;
                            break;
                        case "places":
                            total = destinations.length;
                            visitedCount = destinations.filter(
                                (p) => store.getPlaceStatus(p.id) === "visited",
                            ).length;
                            break;
                        default:
                            total = provMunis.length;
                            visitedCount = provMunis.filter((m) =>
                                isMuniExplored(m.id, store, visited),
                            ).length;
                            break;
                    }

                    colors.set(province.id, ratioColor(visitedCount, total, palette));
                }
                break;
            }
            case "municipality": {
                for (const muni of municities) {
                    const muniPlaces = store.places.filter((p) => p.municity_id === muni.id);
                    const destinations = muniPlaces.filter((p) => store.getPlaceStatus(p.id) != null);
                    const visitedCount = destinations.filter(
                        (p) => store.getPlaceStatus(p.id) === "visited",
                    ).length;
                    colors.set(muni.id, ratioColor(visitedCount, destinations.length, palette));
                }
                break;
            }
        }

        return colors;
    }, [
        mapMode,
        progressBy,
        accentColor,
        store,
        regions,
        provinces,
        municityMeta,
        municities,
    ]);
}
