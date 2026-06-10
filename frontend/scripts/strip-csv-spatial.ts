/**
 * One-time script: strip geometry + geojson columns from reference CSVs.
 * Run: pnpm exec tsx scripts/strip-csv-spatial.ts
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { parse } from "fast-csv";
import { stringify } from "csv-stringify/sync";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = __dirname;

function parseCsv(filePath: string): Promise<Record<string, string>[]> {
    return new Promise((resolve, reject) => {
        const rows: Record<string, string>[] = [];
        fs.createReadStream(filePath)
            .pipe(parse({ headers: true }))
            .on("data", (row) => rows.push(row))
            .on("end", () => resolve(rows))
            .on("error", reject);
    });
}

function writeCsv(fileName: string, headers: string[], rows: Record<string, string>[]) {
    const outPath = path.join(SCRIPTS_DIR, fileName);
    const body = stringify(rows, { header: true, columns: headers });
    fs.writeFileSync(outPath, body);
    console.log(`  ${fileName} — ${rows.length} rows, ${Math.round(fs.statSync(outPath).size / 1024)} KB`);
}

async function main() {
    console.log("Stripping spatial columns from CSVs…");

    const regions = await parseCsv(path.join(SCRIPTS_DIR, "regions.csv"));
    writeCsv(
        "regions.csv",
        ["id", "code", "name"],
        regions.map((r) => ({ id: r.id, code: r.code, name: r.name })),
    );

    const provinces = await parseCsv(path.join(SCRIPTS_DIR, "provinces.csv"));
    writeCsv(
        "provinces.csv",
        ["id", "code", "name", "region_id"],
        provinces.map((p) => ({ id: p.id, code: p.code, name: p.name, region_id: p.region_id })),
    );

    const municities = await parseCsv(path.join(SCRIPTS_DIR, "municities.csv"));
    writeCsv(
        "municities.csv",
        ["id", "name", "code", "province_id", "region_id", "type"],
        municities.map((m) => ({
            id: m.id,
            name: m.name,
            code: m.code,
            province_id: m.province_id,
            region_id: m.region_id ?? "",
            type: m.type,
        })),
    );

    console.log("Done.");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
