import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

// ============================================================
// Client
// ============================================================

function buildClient() {
    const url = process.env.SUPABASE_URL?.trim();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const anonKey = process.env.SUPABASE_KEY?.trim();

    if (!url) throw new Error("Missing SUPABASE_URL in .env");

    if (serviceKey) {
        console.log("Using service role key — RLS bypassed for seeding.");
        return createClient(url, serviceKey);
    }

    if (anonKey) {
        console.warn("WARNING: Using anon key. RLS insert policies must allow public insert or seeding will fail.");
        return createClient(url, anonKey);
    }

    throw new Error("Missing credentials. Set SUPABASE_SERVICE_ROLE_KEY (preferred) or SUPABASE_KEY in .env");
}

const supabase = buildClient();

// ============================================================
// Helpers
// ============================================================

function readCSV(filename: string): any[] {
    const filePath = path.resolve(__dirname, filename);
    if (!fs.existsSync(filePath)) {
        throw new Error(`CSV not found: ${filePath}`);
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true, // trims all cell values — prevents " city" vs "city" issues
    });
}

// Safely parse an integer field — returns null if empty, undefined, or NaN
function toInt(value: any): number | null {
    if (value === null || value === undefined) return null;
    const str = String(value).trim();
    if (str === "") return null;
    const n = Number(str);
    return isNaN(n) ? null : n;
}

// Normalise GeoJSON:
//   - empty string / null → null
//   - Feature wrapper → unwrap to geometry
//   - Polygon → promote to MultiPolygon (PostGIS geometry column accepts both
//     but explicit promotion keeps types consistent)
function normalizeGeoJSON(value: any): object | null {
    if (value === null || value === undefined) return null;
    const str = typeof value === "string" ? value.trim() : "";
    if (str === "") return null;

    let parsed: any;
    try {
        parsed = typeof value === "string" ? JSON.parse(value) : value;
    } catch {
        console.warn("  Invalid GeoJSON string — skipping geometry for this row");
        return null;
    }

    // unwrap Feature wrapper
    if (parsed?.type === "Feature" && parsed.geometry) {
        parsed = parsed.geometry;
    }

    // promote Polygon → MultiPolygon
    if (parsed?.type === "Polygon") {
        return { type: "MultiPolygon", coordinates: [parsed.coordinates] };
    }

    return parsed;
}

// Normalise the type field to exactly 'city' or 'municipality'
// PSGC data uses: 'City', 'Municipality', 'HUC', 'ICC', 'Component City', etc.
function normalizeType(value: any): "city" | "municipality" {
    const raw = String(value ?? "")
        .toLowerCase()
        .trim();
    if (raw.includes("city") || raw === "huc" || raw === "icc") return "city";
    return "municipality";
}

// Upsert rows in chunks — logs progress and skips bad rows instead of aborting
async function upsertChunked(table: string, rows: any[], chunkSize: number, conflictCol: string = "id"): Promise<void> {
    let inserted = 0;
    let skipped = 0;

    const rowLabel = (row: any) => row.id ?? row.code ?? "(no id)";

    for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);

        const { error } = await supabase.from(table).upsert(chunk, { onConflict: conflictCol });

        if (!error) {
            inserted += chunk.length;
            process.stdout.write(`\r  ${table}: ${inserted} / ${rows.length} rows inserted`);
            continue;
        }

        const ids = chunk.map((r) => rowLabel(r)).join(", ");
        console.warn(`\n⚠ ${table} chunk failed (rows: ${ids})`);
        console.warn("  Supabase error:", error.message);
        console.warn("  Details:", error.details ?? "—");
        console.warn("  Hint:", error.hint ?? "—");

        for (const row of chunk) {
            const { error: rowError } = await supabase.from(table).upsert([row], { onConflict: conflictCol });
            if (rowError) {
                skipped += 1;
                console.warn(`  Skipping row ${rowLabel(row)} due to error: ${rowError.message}`);
            } else {
                inserted += 1;
            }
        }

        process.stdout.write(`\r  ${table}: ${inserted} / ${rows.length} rows inserted`);
    }

    if (skipped > 0) {
        console.warn(`\n⚠ Skipped ${skipped} invalid ${table} rows.`);
    }

    process.stdout.write("\n");
}

