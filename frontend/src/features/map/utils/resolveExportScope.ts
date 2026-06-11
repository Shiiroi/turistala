import type { MunicityMeta, ProvinceGeoJSON, Region } from "../types";
import type { MapExportLevel, MapExportScope, ResolvedExportScope } from "../types/mapExport";
import { slugifyFilename } from "../../../lib/downloadFile";

function nameById<T extends { id: number; name: string }>(items: T[], id: number): string {
    return items.find((i) => i.id === id)?.name ?? `#${id}`;
}

export function resolveExportScope(
    level: MapExportLevel,
    scope: MapExportScope,
    regions: Region[],
    provinces: ProvinceGeoJSON[],
    municityMeta: MunicityMeta[],
): ResolvedExportScope {
    let entityIds: number[] = [];
    let municityIds = new Set<number>();
    let label = "Philippines";

    const munisInRegion = (regionId: number) =>
        municityMeta.filter((m) => {
            const prov = provinces.find((p) => p.id === m.province_id);
            return prov?.region_id === regionId || m.region_id === regionId;
        });

    const munisInProvince = (provinceId: number) =>
        municityMeta.filter((m) => m.province_id === provinceId);

    switch (level) {
        case "region": {
            if (scope.kind === "all") {
                entityIds = regions.map((r) => r.id);
                municityMeta.forEach((m) => municityIds.add(m.id));
                label = "Whole Philippines · all regions";
            } else if (scope.kind === "pick") {
                entityIds = scope.ids;
                for (const regionId of entityIds) {
                    munisInRegion(regionId).forEach((m) => municityIds.add(m.id));
                }
                label =
                    entityIds.length === 1
                        ? nameById(regions, entityIds[0])
                        : `${entityIds.length} regions`;
            }
            break;
        }
        case "province": {
            if (scope.kind === "all") {
                entityIds = provinces.map((p) => p.id);
                municityMeta.forEach((m) => municityIds.add(m.id));
                label = "Whole Philippines · all provinces";
            } else if (scope.kind === "pick") {
                entityIds = scope.ids;
                for (const provinceId of entityIds) {
                    munisInProvince(provinceId).forEach((m) => municityIds.add(m.id));
                }
                label =
                    entityIds.length === 1
                        ? nameById(provinces, entityIds[0])
                        : `${entityIds.length} provinces`;
            } else if (scope.kind === "inRegion") {
                const regionProvinces = provinces.filter((p) => p.region_id === scope.regionId);
                entityIds = regionProvinces.map((p) => p.id);
                munisInRegion(scope.regionId).forEach((m) => municityIds.add(m.id));
                label = `${nameById(regions, scope.regionId)} · ${entityIds.length} provinces`;
            }
            break;
        }
        case "municipality": {
            if (scope.kind === "all") {
                entityIds = municityMeta.map((m) => m.id);
                municityIds = new Set(entityIds);
                label = "Whole Philippines · all municipalities";
            } else if (scope.kind === "pick") {
                entityIds = scope.ids;
                entityIds.forEach((id) => municityIds.add(id));
                label =
                    entityIds.length === 1
                        ? nameById(municityMeta, entityIds[0])
                        : `${entityIds.length} municipalities`;
            } else if (scope.kind === "inProvince") {
                const munis = munisInProvince(scope.provinceId);
                entityIds = munis.map((m) => m.id);
                entityIds.forEach((id) => municityIds.add(id));
                label = `${nameById(provinces, scope.provinceId)} · ${entityIds.length} municipalities`;
            } else if (scope.kind === "inRegion") {
                const munis = munisInRegion(scope.regionId);
                entityIds = munis.map((m) => m.id);
                entityIds.forEach((id) => municityIds.add(id));
                label = `${nameById(regions, scope.regionId)} · ${entityIds.length} municipalities`;
            }
            break;
        }
    }

    return {
        entityIds,
        municityIds,
        label,
        slug: slugifyFilename(label),
    };
}
