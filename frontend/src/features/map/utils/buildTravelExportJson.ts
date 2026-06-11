import type { TravelStore } from "../../travel/types";
import type {
    MapExportConfig,
    TuristalaExportFile,
} from "../types/mapExport";
import type { ResolvedExportScope } from "../types/mapExport";
import { downloadJsonFile, slugifyFilename } from "../../../lib/downloadFile";

export function buildTravelExportFile(
    store: TravelStore,
    config: MapExportConfig,
    resolved: ResolvedExportScope,
): TuristalaExportFile {
    const municityIds = resolved.municityIds;
    const places = store.places.filter((p) => municityIds.has(p.municity_id));
    const placeIds = new Set(places.map((p) => p.id));

    return {
        version: 1,
        exported_at: new Date().toISOString(),
        scope: {
            level: config.level,
            progress_by: config.progressBy,
            selection: config.scope,
        },
        data: {
            places,
            goals: store.goals.filter((g) => placeIds.has(g.place_id)),
            visited: store.visited.filter((v) => placeIds.has(v.place_id)),
            journals: store.journals.filter((j) => placeIds.has(j.place_id)),
        },
    };
}

export function downloadTravelExport(
    store: TravelStore,
    config: MapExportConfig,
    resolved: ResolvedExportScope,
): void {
    const payload = buildTravelExportFile(store, config, resolved);
    const date = new Date().toISOString().slice(0, 10);
    const slug = slugifyFilename(resolved.slug);
    downloadJsonFile(payload, `turistala-export-${slug}-${date}.json`);
}