// ============================================================
// Seeders
// ============================================================

async function seedRegions(): Promise<Set<number>> {
    console.log("\nSeeding regions...");
    const rows = readCSV("regions.csv");

    const mapped = rows.map((row) => ({
        id: toInt(row.id),
        code: String(row.code),
        name: String(row.name),
    }));

    // regions are small — one shot, no chunking needed
    const { error } = await supabase.from("regions").upsert(mapped, { onConflict: "id" });

    if (error) {
        console.error("✗ regions error:", error.message);
        throw error;
    }

    console.log(`  ✓ ${mapped.length} regions inserted`);
    return new Set(mapped.filter((r) => r.id !== null).map((r) => r.id as number));
}

async function seedProvinces(): Promise<Set<number>> {
    console.log("\nSeeding provinces...");
    const rows = readCSV("provinces.csv");

    const mapped = rows.map((row) => ({
        id: toInt(row.id),
        code: String(row.code),
        name: String(row.name),
        region_id: toInt(row.region_id), // NOT NULL — will error if CSV is missing this
        geo_json: normalizeGeoJSON(row.geo_json),
    }));

    // validate before sending — catch missing region_id early
    const invalid = mapped.filter((r) => r.region_id === null);
    if (invalid.length) {
        throw new Error(`${invalid.length} province rows have no region_id. ` + `First offender: ${JSON.stringify(invalid[0])}`);
    }

    await upsertChunked("provinces", mapped, 100);
    console.log("  ✓ Provinces done");
    return new Set(mapped.filter((r) => r.id !== null).map((r) => r.id as number));
}

async function seedMunicities(validProvinceIds: Set<number>): Promise<void> {
    console.log("\nSeeding municities...");
    const rows = readCSV("municities.csv");

    const mapped = rows.map((row) => ({
        id: toInt(row.id),
        name: String(row.name),
        // province_id: null for HUCs / ICCs — column is nullable
        province_id: toInt(row.province_id),
        // region_id is nullable in v2 schema — null for regular province-linked rows
        region_id: toInt(row.region_id),
        type: normalizeType(row.type),
        geo_json: normalizeGeoJSON(row.geo_json),
    }));

    const valid: any[] = [];
    const skipped: Array<{ id: string | number; reason: string }> = [];

    for (const row of mapped) {
        const id = row.id ?? "(no id)";

        if (row.province_id !== null && !validProvinceIds.has(row.province_id)) {
            if (row.region_id !== null) {
                console.warn(`  ⚠ Municity ${id} references missing province ${row.province_id}; using region_id ${row.region_id} instead.`);
                row.province_id = null;
            } else {
                skipped.push({ id, reason: `missing province_id ${row.province_id} and no region_id` });
                continue;
            }
        }

        if (row.province_id === null && row.region_id === null) {
            skipped.push({ id, reason: "no province_id or region_id" });
            continue;
        }

        valid.push(row);
    }

    if (skipped.length) {
        console.warn(`\n⚠ Skipping ${skipped.length} invalid municity rows:`);
        skipped.slice(0, 10).forEach((row) => console.warn(`    - ${row.id}: ${row.reason}`));
        if (skipped.length > 10) {
            console.warn(`    ...and ${skipped.length - 10} more skipped rows.`);
        }
    }

    await upsertChunked("municities", valid, 50);
    console.log("  ✓ Municities done");
}

async function wipeTables(): Promise<void> {
    console.log("Wiping reference tables...");

    // use rpc to run raw SQL truncate with cascade
    // this handles foreign key dependencies automatically
    const { error } = await supabase.rpc("truncate_reference_tables");
    if (error) throw new Error(`Failed to wipe tables: ${error.message}`);

    console.log("  ✓ all reference tables wiped");
}

// ============================================================
// Main
// ============================================================

async function main(): Promise<void> {
    console.log("=== Turistala PSGC seeder ===");
    console.log(`Target: ${process.env.SUPABASE_URL}`);

    const start = Date.now();

    await wipeTables();
    await seedRegions();
    const validProvinceIds = await seedProvinces();
    await seedMunicities(validProvinceIds);

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`\n✓ All seeding complete in ${elapsed}s`);
}

main().catch((err) => {
    console.error("\nSeeding failed:", err.message);
    process.exit(1);
});
