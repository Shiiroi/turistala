// computePassportStats.ts — Client-side passport progress computation.

import type { ExploreViewTab } from "../../homepage/components/divisionExploreUtils";
import type { MunicityMeta, ProvinceGeoJSON, Region } from "../../map/types";
import type { TravelStore } from "../../travel/types";
import type { DivisionProgress, PassportProgressLevel, PassportStats, RegionPassportRow } from "../types";
import {
    filterProvincesForProgress,
    type ProvinceFilterOptions,
} from "./provinceFilters";

export type RegionalProgressBy = Exclude<PassportProgressLevel, "regions">;
export type ProvincialProgressBy = Exclude<PassportProgressLevel, "regions" | "provinces">;

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

function isRegionExplored(
    region: Region,
    store: TravelStore,
    provinces: ProvinceGeoJSON[],
    municityMeta: MunicityMeta[],
    visited: Set<string>,
): boolean {
    return provinces
        .filter((p) => p.region_id === region.id)
        .some((p) => isProvinceExplored(p.id, store, municityMeta, visited));
}

function progressRow(id: number, name: string, visited: number, total: number): DivisionProgress {
    return {
        id,
        name,
        visited,
        total,
        fraction: total > 0 ? visited / total : 0,
    };
}

function binaryVisitedCount(
    hasDestinations: boolean,
    isExplored: boolean,
): { visited: number; total: number } {
    if (!hasDestinations) return { visited: 0, total: 0 };
    return { visited: isExplored ? 1 : 0, total: 1 };
}

function countRegionProgress(
    region: Region,
    metric: PassportProgressLevel,
    store: TravelStore,
    provinces: ProvinceGeoJSON[],
    municityMeta: MunicityMeta[],
    visited: Set<string>,
    provinceFilter?: ProvinceFilterOptions,
): { visited: number; total: number } {
    let regionProvinces = provinces.filter((p) => p.region_id === region.id);
    if (metric === "provinces" && provinceFilter) {
        regionProvinces = filterProvincesForProgress(regionProvinces, provinceFilter);
    }
    const regionMunis = municityMeta.filter((m) =>
        regionProvinces.some((p) => p.id === m.province_id),
    );
    const regionPlaces = store.places.filter((p) =>
        regionMunis.some((m) => m.id === p.municity_id),
    );
    const destinations = regionPlaces.filter((p) => store.getPlaceStatus(p.id) != null);

    switch (metric) {
        case "regions":
            return binaryVisitedCount(
                destinations.length > 0,
                isRegionExplored(region, store, provinces, municityMeta, visited),
            );
        case "provinces":
            return {
                total: regionProvinces.length,
                visited: regionProvinces.filter((p) =>
                    isProvinceExplored(p.id, store, municityMeta, visited),
                ).length,
            };
        case "municipalities":
            return {
                total: regionMunis.length,
                visited: regionMunis.filter((m) => isMuniExplored(m.id, store, visited)).length,
            };
        case "places":
            return {
                total: destinations.length,
                visited: destinations.filter((p) => store.getPlaceStatus(p.id) === "visited").length,
            };
    }
    throw new Error(`Unhandled metric: ${metric}`);
}

function countProvinceProgress(
    province: ProvinceGeoJSON,
    metric: PassportProgressLevel,
    store: TravelStore,
    municityMeta: MunicityMeta[],
    visited: Set<string>,
): { visited: number; total: number } {
    const provMunis = municityMeta.filter((m) => m.province_id === province.id);
    const provPlaces = store.places.filter((p) => provMunis.some((m) => m.id === p.municity_id));
    const destinations = provPlaces.filter((p) => store.getPlaceStatus(p.id) != null);

    switch (metric) {
        case "regions":
        case "provinces":
            return binaryVisitedCount(
                destinations.length > 0,
                isProvinceExplored(province.id, store, municityMeta, visited),
            );
        case "municipalities":
            return {
                total: provMunis.length,
                visited: provMunis.filter((m) => isMuniExplored(m.id, store, visited)).length,
            };
        case "places":
            return {
                total: destinations.length,
                visited: destinations.filter((p) => store.getPlaceStatus(p.id) === "visited").length,
            };
    }
    throw new Error(`Unhandled metric: ${metric}`);
}

