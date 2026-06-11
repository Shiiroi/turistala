// Export geo layers from CSV + public/geo — same layout as Supabase geo bucket
// For cloud deploy: pnpm upload:geo
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
