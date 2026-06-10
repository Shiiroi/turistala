import type { ExploreViewTab } from "../../homepage/components/DivisionExploreSection";

/** Passport progress levels — includes regions (not in map sidebar tabs). */
export type PassportProgressLevel = "regions" | ExploreViewTab;

export interface DivisionProgress {
    id: number;
    name: string;
    visited: number;
    total: number;
    fraction: number;
    /** Set for place-level drill-down rows */
    placeId?: string;
}

export interface RegionPassportRow extends DivisionProgress {
    provinces: DivisionProgress[];
}

export interface PassportStats {
    metric: PassportProgressLevel;
    totalRegions: number;
    visitedRegions: number;
    totalProvinces: number;
    visitedProvinces: number;
    totalMunicipalities: number;
    visitedMunicipalities: number;
    totalPlaces: number;
    visitedPlaces: number;
    overallFraction: number;
    regions: RegionPassportRow[];
}

/** @deprecated use PassportStats */
export interface ProvinceProgress {
    provinceId: number;
    provinceName: string;
    totalMunicities: number;
    visitedMunicities: number;
    completionFraction: number;
}

/** @deprecated use RegionPassportRow */
export interface RegionBadge {
    regionId: number;
    regionName: string;
    totalProvinces: number;
    visitedProvinces: number;
    badgeEarned: boolean;
}

export const PASSPORT_PROGRESS_OPTIONS: { value: PassportProgressLevel; label: string }[] = [
    { value: "regions", label: "Regions" },
    { value: "provinces", label: "Provinces" },
    { value: "municipalities", label: "Municipalities" },
    { value: "places", label: "Places" },
];