export function computePassportStats(
    metric: PassportProgressLevel,
    store: TravelStore,
    regions: Region[],
    provinces: ProvinceGeoJSON[],
    municityMeta: MunicityMeta[],
    provinceFilter?: ProvinceFilterOptions,
): PassportStats {
    const visited = visitedPlaceIds(store);
    const allDestinations = store.places.filter((p) => store.getPlaceStatus(p.id) != null);

    const provincesForTotals =
        metric === "provinces" && provinceFilter
            ? filterProvincesForProgress(provinces, provinceFilter)
            : provinces;

    const visitedRegions = regions.filter((r) =>
        isRegionExplored(r, store, provinces, municityMeta, visited),
    ).length;

    const visitedMunicipalities = municityMeta.filter((m) =>
        isMuniExplored(m.id, store, visited),
    ).length;

    const visitedPlaces = allDestinations.filter(
        (p) => store.getPlaceStatus(p.id) === "visited",
    ).length;

    const visitedProvinces = provincesForTotals.filter((p) =>
        isProvinceExplored(p.id, store, municityMeta, visited),
    ).length;

    const regionRows: RegionPassportRow[] = regions.map((region) => {
        let regionProvinces = provinces.filter((p) => p.region_id === region.id);
        if (metric === "provinces" && provinceFilter) {
            regionProvinces = filterProvincesForProgress(regionProvinces, provinceFilter);
        }
        const counts = countRegionProgress(
            region,
            metric,
            store,
            provinces,
            municityMeta,
            visited,
            provinceFilter,
        );

        const provinceRows = regionProvinces.map((province) => {
            const provCounts = countProvinceProgress(province, metric, store, municityMeta, visited);
            return progressRow(province.id, province.name, provCounts.visited, provCounts.total);
        });

        return {
            ...progressRow(region.id, region.name, counts.visited, counts.total),
            provinces: provinceRows,
        };
    });

    let overallFraction = 0;
    switch (metric) {
        case "regions":
            overallFraction = regions.length > 0 ? visitedRegions / regions.length : 0;
            break;
        case "provinces":
            overallFraction =
                provincesForTotals.length > 0 ? visitedProvinces / provincesForTotals.length : 0;
            break;
        case "municipalities":
            overallFraction =
                municityMeta.length > 0 ? visitedMunicipalities / municityMeta.length : 0;
            break;
        case "places":
            overallFraction =
                allDestinations.length > 0 ? visitedPlaces / allDestinations.length : 0;
            break;
    }

    return {
        metric,
        totalRegions: regions.length,
        visitedRegions,
        totalProvinces: provincesForTotals.length,
        visitedProvinces,
        totalMunicipalities: municityMeta.length,
        visitedMunicipalities,
        totalPlaces: allDestinations.length,
        visitedPlaces,
        overallFraction,
        regions: regionRows,
    };
}

export function computeRegionChildren(
    regionId: number,
    metric: RegionalProgressBy,
    store: TravelStore,
    provinces: ProvinceGeoJSON[],
    municityMeta: MunicityMeta[],
    provinceFilter?: ProvinceFilterOptions,
): DivisionProgress[] {
    const visited = visitedPlaceIds(store);
    let regionProvinces = provinces.filter((p) => p.region_id === regionId);
    if (metric === "provinces" && provinceFilter) {
        regionProvinces = filterProvincesForProgress(regionProvinces, provinceFilter);
    }

    return regionProvinces.map((province) => {
        const counts = countProvinceProgress(province, metric, store, municityMeta, visited);
        return progressRow(province.id, province.name, counts.visited, counts.total);
    });
}

export function computeProvinceChildren(
    provinceId: number,
    metric: ProvincialProgressBy,
    store: TravelStore,
    municityMeta: MunicityMeta[],
): DivisionProgress[] {
    const visited = visitedPlaceIds(store);
    const provMunis = municityMeta.filter((m) => m.province_id === provinceId);

    return provMunis.map((muni) => {
        const muniPlaces = store.places.filter((p) => p.municity_id === muni.id);
        const destinations = muniPlaces.filter((p) => store.getPlaceStatus(p.id) != null);

        if (metric === "municipalities") {
            if (destinations.length === 0) {
                return progressRow(muni.id, muni.name, 0, 0);
            }
            const explored = isMuniExplored(muni.id, store, visited) ? 1 : 0;
            return progressRow(muni.id, muni.name, explored, 1);
        }

        const visitedCount = destinations.filter(
            (p) => store.getPlaceStatus(p.id) === "visited",
        ).length;
        return progressRow(muni.id, muni.name, visitedCount, destinations.length);
    });
}

export function stampFixedMetric(level: "region" | "province"): PassportProgressLevel {
    return level === "region" ? "provinces" : "municipalities";
}

export function isBinaryListMetric(
    parentKind: "region" | "province",
    metric: PassportProgressLevel,
): boolean {
    return (
        (parentKind === "region" && metric === "provinces") ||
        (parentKind === "province" && metric === "municipalities")
    );
}

export function isDirectChildMetric(
    level: "region" | "province",
    metric: PassportProgressLevel,
): boolean {
    return (level === "region" && metric === "provinces") ||
        (level === "province" && metric === "municipalities");
}

export function isBinaryChildMetric(
    parentKind: "region" | "province",
    metric: PassportProgressLevel,
): boolean {
    return isBinaryListMetric(parentKind, metric);
}

export function isBinaryProgressMetric(
    metric: PassportProgressLevel,
    level: "region" | "province",
): boolean {
    if (level === "region" && metric === "regions") return true;
    if (level === "province" && (metric === "provinces" || metric === "regions")) return true;
    return false;
}

export interface ProgressDisplay {
    countText: string;
    pctText: string | null;
    isBinary: boolean;
    checked: boolean | null;
}

