import { fetchMunicitiesByProvince } from "../services/mapApi";
import type { MunicityGeoJSON, MunicityMeta, ProvinceGeoJSON } from "../types";
import type { MapExportLevel, MapExportScope } from "../types/mapExport";

export async function loadMunicitiesForExport(
    level: MapExportLevel,
    scope: MapExportScope,
    entityIds: number[],
    provinces: ProvinceGeoJSON[],
    municityMeta: MunicityMeta[],
    cachedMunicities: MunicityGeoJSON[],
): Promise<MunicityGeoJSON[]> {
    if (level !== "municipality") return [];

    const idSet = new Set(entityIds);

    if (scope.kind === "all") {
        if (cachedMunicities.length > 0) return cachedMunicities;
        const provinceIds = [...new Set(municityMeta.map((m) => m.province_id).filter(Boolean))] as number[];
        const chunks = await Promise.all(provinceIds.map((id) => fetchMunicitiesByProvince(id)));
        return chunks.flat();
    }

    if (scope.kind === "inProvince") {
        return fetchMunicitiesByProvince(scope.provinceId);
    }

    if (scope.kind === "inRegion") {
        const provinceIds = provinces
            .filter((p) => p.region_id === scope.regionId)
            .map((p) => p.id);
        const chunks = await Promise.all(provinceIds.map((id) => fetchMunicitiesByProvince(id)));
        return chunks.flat();
    }

    if (scope.kind === "pick") {
        const provinceIds = new Set<number>();
        for (const muniId of entityIds) {
            const meta = municityMeta.find((m) => m.id === muniId);
            if (meta?.province_id) provinceIds.add(meta.province_id);
        }
        const loaded = await Promise.all([...provinceIds].map((id) => fetchMunicitiesByProvince(id)));
        return loaded.flat().filter((m) => idSet.has(m.id));
    }

    return [];
}
