import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fs from "fs";
import pg from "pg";

const { Pool } = pg;

// --- CONFIGURATION ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ Error: DATABASE_URL is missing in .env");
  process.exit(1);
}

const pool = new Pool({ connectionString });

const jsonFolder = path.join(__dirname, "municities");
const specialCitiesFolder = path.join(__dirname, "data", "special_cities");
const overridesFile = path.join(__dirname, "data", "overrides.json");

const args = process.argv.slice(2);
const SHOULD_RESET = args.includes("--reset");

// Clean PSGC codes by removing 'PH' prefix
const cleanCode = (val) => {
  let s = (val || "").toString();
  return s.startsWith("PH") ? s.substring(2) : s;
};

async function seed() {
  const client = await pool.connect();
  console.log(`\n🚀 Starting Database Seed...`);

  try {
    // Drop existing tables if reset flag is present
    if (SHOULD_RESET) {
      console.log("🧨 --reset detected: Dropping all tables...");
      await client.query("DROP TABLE IF EXISTS journal_photos CASCADE");
      await client.query("DROP TABLE IF EXISTS journal_entries CASCADE");
      await client.query("DROP TABLE IF EXISTS user_place_goals CASCADE");
      await client.query("DROP TABLE IF EXISTS users CASCADE");
      await client.query("DROP TABLE IF EXISTS place_tags CASCADE");
      await client.query("DROP TABLE IF EXISTS places CASCADE");
      await client.query("DROP TABLE IF EXISTS municities CASCADE");
      await client.query("DROP TABLE IF EXISTS provinces CASCADE");
      await client.query("DROP TABLE IF EXISTS regions CASCADE");
    }

    // Initialize database schema
    console.log("🏗️  Ensuring tables exist...");

    // 1. Geography Domain
    await client.query(
      `CREATE TABLE IF NOT EXISTS regions (id SERIAL PRIMARY KEY, code VARCHAR(50), name VARCHAR(255))`,
    );
    await client.query(
      `CREATE TABLE IF NOT EXISTS provinces (id SERIAL PRIMARY KEY, code VARCHAR(50), name VARCHAR(255), region_id INTEGER REFERENCES regions(id))`,
    );
    await client.query(
      `CREATE TABLE IF NOT EXISTS municities (id SERIAL PRIMARY KEY, name VARCHAR(255), geo_json TEXT, province_id INTEGER REFERENCES provinces(id), region_id INTEGER REFERENCES regions(id), type VARCHAR(50))`,
    );

    // 2. Attraction Domain
    await client.query(
      `CREATE TABLE IF NOT EXISTS places (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), municity_id INTEGER REFERENCES municities(id), name VARCHAR(255), category VARCHAR(100), lat FLOAT, lng FLOAT)`,
    );
    await client.query(
      `CREATE TABLE IF NOT EXISTS place_tags (id SERIAL PRIMARY KEY, place_id UUID REFERENCES places(id), tag_name VARCHAR(100))`,
    );

    // 3. User & Interaction Domain
    await client.query(
      `CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), username VARCHAR(255), avatar_url TEXT)`,
    );
    await client.query(
      `CREATE TABLE IF NOT EXISTS user_place_goals (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id), place_id UUID REFERENCES places(id), status VARCHAR(50), added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
    );
    await client.query(
      `CREATE TABLE IF NOT EXISTS journal_entries (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id), place_id UUID REFERENCES places(id), title VARCHAR(255), content TEXT, visit_date DATE)`,
    );
    await client.query(
      `CREATE TABLE IF NOT EXISTS journal_photos (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), entry_id UUID REFERENCES journal_entries(id), storage_url TEXT)`,
    );

    // Parse special city classifications (HUC/ICC) into memory ONLY
    console.log("📋 Loading Special City Classifications into memory...");
    const specialCityMap = new Map();
    if (fs.existsSync(specialCitiesFolder)) {
      const files = fs
        .readdirSync(specialCitiesFolder)
        .filter((f) => f.endsWith(".json"));
      for (const file of files) {
        const raw = JSON.parse(
          fs.readFileSync(path.join(specialCitiesFolder, file), "utf-8"),
        );
        let list = Array.isArray(raw) ? raw : raw.names || [];
        let type = file.toLowerCase().includes("icc")
          ? "ICC"
          : !Array.isArray(raw) && raw.classification
            ? raw.classification
            : "HUC";
        for (const cityName of list) {
          specialCityMap.set(cityName, type);
        }
      }
    }

    // Load manual data overrides
    let overrides = {};
    if (fs.existsSync(overridesFile)) {
      try {
        overrides = JSON.parse(fs.readFileSync(overridesFile, "utf-8"));
      } catch (e) {}
    }

    // Process GeoJSON files to seed regions, provinces, and municipalities
    console.log("🌍 Seeding Regions, Provinces, and Municipalities...");
    const files = fs.readdirSync(jsonFolder).filter((f) => f.endsWith(".json"));

    for (const file of files) {
      const json = JSON.parse(
        fs.readFileSync(path.join(jsonFolder, file), "utf-8"),
      );
      const features = json.features || [];
      if (features.length === 0) continue;

      const firstProp = features[0].properties;
      let regionCode = cleanCode(firstProp.adm1_psgc || firstProp.ADM1_PCODE);
      let provinceCode = cleanCode(firstProp.adm2_psgc || firstProp.ADM2_PCODE);
      let regionName = firstProp.ADM1_EN || `Region ${regionCode}`;
      let provinceName = firstProp.ADM2_EN || `Province ${provinceCode}`;

      // Handle specific region naming and coding logic (BARMM, NCR, NIR)
      if (regionName.includes("Autonomous Region in Muslim Mindanao"))
        regionName = "BARMM";
      const isNCR = regionCode.startsWith("13");
      const isNIR = ["604500000", "704600000", "706100000"].includes(
        provinceCode,
      );
      if (isNCR) {
        regionName = "National Capital Region (NCR)";
        provinceName = "Metro Manila";
        regionCode = "1300000000";
      }
      if (isNIR) {
        regionName = "Negros Island Region (NIR)";
        regionCode = "1800000000";
      }

      const baseKey = path.basename(file, ".json");
      if (overrides[baseKey]) {
        if (overrides[baseKey].regionName)
          regionName = overrides[baseKey].regionName;
        if (overrides[baseKey].provinceName)
          provinceName = overrides[baseKey].provinceName;
      }

      console.log(`\n📂 Processing: ${provinceName} (${regionName})`);

      // Upsert region record
      let regionId;
      const regRes = await client.query(
        "SELECT id FROM regions WHERE code = $1",
        [regionCode],
      );
      if (regRes.rows.length > 0) {
        regionId = regRes.rows[0].id;
        await client.query("UPDATE regions SET name = $1 WHERE id = $2", [
          regionName,
          regionId,
        ]);
      } else {
        const insertReg = await client.query(
          "INSERT INTO regions (name, code) VALUES ($1, $2) RETURNING id",
          [regionName, regionCode],
        );
        regionId = insertReg.rows[0].id;
      }

      // Upsert province record
      let provinceId;
      const provRes = await client.query(
        "SELECT id FROM provinces WHERE code = $1",
        [provinceCode],
      );
      if (provRes.rows.length > 0) {
        provinceId = provRes.rows[0].id;
        await client.query(
          "UPDATE provinces SET name = $1, region_id = $2 WHERE id = $3",
          [provinceName, regionId, provinceId],
        );
      } else {
        const insertProv = await client.query(
          "INSERT INTO provinces (name, code, region_id) VALUES ($1, $2, $3) RETURNING id",
          [provinceName, provinceCode, regionId],
        );
        provinceId = insertProv.rows[0].id;
      }

      process.stdout.write("      Progress: ");
      for (const feature of features) {
        const props = feature.properties;
        const name = props.adm3_en || props.ADM3_EN;
        const geometry = feature.geometry;
        if (!name || !geometry) continue;

        let type = "Municipality";
        if (isNCR) type = name === "Pateros" ? "Municipality" : "HUC";
        else if (specialCityMap.has(name)) type = specialCityMap.get(name);
        else if (
          name.toLowerCase().includes("city") ||
          props.geo_level === "City"
        )
          type = "City";

        // Insert municity with both province_id and region_id
        await client.query(
          `INSERT INTO municities (name, geo_json, province_id, region_id, type) VALUES ($1, $2, $3, $4, $5)`,
          [name, JSON.stringify(geometry), provinceId, regionId, type],
        );
        process.stdout.write(".");
      }
      process.stdout.write("\n");
    }

    // Log final results and close connection
    const count = await client.query("SELECT COUNT(*) as c FROM municities");
    console.log(
      `\n✅ Database seeded successfully. 📊 Total locations: ${count.rows[0].c}`,
    );
  } catch (error) {
    console.error("\n❌ ERROR:", error);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
