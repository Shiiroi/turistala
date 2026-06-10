/**
 * Export regions/provinces/municities GeoJSON from CSV to frontend/public/geo.
 * Same layout as the Supabase geo bucket. For cloud: pnpm upload:geo
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import {
    loadMunicitiesGroupedByProvince,
    loadProvincesFromCsv,
    loadRegionsFromCsv,
} from "./geoLayersFromCsv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "../public/geo");

function writeJson(relativePath: string, data: unknown) {
    const outPath = path.join(OUT_DIR, relativePath);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(data));
    const kb = Math.round(fs.statSync(outPath).size / 1024);
    console.log(`  ${relativePath} — ${kb} KB`);
}

async function main() {
    console.log("Exporting geo layers to public/geo…");
    writeJson("regions.json", await loadRegionsFromCsv());
    writeJson("provinces.json", await loadProvincesFromCsv());

    console.log("Loading municities from CSV (this may take a minute)…");
    const { meta, byProvince } = await loadMunicitiesGroupedByProvince();
    writeJson("municities/meta.json", meta);

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
