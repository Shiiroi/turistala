import type { ProvinceGeoJSON } from "../../map/types";

export const METRO_MANILA_PROVINCE_ID = 1;
export const SGA_PROVINCE_NAME = "Special Geographic Area";

export interface ProvinceFilterOptions {
    includeMM: boolean;
    includeSGA: boolean;
}

export function filterProvincesForProgress(
    provinces: ProvinceGeoJSON[],
    options: ProvinceFilterOptions,
): ProvinceGeoJSON[] {
    return provinces.filter((p) => {
        if (!options.includeMM && p.id === METRO_MANILA_PROVINCE_ID) return false;
        if (!options.includeSGA && p.name === SGA_PROVINCE_NAME) return false;
        return true;
    });
}

export function isMetroManilaProvince(province: { id: number }): boolean {
    return province.id === METRO_MANILA_PROVINCE_ID;
}

export function isSgaProvince(province: { name: string }): boolean {
    return province.name === SGA_PROVINCE_NAME;
}
