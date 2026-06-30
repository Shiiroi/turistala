// Compiles administrative boundary coordinate data and alphanumeric metadata into structured JSON payloads for frontend mapping.

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import {
    loadMunicitiesGroupedByProvince,
    loadMunicitiesMetaFromCsv,
    loadProvincesFromCsv,
    loadRegionsFromCsv,
} from "./geoLayersFromCsv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "../public/geo");

// Writes data to disk under the geo output directory, generating directories dynamically.
// Parameters:
// - relativePath: Target path within the output directory.
// - data: JavaScript object/array to write.
function writeJson(relativePath: string, data: unknown) {
    const outPath = path.join(OUT_DIR, relativePath);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(data));
    const kb = Math.round(fs.statSync(outPath).size / 1024);
    console.log(`  ${relativePath} — ${kb} KB`);
}

// Orchestrates reading CSV datasets, merging geometry bounds, and writing provincial-partitioned JSON files.
// Upstream dependencies:
// - regions.csv, provinces.csv, municities.csv (administrative hierarchy metadata).
// - Existing regional/provincial/municipal geometry JSON boundaries from public/geo.
async function main() {
    console.log("Exporting geo layers to public/geo…");
    writeJson("regions.json", await loadRegionsFromCsv());
    writeJson("provinces.json", await loadProvincesFromCsv());

    console.log("Rebuilding municities meta from CSV…");
    const meta = await loadMunicitiesMetaFromCsv();
    writeJson("municities/meta.json", meta);

    const { byProvince } = await loadMunicitiesGroupedByProvince();
    const provinceIds = Array.from(byProvince.keys()).sort((a, b) => a - b);
    writeJson("municities/manifest.json", { provinceIds });

    console.log(`Writing ${provinceIds.length} province municity files…`);
    for (const provinceId of provinceIds) {
        writeJson(`municities/province-${provinceId}.json`, byProvince.get(provinceId)!);
    }

    console.log(`Done → ${OUT_DIR}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
