// Loads municipality geometry needed for a scoped map export.

import { fetchMunicitiesByProvince } from "../services/mapApi";
import type { MunicityGeoJSON, MunicityMeta, ProvinceGeoJSON } from "../types";
import type { MapExportLevel, MapExportScope } from "../types/mapExport";

 /**
  * Loads the detailed GeoJSON boundary coordinates for all municipalities within the target export scope.
  * Resolves necessary parent province associations and fetches datasets in parallel where needed.
  * @param level - The target export level (only retrieves coordinates when level is 'municipality').
  * @param scope - The configuration details specifying whether it's 'all', 'pick', 'inRegion', or 'inProvince'.
  * @param entityIds - Flat array of target municipal IDs.
  * @param provinces - List of provincial metadata.
  * @param municityMeta - List of municipal metadata.
  * @param cachedMunicities - Currently cached list of already loaded municipalities to avoid redundant network requests.
  * @returns A promise resolving to an array of municipal GeoJSON rows with active boundaries.
 */
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
