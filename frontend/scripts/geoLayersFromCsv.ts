import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { parse } from "fast-csv";

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

function parseGeojson(raw: string | undefined) {
    if (!raw) return null;
    return typeof raw === "string" ? JSON.parse(raw) : raw;
}

export interface MunicityCsvRow {
    id: number;
    name: string;
    code: string;
    province_id: number;
    region_id: number | null;
    type: "city" | "municipality";
    geometry: ReturnType<typeof parseGeojson>;
}

export async function loadMunicitiesGroupedByProvince() {
    const rows = await parseCsv(path.join(SCRIPTS_DIR, "municities.csv"));
    const meta: Omit<MunicityCsvRow, "geometry">[] = [];
    const byProvince = new Map<number, MunicityCsvRow[]>();

    for (const row of rows) {
        const m: MunicityCsvRow = {
            id: Number(row.id),
            name: row.name,
            code: row.code,
            province_id: Number(row.province_id),
            region_id: row.region_id ? Number(row.region_id) : null,
            type: row.type as "city" | "municipality",
            geometry: parseGeojson(row.geojson),
        };
        meta.push({
            id: m.id,
            name: m.name,
            code: m.code,
            province_id: m.province_id,
            region_id: m.region_id,
            type: m.type,
        });
        const list = byProvince.get(m.province_id) ?? [];
        list.push(m);
        byProvince.set(m.province_id, list);
    }

    return { meta, byProvince };
}

export async function loadRegionsFromCsv() {
    const rows = await parseCsv(path.join(SCRIPTS_DIR, "regions.csv"));
    return rows.map((r) => ({
        id: Number(r.id),
        code: r.code,
        name: r.name,
        geometry: parseGeojson(r.geojson),
    }));
}

export async function loadProvincesFromCsv() {
    const rows = await parseCsv(path.join(SCRIPTS_DIR, "provinces.csv"));
    return rows.map((p) => ({
        id: Number(p.id),
        code: p.code,
        name: p.name,
        region_id: Number(p.region_id),
        geometry: parseGeojson(p.geojson),
    }));
}