export function formatProgressDisplay(
    row: DivisionProgress,
    metric: PassportProgressLevel,
    level: "region" | "province" | "child" = "child",
    parentKind?: "region" | "province",
): ProgressDisplay {
    const isBinaryRow =
        parentKind != null &&
        isBinaryListMetric(parentKind, metric) &&
        (level === "province" || level === "child");

    const pct = row.total > 0 ? Math.round(row.fraction * 100) : 0;

    if (isBinaryRow) {
        return {
            countText: "",
            pctText: `${pct}%`,
            isBinary: true,
            checked: row.total > 0 && row.visited > 0,
        };
    }

    if (row.total === 0) {
        return { countText: "0/0", pctText: "0%", isBinary: false, checked: null };
    }

    return {
        countText: `${row.visited}/${row.total}`,
        pctText: `${pct}%`,
        isBinary: false,
        checked: null,
    };
}

export function metricLabel(metric: PassportProgressLevel): string {
    switch (metric) {
        case "regions":
            return "regions";
        case "provinces":
            return "provinces";
        case "municipalities":
            return "municipalities";
        case "places":
            return "places";
    }
    throw new Error(`Unhandled metric: ${metric}`);
}

// Singular label after "By" (e.g. "By province")
export function metricUnitLabel(metric: PassportProgressLevel): string {
    switch (metric) {
        case "regions":
            return "region";
        case "provinces":
            return "province";
        case "municipalities":
            return "municipality";
        case "places":
            return "place";
    }
    throw new Error(`Unhandled metric: ${metric}`);
}

export function progressLineFromStats(stats: PassportStats): {
    visited: number;
    total: number;
    label: string;
    pct: number | null;
} {
    switch (stats.metric) {
        case "regions":
            return {
                visited: stats.visitedRegions,
                total: stats.totalRegions,
                label: metricLabel(stats.metric),
                pct: stats.totalRegions > 0 ? Math.round(stats.overallFraction * 100) : null,
            };
        case "provinces":
            return {
                visited: stats.visitedProvinces,
                total: stats.totalProvinces,
                label: metricLabel(stats.metric),
                pct: stats.totalProvinces > 0 ? Math.round(stats.overallFraction * 100) : null,
            };
        case "municipalities":
            return {
                visited: stats.visitedMunicipalities,
                total: stats.totalMunicipalities,
                label: metricLabel(stats.metric),
                pct:
                    stats.totalMunicipalities > 0
                        ? Math.round(stats.overallFraction * 100)
                        : null,
            };
        case "places":
            return {
                visited: stats.visitedPlaces,
                total: stats.totalPlaces,
                label: metricLabel(stats.metric),
                pct: stats.totalPlaces > 0 ? Math.round(stats.overallFraction * 100) : null,
            };
    }
    throw new Error(`Unhandled metric: ${stats.metric}`);
}

export function stampProgressLabel(row: DivisionProgress): string {
    if (row.total === 0) return "0/0";
    const pct = Math.round(row.fraction * 100);
    return `${row.visited}/${row.total} · ${pct}%`;
}

export function summarizeStampProgress(
    visited: number,
    total: number,
    metric: PassportProgressLevel,
    parentKind: "region" | "province",
): string {
    const label = metricLabel(metric);
    const pct = total > 0 ? Math.round((visited / total) * 100) : 0;
    if (total === 0) return `0/0 ${label} · 0%`;
    if (isBinaryListMetric(parentKind, metric)) {
        return `${visited}/${total} ${label} visited · ${pct}%`;
    }
    return `${visited}/${total} ${label} · ${pct}%`;
}

export function summarizeChildProgress(
    children: DivisionProgress[],
    childMetric: PassportProgressLevel,
    parentKind: "region" | "province",
    stampTotals?: { visited: number; total: number },
): { text: string; isBinaryList: boolean } {
    if (stampTotals) {
        return {
            text: summarizeStampProgress(
                stampTotals.visited,
                stampTotals.total,
                childMetric,
                parentKind,
            ),
            isBinaryList: isBinaryListMetric(parentKind, childMetric),
        };
    }

    const label = metricLabel(childMetric);
    const isBinaryList = isBinaryListMetric(parentKind, childMetric);

    if (isBinaryList) {
        const visitedCount = children.filter((c) => c.visited > 0).length;
        const pct =
            children.length > 0 ? Math.round((visitedCount / children.length) * 100) : 0;
        return {
            text: `${visitedCount}/${children.length} ${label} visited · ${pct}%`,
            isBinaryList: true,
        };
    }

    const totalVisited = children.reduce((s, c) => s + c.visited, 0);
    const totalGoals = children.reduce((s, c) => s + c.total, 0);

    if (totalGoals === 0) {
        return { text: `0/${children.length} ${label} · 0%`, isBinaryList: false };
    }
    const pct = Math.round((totalVisited / totalGoals) * 100);
    return {
        text: `${totalVisited}/${totalGoals} ${label} · ${pct}%`,
        isBinaryList: false,
    };
}

// deprecated: use RegionalProgressBy
export type ExploreViewTabAlias = ExploreViewTab;
