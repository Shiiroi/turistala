// backend/scripts/seed_provinces.js
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";
import pg from "pg";

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Loads .env from the backend root
dotenv.config({ path: path.join(__dirname, "../.env") });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const provincesFolder = path.join(__dirname, "provinces");

async function seedProvincesGeo() {
    const client = await pool.connect();
    console.log(`\n🚀 Seeding Province GeoJSONs...`);

    try {
        const files = fs
            .readdirSync(provincesFolder)
            .filter((f) => f.endsWith(".json"));

        for (const file of files) {
            const raw = fs.readFileSync(
                path.join(provincesFolder, file),
                "utf-8",
            );
            const json = JSON.parse(raw);
            const features = json.features || [];

            // Iterate over ALL provinces in the region file
            for (const feature of features) {
                const fp = feature.properties;
                if (!fp) continue;

                let provinceName = fp.adm2_en || fp.ADM2_EN;

                // CRITICAL FIX: Skip if there's no province name defined
                if (!provinceName) continue;

                let regionCodeStr = (
                    fp.adm1_psgc ||
                    fp.ADM1_PCODE ||
                    ""
                ).toString();

                const isNCR = regionCodeStr.startsWith("13");

                if (isNCR) {
                    provinceName = "Metro Manila";
                }

                // Add exceptions for older database names
                if (provinceName.includes("Western Samar")) {
                    provinceName = "Samar";
                }
                if (provinceName.includes("Davao de Oro")) {
                    provinceName = "Compostela Valley"; // Older name for Davao de Oro
                }
                if (provinceName.includes("Maguindanao")) {
                    provinceName = "Maguindanao"; // Merge del Sur and del Norte if your DB only has "Maguindanao"
                }

                const geometry = feature.geometry;

                const res = await client.query(
                    `UPDATE provinces SET geo_json = $1 WHERE name ILIKE $2 RETURNING name, code`,
                    [JSON.stringify(geometry), provinceName],
                );

                if (res.rows.length > 0) {
                    console.log(
                        `✅ Updated GeoJSON for: ${res.rows[0].name} (Code: ${res.rows[0].code})`,
                    );
                } else {
                    console.log(
                        `⚠️ Could not find province in DB with name: ${provinceName}`,
                    );
                }
            }
        }
    } catch (error) {
        console.error("❌ ERROR:", error);
    } finally {
        client.release();
        pool.end();
    }
}

seedProvincesGeo();
