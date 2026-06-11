import type { Division } from "../types";
import type { MockPlace, TravelStore } from "../../travel/types";
import type { MunicityMeta, ProvinceGeoJSON } from "../../map/types";

export type ExploreViewTab = "provinces" | "municipalities" | "places";

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

export function getAvailableViewTabs(level: Division["level"]): ExploreViewTab[] {
    switch (level) {
        case "region":
            return ["provinces", "municipalities", "places"];
        case "province":
            return ["municipalities", "places"];
        case "municipality":
            return ["places"];
    }
}

export function getDefaultViewTab(level: Division["level"]): ExploreViewTab {
    switch (level) {
        case "region":
            return "provinces";
        case "province":
            return "municipalities";
        case "municipality":
            return "places";
    }
}

export function computeExploreProgress(
    division: Division,
    viewTab: ExploreViewTab,
    provinces: ProvinceGeoJSON[],
    municityMeta: MunicityMeta[],
    provinceMunicities: MunicityMeta[],
    places: MockPlace[],
    store: TravelStore,
): { visited: number; total: number } {
    const visitedPlaceIds = new Set(store.visited.map((v) => v.place_id));

    switch (viewTab) {
        case "provinces": {
            const rows = provinces
                .filter((p) => p.region_id === division.id)
                .map((p) => isProvinceExplored(p.id, store, municityMeta, visitedPlaceIds));
            return { visited: rows.filter(Boolean).length, total: rows.length };
        }
        case "municipalities": {
            const munis =
                division.level === "province"
                    ? provinceMunicities.length > 0
                        ? provinceMunicities
                        : municityMeta.filter((m) => m.province_id === division.id)
                    : municityMeta.filter((m) => {
                          const prov = provinces.find((p) => p.id === m.province_id);
                          return prov?.region_id === division.id;
                      });
            return {
                visited: munis.filter((m) => isMuniExplored(m.id, store, visitedPlaceIds)).length,
                total: munis.length,
            };
        }
        case "places": {
            const destinations = places.filter((p) => store.getPlaceStatus(p.id) != null);
            return {
                visited: destinations.filter((p) => store.getPlaceStatus(p.id) === "visited").length,
                total: destinations.length,
            };
        }
    }
}
