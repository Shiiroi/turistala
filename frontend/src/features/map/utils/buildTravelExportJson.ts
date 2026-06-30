// Builds and downloads scoped JSON travel data exports.

import type { TravelStore } from "../../travel/types";
import type {
    MapExportConfig,
    TuristalaExportFile,
} from "../types/mapExport";
import type { ResolvedExportScope } from "../types/mapExport";
import { downloadJsonFile, slugifyFilename } from "../../../lib/downloadFile";

 /**
  * Filters the active travel store records (places, goals, visited locations, and journal logs)
  * to only include data points that physically lie within the resolved municipality boundary set.
  * @param store - The active travel data store context containing user history.
  * @param config - The active configuration selection for the export.
  * @param resolved - The resolved scope mapping targeting the specific entity and municipal ID subsets.
  * @returns A structured export document containing versioning and filtered travel records.
 */
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

 /**
  * Triggers a browser-initiated JSON file download of the filtered travel history payload.
  * @param store - The active travel data store context containing user history.
  * @param config - The active configuration selection for the export.
  * @param resolved - The resolved scope mapping targeting the specific entity and municipal ID subsets.
 */
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
