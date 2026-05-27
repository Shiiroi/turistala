import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

function buildClient() {
    const url = process.env.SUPABASE_URL?.trim();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const anonKey = process.env.SUPABASE_KEY?.trim();

    if (!url) throw new Error("Missing SUPABASE_URL in .env");

    if (serviceKey) {
        console.log("Using service role key — RLS bypassed.");
        return createClient(url, serviceKey);
    }
    if (anonKey) {
        console.warn("WARNING: Using anon key — RLS may block updates.");
        return createClient(url, anonKey);
    }
    throw new Error("Missing credentials in .env");
}

const supabase = buildClient();

function readGeoJSON(filename: string): any {
    const filePath = path.resolve(__dirname, "geo", filename);
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }

    const altFilename = filename.includes("_0_01.json") ? filename.replace("_0_01.json", ".0.01.json") : filename.replace(".0.01.json", "_0_01.json");
    const altFilePath = path.resolve(__dirname, "geo", altFilename);

    if (altFilePath !== filePath && fs.existsSync(altFilePath)) {
        console.warn(`  Info: falling back to alternate GeoJSON filename ${altFilename}`);
        return JSON.parse(fs.readFileSync(altFilePath, "utf-8"));
    }

    throw new Error(`GeoJSON not found: ${filePath}`);
}

function psgcToCode(psgc: any): string {
    if (!psgc) return "";
    let str = String(psgc).trim();
    if (str.length === 10 && str.endsWith("0")) {
        return str.slice(0, 9);
    }
    return str;
}

// ============================================================
// Step 1: Clean old accidental IDs and ensure IDs 88 & 89 exist
// ============================================================
async function ensureMaguindanaoProvinces(): Promise<{ norteId: number; surId: number }> {
    console.log("\nCleaning up old tracking IDs and ensuring Maguindanao del Norte (88) & Sur (89) exist...");

    const barmmRegionId = 15;
    const norteCode = "190870000";
    const surCode = "190880000";

    // 1. Clean out the accidental 19087/19088 records from previous run if any exist
    // We clear references on the municities table first to prevent foreign key blocks
    await supabase.from("municities").update({ province_id: null }).in("province_id", [19087, 19088]);
    await supabase.from("provinces").delete().in("id", [19087, 19088]);

    // 2. Upsert Maguindanao del Norte as ID 88
    const { data: norteData, error: norteErr } = await supabase
        .from("provinces")
        .upsert(
            {
                id: 88,
                code: norteCode,
                name: "Maguindanao del Norte",
                region_id: barmmRegionId,
            },
            { onConflict: "code" },
        )
        .select();

    if (norteErr) console.error("Error creating Maguindanao del Norte (88):", norteErr.message);

    // 3. Upsert Maguindanao del Sur as ID 89
    const { data: surData, error: surErr } = await supabase
        .from("provinces")
        .upsert(
            {
                id: 89,
                code: surCode,
                name: "Maguindanao del Sur",
                region_id: barmmRegionId,
            },
            { onConflict: "code" },
        )
        .select();

    if (surErr) console.error("Error creating Maguindanao del Sur (89):", surErr.message);

    const norteId = norteData && norteData[0] ? norteData[0].id : 88;
    const surId = surData && surData[0] ? surData[0].id : 89;

    console.log(`  ✓ Provinces active: Norte (ID: ${norteId}), Sur (ID: ${surId})`);
    return { norteId, surId };
}

// ============================================================
// Step 2: Seed province boundaries
// ============================================================
async function seedProvinceGeo(): Promise<void> {
    console.log("\nPatching province geo_json boundaries...");

    const collection = readGeoJSON("provdists-region-1900000000.0.01.json");

    const rows = collection.features
        .filter((f: any) => f.properties?.adm2_psgc && f.geometry)
        .map((f: any) => ({
            code: psgcToCode(f.properties.adm2_psgc),
            geo_json: f.geometry,
        }));

    let patched = 0;

    for (const row of rows) {
        const { data, error } = await supabase.from("provinces").update({ geo_json: row.geo_json }).eq("code", row.code).select();

        if (error) {
            console.error(`\n✗ Error patching province boundary code=${row.code}:`, error.message);
        } else if (data && data.length > 0) {
            patched++;
        }
    }
    console.log(`  ✓ ${patched} provinces successfully patched with boundary shapes.`);
}

// ============================================================
// Step 3: Seed municipality boundaries & bind to IDs 88 & 89
// ============================================================
async function seedMunicityGeo(norteId: number, surId: number): Promise<void> {
    console.log("\nPatching municity geo_json and aligning to correct sequential province IDs...");

    const geoFiles = [
        { file: "municities-provdist-1908700000.0.01.json", parentProvinceId: norteId }, // 88
        { file: "municities-provdist-1908800000.0.01.json", parentProvinceId: surId }, // 89
    ];

    const rows: { name: string; geo_json: object; parentProvinceId: number }[] = [];

    for (const target of geoFiles) {
        const collection = readGeoJSON(target.file);
        for (const f of collection.features) {
            if (!f.properties?.adm3_en || !f.geometry) continue;

            rows.push({
                name: f.properties.adm3_en.trim(),
                geo_json: f.geometry,
                parentProvinceId: target.parentProvinceId,
            });
        }
    }

    console.log(`  Total: ${rows.length} municities to map into database...`);

    let patched = 0;
    let notFound = 0;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        const { data, error } = await supabase
            .from("municities")
            .update({
                geo_json: row.geo_json,
                province_id: row.parentProvinceId, // Assigns exactly 88 or 89
            })
            .ilike("name", row.name)
            .select();

        if (error) {
            console.error(`\n✗ SQL Error updating municity "${row.name}":`, error.message);
            notFound++;
        } else if (data && data.length > 0) {
            patched++;
        } else {
            notFound++;
        }

        process.stdout.write(`\r  municities processing: ${i + 1} / ${rows.length}`);
    }

    process.stdout.write("\n");
    console.log(`  ✓ ${patched} municities completely mapped and linked to province IDs ${norteId} and ${surId}.`);
    if (notFound > 0) {
        console.log(`  ⚠ ${notFound} rows skipped/unmatched.`);
    }
}

async function main(): Promise<void> {
    console.log("=== Turistala geo seeder v2 (ID 88/89 Clean Patched) ===");
    const start = Date.now();

    const { norteId, surId } = await ensureMaguindanaoProvinces();
    await seedProvinceGeo();
    await seedMunicityGeo(norteId, surId);

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`\n✓ Geo seeding and sequential ID realignment complete in ${elapsed}s!`);
}

main().catch((err) => {
    console.error("\nGeo seeding failed:", err.message);
    process.exit(1);
});
