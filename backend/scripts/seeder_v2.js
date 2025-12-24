import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import pg from 'pg';

const { Pool } = pg;

// --- SETUP ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ CRITICAL: No DATABASE_URL found.");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const jsonFolder = path.join(__dirname, 'municities');
const specialCitiesFolder = path.join(__dirname, 'data', 'special_cities');

// --- ARGS ---
const args = process.argv.slice(2);
const SHOULD_RESET = args.includes('--reset');
const DROP_LEGACY_CODES = args.includes('--drop-legacy-codes');

// Optional overrides file for manual corrections (e.g. Isabela City -> Basilan/BARMM)
const overridesFile = path.join(__dirname, 'data', 'overrides.json');
let overrides = {};
if (fs.existsSync(overridesFile)) {
  try { overrides = JSON.parse(fs.readFileSync(overridesFile, 'utf-8')); } catch (e) { logger.warn('Failed to parse overrides.json'); }
}

// --- LOGGING UTILS ---
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
  dim: "\x1b[2m",
};

const logger = {
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}=== ${msg} ===${colors.reset}`),
  region: (msg) => console.log(`${colors.bright}${colors.blue}📍 [REGION] ${msg}${colors.reset}`),
  province: (msg) => console.log(`   ${colors.yellow}↳ [PROVINCE] ${msg}${colors.reset}`),
  item: (count, type) => console.log(`      ${colors.dim}• Loaded ${count} ${type}s${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.error(`${colors.red}❌ ${msg}${colors.reset}`),
  warn: (msg) => console.warn(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
};

// --- MAIN FUNCTION ---
async function seed() {
  const client = await pool.connect();
  
  console.log(`${colors.bright}🚀 Turistala DB Architect v2.0${colors.reset}`);
  if (SHOULD_RESET) console.log(`${colors.red}🧨 --reset detected: Wiping database...${colors.reset}`);

  try {
    await client.query('BEGIN');

    // 1. CLEANUP (If Reset)
    if (SHOULD_RESET) {
      logger.header("Cleaning Database");
      await client.query(`DROP TABLE IF EXISTS municities CASCADE;`);
      await client.query(`DROP TABLE IF EXISTS provinces CASCADE;`);
      await client.query(`DROP TABLE IF EXISTS regions CASCADE;`);
      await client.query(`DROP TABLE IF EXISTS city_classifications CASCADE;`);
    }

    // 2. SCHEMA
    logger.header("Building Schema");
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS regions (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE,
        name VARCHAR(255)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS provinces (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE,
        name VARCHAR(255),
        region_id INTEGER REFERENCES regions(id) ON DELETE CASCADE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS municities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        geo_json TEXT, 
        province_id INTEGER REFERENCES provinces(id) ON DELETE CASCADE,
        type VARCHAR(50) DEFAULT 'Municipality' 
      );
    `);

    // Remove legacy 'code' column if present — we no longer store PSGC codes in the table
    await client.query(`
      ALTER TABLE municities
      DROP COLUMN IF EXISTS code;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS city_classifications (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        classification VARCHAR(50) NOT NULL
      );
    `);

    // 3. SEED SPECIAL CITIES (HUC/ICC)
    logger.header("Seeding Special Classifications");
    const classificationMap = { HUC: new Set(), ICC: new Set() };

    if (fs.existsSync(specialCitiesFolder)) {
      const files = fs.readdirSync(specialCitiesFolder).filter(f => f.endsWith('.json'));
      
      for (const file of files) {
        const raw = JSON.parse(fs.readFileSync(path.join(specialCitiesFolder, file), 'utf-8'));
        let list = [];
        let type = 'HUC'; // Default guess

        // Handle Array vs Object format
        if (Array.isArray(raw)) {
          list = raw;
          if (file.toLowerCase().includes('icc')) type = 'ICC';
        } else if (raw.names && Array.isArray(raw.names)) {
          list = raw.names;
          if (raw.classification) type = raw.classification;
        }

        // Insert into DB and Map
        let addedCount = 0;
        for (const cityName of list) {
          // Update Map for quick lookup later
          if (type === 'HUC') classificationMap.HUC.add(cityName);
          if (type === 'ICC') classificationMap.ICC.add(cityName);

          // Insert into Database (The fix you requested)
          await client.query(`
            INSERT INTO city_classifications (name, classification)
            VALUES ($1, $2)
            ON CONFLICT (name) DO UPDATE SET classification = EXCLUDED.classification
          `, [cityName, type]);
          addedCount++;
        }
        console.log(`   📄 Parsed ${file}: Added ${addedCount} cities as ${type}`);
      }
    } else {
      logger.warn(`Directory not found: ${specialCitiesFolder}`);
    }

    // 4. SEED LOCATIONS (The Heavy Lifting)
    logger.header("Seeding Locations");

    const files = fs.readdirSync(jsonFolder).filter(f => f.endsWith('.json'));
    
    // Helper for codes
    const cleanCode = (val) => {
        let s = (val || '').toString();
        return s.startsWith('PH') ? s.substring(2) : s;
    };

    // Keep track of what we've printed to avoid spamming the same Region name
    let lastRegionName = "";

    for (const file of files) {
      const filePath = path.join(jsonFolder, file);
      const json = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const features = json.features || [];

      if (features.length === 0) continue;

      const firstProp = features[0].properties;
      let regionCode = cleanCode(firstProp.adm1_psgc || firstProp.ADM1_PCODE);
      let provinceCode = cleanCode(firstProp.adm2_psgc || firstProp.ADM2_PCODE);
      
      // NCR & NIR Logic
      const isNCR = regionCode.startsWith('13');
      const isNIR = ['604500000', '704600000', '706100000'].includes(provinceCode);

      if (isNCR) regionCode = '1300000000';
      if (isNIR) regionCode = '1800000000';

      let regionName = firstProp.ADM1_EN || `Region ${regionCode}`;
      let provinceName = firstProp.ADM2_EN || `Province ${provinceCode}`;

      // Overrides
      if (isNCR) {
        regionName = "National Capital Region (NCR)";
        provinceName = "Metro Manila"; 
        provinceCode = "13_METRO_MANILA";
      }
      if (isNIR) {
        regionName = "Negros Island Region (NIR)";
      }

      // Apply any manual overrides for this file's area (or global city overrides later)
      // (Overrides can set regionName, regionCode, provinceName, provinceCode)
      const baseKey = path.basename(file, '.json');
      if (overrides[baseKey]) {
        const o = overrides[baseKey];
        regionName = o.regionName || regionName;
        regionCode = o.regionCode || regionCode;
        provinceName = o.provinceName || provinceName;
        provinceCode = o.provinceCode || provinceCode;
      }

      // --- LOGGING ---
      if (regionName !== lastRegionName) {
        logger.region(regionName);
        lastRegionName = regionName;
      }
      logger.province(provinceName);

      // --- DB OPS ---
      
      // 1. Region (simpler: select then insert if missing)
      let regionId;
      const existingRegion = await client.query('SELECT id FROM regions WHERE code = $1', [regionCode]);
      if (existingRegion.rows.length > 0) {
        regionId = existingRegion.rows[0].id;
        // update name if different
        await client.query('UPDATE regions SET name = $1 WHERE id = $2', [regionName, regionId]);
      } else {
        const regRes = await client.query('INSERT INTO regions (name, code) VALUES ($1, $2) RETURNING id', [regionName, regionCode]);
        regionId = regRes.rows[0].id;
      }

      // 2. Province (select then insert if missing)
      let provinceId;
      const existingProv = await client.query('SELECT id FROM provinces WHERE code = $1', [provinceCode]);
      if (existingProv.rows.length > 0) {
        provinceId = existingProv.rows[0].id;
        await client.query('UPDATE provinces SET name = $1, region_id = $2 WHERE id = $3', [provinceName, regionId, provinceId]);
      } else {
        const provRes = await client.query('INSERT INTO provinces (name, code, region_id) VALUES ($1, $2, $3) RETURNING id', [provinceName, provinceCode, regionId]);
        provinceId = provRes.rows[0].id;
      }

      // 3. Municities
      let cityCount = 0;
      const missingProvinceCities = [];
      for (const feature of features) {
        const props = feature.properties;
        const name = props.adm3_en || props.ADM3_EN;
        const code = cleanCode(props.adm3_psgc || props.ADM3_PCODE);
        const geometry = feature.geometry;

        if (!name || !geometry) continue;

        // Apply per-city override if present
        if (overrides[name]) {
          const o = overrides[name];
          if (o.provinceName) provinceName = o.provinceName;
          if (o.provinceCode) provinceCode = o.provinceCode;
          if (o.regionName) regionName = o.regionName;
          if (o.regionCode) regionCode = o.regionCode;
        }

        // Determine Type
        let type = 'Municipality';
        if (isNCR) {
           type = (name === 'Pateros') ? 'Municipality' : 'HUC';
        } else if (classificationMap.HUC.has(name)) {
           type = 'HUC';
        } else if (classificationMap.ICC.has(name)) {
           type = 'ICC';
        } else if (name.toLowerCase().includes('city') || props.geo_level === 'City') {
           type = 'City';
        }

        const geoString = JSON.stringify(geometry);

        await client.query(`
          INSERT INTO municities (name, geo_json, province_id, type) 
          VALUES ($1, $2, $3, $4)
        `, [name, geoString, provinceId, type]);
        
        cityCount++;
        // Track potential data issues
        if (!provinceName || provinceName.toLowerCase().includes('province ')) {
          missingProvinceCities.push(name);
        }
      }
      logger.item(cityCount, "muni/citie");
      if (missingProvinceCities.length) {
        logger.warn(`Cities with missing/unknown province in ${file}: ${missingProvinceCities.slice(0,5).join(', ')}${missingProvinceCities.length>5?', ...':''}`);
      }
    }

    await client.query('COMMIT');
    logger.header("Summary");
    logger.success("Database seeded successfully!");
    
    // Quick count check
    const counts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM regions) as r,
        (SELECT COUNT(*) FROM provinces) as p,
        (SELECT COUNT(*) FROM municities) as m,
        (SELECT COUNT(*) FROM city_classifications) as c
    `);
    const { r, p, m, c } = counts.rows[0];
    
    console.log(`\n📊 Final Stats:`);
    console.log(`   Regions:         ${colors.bright}${r}${colors.reset}`);
    console.log(`   Provinces:       ${colors.bright}${p}${colors.reset}`);
    console.log(`   Muni/Cities:     ${colors.bright}${m}${colors.reset}`);
    console.log(`   Special Cities:  ${colors.bright}${c}${colors.reset} (in lookup table)`);
    // Ensure sequences are set to the current max id so future inserts are contiguous
    try {
      await client.query(`SELECT setval(pg_get_serial_sequence('regions','id'), COALESCE((SELECT MAX(id) FROM regions),0))`);
      await client.query(`SELECT setval(pg_get_serial_sequence('provinces','id'), COALESCE((SELECT MAX(id) FROM provinces),0))`);
      await client.query(`SELECT setval(pg_get_serial_sequence('municities','id'), COALESCE((SELECT MAX(id) FROM municities),0))`);
      logger.success('Sequences updated to current max ids');
    } catch (e) {
      logger.warn('Unable to update sequences automatically');
    }

    // Optionally drop legacy 'code' columns from regions/provinces after upserts
    if (DROP_LEGACY_CODES) {
      logger.header('Dropping legacy code columns');
      try {
        await client.query(`ALTER TABLE provinces DROP COLUMN IF EXISTS code;`);
        await client.query(`ALTER TABLE regions DROP COLUMN IF EXISTS code;`);
        logger.success('Dropped legacy code columns from provinces and regions');
      } catch (e) {
        logger.warn('Failed to drop some code columns');
      }
    }
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error("Seeding failed. Transaction rolled back.");
    console.error(error);
  } finally {
    client.release();
    pool.end();
  }
}

seed();