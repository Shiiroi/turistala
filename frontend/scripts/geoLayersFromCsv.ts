// geoLayersFromCsv.ts — CSV and GeoJSON loader for Philippine administrative layers.

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { parse } from "fast-csv";
import type { Geometry } from "geojson";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPTS_DIR = __dirname;
const GEO_DIR = path.join(__dirname, "../public/geo");

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

function readGeoJson<T>(relativePath: string): T {
    const filePath = path.join(GEO_DIR, relativePath);
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export interface MunicityMeta {
    id: number;
    name: string;
    code: string;
    province_id: number;
    region_id: number | null;
    type: "city" | "municipality";
}

export interface MunicityGeoRow extends MunicityMeta {
    geometry: Geometry | null;
}

export interface RegionGeoRow {
    id: number;
    code: string;
    name: string;
    geometry: Geometry | null;
}

export interface ProvinceGeoRow {
    id: number;
    code: string;
    name: string;
    region_id: number;
    geometry: Geometry | null;
}

export async function loadMunicitiesMetaFromCsv(): Promise<MunicityMeta[]> {
    const rows = await parseCsv(path.join(SCRIPTS_DIR, "municities.csv"));
    return rows.map((row) => ({
        id: Number(row.id),
        name: row.name,
        code: row.code,
        province_id: Number(row.province_id),
        region_id: row.region_id ? Number(row.region_id) : null,
        type: row.type as "city" | "municipality",
    }));
}

export async function loadRegionsMetaFromCsv() {
    const rows = await parseCsv(path.join(SCRIPTS_DIR, "regions.csv"));
    return rows.map((r) => ({
        id: Number(r.id),
        code: r.code,
        name: r.name,
    }));
}

export async function loadProvincesMetaFromCsv() {
    const rows = await parseCsv(path.join(SCRIPTS_DIR, "provinces.csv"));
    return rows.map((p) => ({
        id: Number(p.id),
        code: p.code,
        name: p.name,
        region_id: Number(p.region_id),
    }));
}

function geometryById<T extends { id: number; geometry?: Geometry | null }>(rows: T[]): Map<number, Geometry | null> {
    return new Map(rows.map((r) => [r.id, r.geometry ?? null]));
}

// CSV metadata + geometry from public/geo JSON
export async function loadRegionsFromCsv(): Promise<RegionGeoRow[]> {
    const meta = await loadRegionsMetaFromCsv();
    const geo = readGeoJson<RegionGeoRow[]>("regions.json");
    const geomMap = geometryById(geo);
    return meta.map((r) => ({ ...r, geometry: geomMap.get(r.id) ?? null }));
}

// CSV metadata + geometry from public/geo JSON
export async function loadProvincesFromCsv(): Promise<ProvinceGeoRow[]> {
    const meta = await loadProvincesMetaFromCsv();
    const geo = readGeoJson<ProvinceGeoRow[]>("provinces.json");
    const geomMap = geometryById(geo);
    return meta.map((p) => ({ ...p, geometry: geomMap.get(p.id) ?? null }));
}

// CSV meta; per-province geometry from public/geo
export async function loadMunicitiesGroupedByProvince() {
    const meta = await loadMunicitiesMetaFromCsv();
    const manifest = readGeoJson<{ provinceIds: number[] }>("municities/manifest.json");

    const geomById = new Map<number, Geometry | null>();
    for (const provinceId of manifest.provinceIds) {
        const rows = readGeoJson<MunicityGeoRow[]>(`municities/province-${provinceId}.json`);
        for (const row of rows) {
            geomById.set(row.id, row.geometry ?? null);
        }
    }

    const byProvince = new Map<number, MunicityGeoRow[]>();
    for (const m of meta) {
        const full: MunicityGeoRow = { ...m, geometry: geomById.get(m.id) ?? null };
        const list = byProvince.get(m.province_id) ?? [];
        list.push(full);
        byProvince.set(m.province_id, list);
    }

    return { meta, byProvince };
}
