// Progress-driven heatmap colors from travel data.

import { useMemo } from "react";
import type { MapMode } from "../../homepage/types";
import type { ExploreViewTab } from "../../homepage/components/divisionExploreUtils";
import type { TravelStore } from "../types";
import type { MunicityGeoJSON, MunicityMeta, ProvinceGeoJSON } from "../../map/types";
import { buildHeatmapPalette, getHeatmapColorFromRatio } from "./useMockHeatmapData";

 /**
  * Performs operations for ratioColor in useProgressHeatmapColors.ts.
  * @param visited - Parameter representing visited.
  * @param total - Parameter representing total.
  * @param palette - Parameter representing palette.
  * @returns Value or promise returned by ratioColor.
 */
function ratioColor(visited: number, total: number, palette: string[]): string {
    if (total === 0) return palette[0];
    return getHeatmapColorFromRatio(visited / total, palette);
}

 /**
  * Performs operations for indexPlacesByMunicity in useProgressHeatmapColors.ts.
  * @param places - Parameter representing places.
  * @returns Value or promise returned by indexPlacesByMunicity.
 */
function indexPlacesByMunicity(places: TravelStore["places"]): Map<number, TravelStore["places"]> {
    const byMunicity = new Map<number, TravelStore["places"]>();
    for (const place of places) {
        const list = byMunicity.get(place.municity_id);
        if (list) {
            list.push(place);
        } else {
            byMunicity.set(place.municity_id, [place]);
        }
    }
    return byMunicity;
}

 /**
  * Performs operations for indexMunisByProvince in useProgressHeatmapColors.ts.
  * @param municityMeta - Parameter representing municityMeta.
  * @returns Value or promise returned by indexMunisByProvince.
 */
function indexMunisByProvince(municityMeta: MunicityMeta[]): Map<number, MunicityMeta[]> {
    const byProvince = new Map<number, MunicityMeta[]>();
    for (const muni of municityMeta) {
        if (!muni.province_id) continue;
        const list = byProvince.get(muni.province_id);
        if (list) {
            list.push(muni);
        } else {
            byProvince.set(muni.province_id, [muni]);
        }
    }
    return byProvince;
}

 /**
  * Performs operations for indexProvincesByRegion in useProgressHeatmapColors.ts.
  * @param provinces - Parameter representing provinces.
  * @returns Value or promise returned by indexProvincesByRegion.
 */
function indexProvincesByRegion(provinces: ProvinceGeoJSON[]): Map<number, ProvinceGeoJSON[]> {
    const byRegion = new Map<number, ProvinceGeoJSON[]>();
    for (const province of provinces) {
        const list = byRegion.get(province.region_id);
        if (list) {
            list.push(province);
        } else {
            byRegion.set(province.region_id, [province]);
        }
    }
    return byRegion;
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
        const colors = new Map<number, string>();
        const { places, goals, visited: visitedList } = store;

        const visitedPlaceIds = new Set(visitedList.map((v) => v.place_id));
        const goalPlaceIds = new Set(
            goals.filter((g) => !g.is_visited).map((g) => g.place_id),
        );
        const placesByMunicity = indexPlacesByMunicity(places);
        const munisByProvince = indexMunisByProvince(municityMeta);
        const provincesByRegion = indexProvincesByRegion(provinces);

        const isMuniExplored = (muniId: number) => {
            const muniPlaces = placesByMunicity.get(muniId);
            if (!muniPlaces) return false;
            return muniPlaces.some((p) => visitedPlaceIds.has(p.id));
        };

        const isProvinceExplored = (provinceId: number) => {
            const munis = munisByProvince.get(provinceId) ?? [];
            return munis.some((m) => isMuniExplored(m.id));
        };

        const getPlaceStatus = (placeId: string) => {
            if (visitedPlaceIds.has(placeId)) return "visited" as const;
            if (goalPlaceIds.has(placeId)) return "goal" as const;
            return null;
        };

        const countVisitedPlaces = (muniPlaces: TravelStore["places"]) => {
            let total = 0;
            let visitedCount = 0;
            for (const place of muniPlaces) {
                const status = getPlaceStatus(place.id);
                if (status == null) continue;
                total += 1;
                if (status === "visited") visitedCount += 1;
            }
            return { visitedCount, total };
        };

        switch (mapMode) {
            case "region": {
                for (const region of regions) {
                    const regionProvinces = provincesByRegion.get(region.id) ?? [];
                    const regionMunis = regionProvinces.flatMap(
                        (p) => munisByProvince.get(p.id) ?? [],
                    );

                    let visitedCount = 0;
                    let total = 0;

                    switch (progressBy) {
                        case "provinces":
                            total = regionProvinces.length;
                            visitedCount = regionProvinces.filter((p) =>
                                isProvinceExplored(p.id),
                            ).length;
                            break;
                        case "municipalities":
                            total = regionMunis.length;
                            visitedCount = regionMunis.filter((m) => isMuniExplored(m.id)).length;
                            break;
                        case "places": {
                            const regionMuniIds = new Set(regionMunis.map((m) => m.id));
                            const regionPlaces = places.filter((p) =>
                                regionMuniIds.has(p.municity_id),
                            );
                            ({ visitedCount, total } = countVisitedPlaces(regionPlaces));
                            break;
                        }
                    }

                    colors.set(region.id, ratioColor(visitedCount, total, palette));
                }
                break;
            }
            case "province": {
                for (const province of provinces) {
                    const provMunis = munisByProvince.get(province.id) ?? [];

                    let visitedCount: number;
                    let total: number;

                    switch (progressBy) {
                        case "municipalities":
                            total = provMunis.length;
                            visitedCount = provMunis.filter((m) => isMuniExplored(m.id)).length;
                            break;
                        case "places": {
                            const provMuniIds = new Set(provMunis.map((m) => m.id));
                            const provPlaces = places.filter((p) =>
                                provMuniIds.has(p.municity_id),
                            );
                            ({ visitedCount, total } = countVisitedPlaces(provPlaces));
                            break;
                        }
                        default:
                            total = provMunis.length;
                            visitedCount = provMunis.filter((m) => isMuniExplored(m.id)).length;
                            break;
                    }

                    colors.set(province.id, ratioColor(visitedCount, total, palette));
                }
                break;
            }
            case "municipality": {
                for (const muni of municities) {
                    const muniPlaces = placesByMunicity.get(muni.id) ?? [];
                    const { visitedCount, total } = countVisitedPlaces(muniPlaces);
                    colors.set(muni.id, ratioColor(visitedCount, total, palette));
                }
                break;
            }
        }

        return colors;
    }, [
        mapMode,
        progressBy,
        accentColor,
        store.places,
        store.visited,
        store.goals,
        regions,
        provinces,
        municityMeta,
        municities,
    ]);
}
