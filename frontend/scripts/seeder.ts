// Seeds Supabase PostgreSQL tables with administrative metadata (regions, provinces, municities) parsed from local CSV files.

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { parse } from "fast-csv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

type CsvRow = Record<string, string>;

// Streams and parses a local CSV file into a Promise of key-value rows.
function parseCsv(filePath: string): Promise<CsvRow[]> {
    return new Promise((resolve, reject) => {
        const rows: CsvRow[] = [];
        fs.createReadStream(filePath)
            .pipe(parse({ headers: true }))
            .on("data", (row: CsvRow) => rows.push(row))
            .on("error", (err) => reject(err))
            .on("end", () => resolve(rows));
    });
}

function mapRegion(row: CsvRow) {
    return {
        id: Number(row.id),
        code: row.code,
        name: row.name,
    };
}

function mapProvince(row: CsvRow) {
    return {
        id: Number(row.id),
        code: row.code,
        name: row.name,
        region_id: Number(row.region_id),
    };
}

function mapMunicity(row: CsvRow) {
    return {
        id: Number(row.id),
        name: row.name,
        code: row.code,
        type: row.type,
        province_id: row.province_id ? Number(row.province_id) : null,
        region_id: row.region_id ? Number(row.region_id) : null,
    };
}

type MunicityRecord = ReturnType<typeof mapMunicity>;

// ── Diagnostic helpers ────────────────────────────────────────────────────

// Audits municipal data records before seeding, checking for constraint violations like duplicate IDs/codes or invalid type designations.
// Parameters:
// - records: The mapped municipality array to check.
function auditMunicities(records: MunicityRecord[]) {
    // 1. Show all distinct `type` values in the CSV
    const typeValues = [...new Set(records.map((r) => r.type))];
    console.log(`\n🔍 Distinct 'type' values found in CSV:`, typeValues);

    // 2. Rows with unexpected type (not 'city' or 'municipality')
    const badType = records.filter((r) => r.type !== "city" && r.type !== "municipality");
    if (badType.length) {
        console.warn(`\n⚠️  ${badType.length} row(s) with unexpected 'type' value:`);
        badType.forEach((r) => console.warn(`   id=${r.id}  name="${r.name}"  type="${r.type}"`));
    } else {
        console.log(`   ✅ All 'type' values are 'city' or 'municipality'.`);
        console.log(
            `   (If the constraint still fires, your DB check may use different allowed values — check it with: SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'municities_type_check';)`,
        );
    }

    // 3. Duplicate id check
    const idCounts = records.reduce<Record<number, number>>((acc, r) => {
        acc[r.id] = (acc[r.id] || 0) + 1;
        return acc;
    }, {});
    const dupIds = Object.entries(idCounts).filter(([, count]) => count > 1);
    if (dupIds.length) {
        console.warn(`\n⚠️  Duplicate id(s) found:`);
        dupIds.forEach(([id, count]) => {
            const dupes = records.filter((r) => r.id === Number(id));
            console.warn(`   id=${id} appears ${count} times:`);
            dupes.forEach((r) => console.warn(`     name="${r.name}"  code="${r.code}"  type="${r.type}"`));
        });
    } else {
        console.log(`   ✅ No duplicate ids.`);
    }

    // 4. Duplicate code check
    const codeCounts = records.reduce<Record<string, number>>((acc, r) => {
        if (r.code) acc[r.code] = (acc[r.code] || 0) + 1;
        return acc;
    }, {});
    const dupCodes = Object.entries(codeCounts).filter(([, count]) => count > 1);
    if (dupCodes.length) {
        console.warn(`\n⚠️  Duplicate code(s) found:`);
        dupCodes.forEach(([code, count]) => {
            const dupes = records.filter((r) => r.code === code);
            console.warn(`   code=${code} appears ${count} times:`);
            dupes.forEach((r) => console.warn(`     id=${r.id}  name="${r.name}"  type="${r.type}"`));
        });
    } else {
        console.log(`   ✅ No duplicate codes.`);
    }

    // 5. Preview rows around the failing batch (index 1625+)
    console.log(`\n📋 Rows 1620–1642 (the failing batch range):`);
    records
        .slice(1620)
        .forEach((r, i) =>
            console.log(
                `   [${1620 + i}] id=${r.id}  name="${r.name}"  code="${r.code}"  type="${r.type}"  province_id=${r.province_id}  region_id=${r.region_id}`,
            ),
        );
}

// ── Seeder ────────────────────────────────────────────────────────────────

// Seeds a target table by reading a local CSV, auditing if necessary, and bulk-inserting records in batch chunks.
// Parameters:
// - tableName: Supabase table name.
// - fileName: CSV file name in scripts directory.
// - mapper: Transforms CSV row records into table schemas.
// - batchSize: Chunk size for SQL insert transactions.
// - pauseMs: Optional throttle delay to prevent database congestion.
// Upstream dependencies: Active Supabase Client authentication (service role access).
async function seedTable<T>(
    tableName: string,
    fileName: string,
    mapper: (row: CsvRow) => T,
    batchSize = 100,
    pauseMs = 0,
) {
    const csvPath = path.resolve(__dirname, fileName);
    if (!fs.existsSync(csvPath)) {
        console.warn(`⚠️  Skipped ${tableName}: ${fileName} not found.`);
        return;
    }

    console.log(`\n読取 Reading data for ${tableName}...`);
    const raw = await parseCsv(csvPath);
    const records = raw.map(mapper);

    // Run diagnostics before seeding municities
    if (tableName === "municities") {
        auditMunicities(records as MunicityRecord[]);
        console.log(`\n⏸  Audit complete. Proceeding with insert...\n`);
    }

    console.log(`🚀 Seeding ${records.length} records into ${tableName} in batches of ${batchSize}...`);

    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error } = await supabase.from(tableName).insert(batch as never);
        if (error) {
            console.error(`\n❌ Error inserting batch at index ${i} (rows ${i + 1}–${Math.min(i + batchSize, records.length)}):`);
            console.error(`   Message: ${error.message}`);
            console.error(`   Details: ${error.details ?? "none"}`);
            console.error(`   Hint:    ${error.hint ?? "none"}`);
            console.error(`\n📋 Offending batch rows:`);
            batch.forEach((r, bi) => {
                const row = r as MunicityRecord;
                console.error(
                    `   [${i + bi}] id=${row.id}  name="${row.name}"  code="${row.code}"  type="${row.type}"  province_id=${row.province_id}  region_id=${row.region_id}`,
                );
            });
            throw error;
        }
        console.log(`  ✅ Inserted rows ${i + 1}–${Math.min(i + batchSize, records.length)} of ${records.length}`);
        if (pauseMs > 0) await new Promise((r) => setTimeout(r, pauseMs));
    }

    console.log(`  ✅ Done seeding ${tableName}!`);
}

async function main() {
    try {
        await seedTable("regions", "regions.csv", mapRegion, 50);
        await seedTable("provinces", "provinces.csv", mapProvince, 50);
        await seedTable("municities", "municities.csv", mapMunicity, 25, 300);
        console.log("\n🏁 Remote cloud data pipeline successfully initialized!");
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("❌ Seeding execution halted:", message);
    }
}

main();
