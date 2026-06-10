import type { Division } from "../types";
import type { MockPlace } from "../../travel/types";
import type { MunicityMeta, ProvinceGeoJSON } from "../../map/types";

export function effectiveRegionId(m: MunicityMeta, provinces: ProvinceGeoJSON[]): number | null {
    if (m.province_id) {
        return provinces.find((p) => p.id === m.province_id)?.region_id ?? m.region_id;
    }
    return m.region_id;
}

export function municityIdsInRegion(
    regionId: number,
    municityMeta: MunicityMeta[],
    provinces: ProvinceGeoJSON[],
): Set<number> {
    const ids = new Set<number>();
    for (const m of municityMeta) {
        if (effectiveRegionId(m, provinces) === regionId) ids.add(m.id);
    }
    return ids;
}

export function municityIdsInProvince(provinceId: number, municityMeta: MunicityMeta[]): Set<number> {
    return new Set(municityMeta.filter((m) => m.province_id === provinceId).map((m) => m.id));
}

export function placesInDivision(
    division: Division,
    places: MockPlace[],
    municityMeta: MunicityMeta[],
    provinces: ProvinceGeoJSON[],
): MockPlace[] {
    switch (division.level) {
        case "region": {
            const ids = municityIdsInRegion(division.id, municityMeta, provinces);
            return places.filter((p) => ids.has(p.municity_id));
        }
        case "province": {
            const ids = municityIdsInProvince(division.id, municityMeta);
            return places.filter((p) => ids.has(p.municity_id));
        }
        case "municipality":
            return places.filter((p) => p.municity_id === division.id);
    }
}

export function resolveRegionId(division: Division, provinces: ProvinceGeoJSON[]): number | null {
    if (division.level === "region") return division.id;
    if (division.level === "province") return division.region_id ?? null;
    if (division.province_id) {
        return provinces.find((p) => p.id === division.province_id)?.region_id ?? division.region_id ?? null;
    }
    return division.region_id ?? null;
}

export function resolveProvinceId(division: Division): number | null {
    if (division.level === "province") return division.id;
    if (division.level === "municipality") return division.province_id;
    return null;
}
