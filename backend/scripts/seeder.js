import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import pg from 'pg';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Connect to Environment Variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ CRITICAL: No DATABASE_URL found in ../apps/server/.env");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const jsonFolder = path.join(__dirname, 'provdist');

// --- THE DICTIONARY (Add new codes here as you expand) ---
const REGION_LOOKUP = {
  '100000000': 'Region I (Ilocos Region)',
  '200000000': 'Region II (Cagayan Valley)',
  '300000000': 'Region III (Central Luzon)',
  '400000000': 'Region IV-A (CALABARZON)',
  '1700000000': 'MIMAROPA Region',
  '500000000': 'Region V (Bicol Region)',
  '600000000': 'Region VI (Western Visayas)',
  '700000000': 'Region VII (Central Visayas)',
  '800000000': 'Region VIII (Eastern Visayas)',
  '900000000': 'Region IX (Zamboanga Peninsula)',
  '1000000000': 'Region X (Northern Mindanao)',
  '1100000000': 'Region XI (Davao Region)',
  '1200000000': 'Region XII (SOCCSKSARGEN)',
  '1300000000': 'National Capital Region (NCR)',
  '1400000000': 'Cordillera Administrative Region (CAR)',
  '1600000000': 'Region XIII (Caraga)',
  '1900000000': 'Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)',
};

const PROVINCE_LOOKUP = {
  // Region I
  '102800000': 'Ilocos Norte',
  '102900000': 'Ilocos Sur',
  '103300000': 'La Union',
  '105500000': 'Pangasinan',

  // Region II
  '200900000': 'Batanes',
  '201500000': 'Cagayan',
  '203100000': 'Isabela',
  '205000000': 'Nueva Vizcaya',
  '205700000': 'Quirino',

  // Region III
  '300800000': 'Bataan',
  '301400000': 'Bulacan',
  '304900000': 'Nueva Ecija',
  '305400000': 'Pampanga',
  '306900000': 'Tarlac',
  '307100000': 'Zambales',
  '307700000': 'Aurora',

  // Region IV-A
  '405800000': 'Rizal',
  '402100000': 'Cavite',
  '403400000': 'Laguna',
  '401000000': 'Batangas',
  '405600000': 'Quezon',

  // MIMAROPA
  '1704000000': 'Marinduque',
  '1705100000': 'Occidental Mindoro',
  '1705200000': 'Oriental Mindoro',
  '1705300000': 'Palawan',
  '1705900000': 'Romblon',

  // Region V
  '500500000': 'Albay',
  '501600000': 'Camarines Norte',
  '501700000': 'Camarines Sur',
  '502000000': 'Catanduanes',
  '504100000': 'Masbate',
  '506200000': 'Sorsogon',

  // Region VI
  '600400000': 'Aklan',
  '600600000': 'Antique',
  '601900000': 'Capiz',
  '603000000': 'Iloilo',
  '604500000': 'Negros Occidental',
  '607900000': 'Guimaras',

  // Region VII
  '701200000': 'Bohol',
  '702200000': 'Cebu',
  '704600000': 'Negros Oriental',
  '706100000': 'Siquijor',

  // Region VIII
  '802600000': 'Eastern Samar',
  '803700000': 'Leyte',
  '804800000': 'Northern Samar',
  '806000000': 'Samar',
  '806400000': 'Southern Leyte',
  '807800000': 'Biliran',

  // Region IX
  '907200000': 'Zamboanga del Norte',
  '907300000': 'Zamboanga del Sur',
  '908300000': 'Zamboanga Sibugay',
  '990100000': 'City of Isabela',

  // Region X
  '1001300000': 'Bukidnon',
  '1001800000': 'Camiguin',
  '1003500000': 'Lanao del Norte',
  '1004200000': 'Misamis Occidental',
  '1004300000': 'Misamis Oriental',

  // Region XI
  '1102300000': 'Davao del Norte',
  '1102400000': 'Davao del Sur',
  '1102500000': 'Davao Oriental',
  '1108200000': 'Davao de Oro',
  '1108600000': 'Davao Occidental',

  // Region XII
  '1204700000': 'Cotabato',
  '1206300000': 'South Cotabato',
  '1206500000': 'Sultan Kudarat',
  '1208000000': 'Sarangani',

  // NCR (Cities/Districts)
  '1303900000': 'City of Manila',
  '1307400000': 'Quezon City',
  '1307500000': 'Caloocan City',
  '1307600000': 'Pasay City',

  // CAR
  '1400100000': 'Abra',
  '1401100000': 'Benguet',
  '1402700000': 'Ifugao',
  '1403200000': 'Kalinga',
  '1404400000': 'Mountain Province',
  '1408100000': 'Apayao',

  // Caraga
  '1600200000': 'Agusan del Norte',
  '1600300000': 'Agusan del Sur',
  '1606700000': 'Surigao del Norte',
  '1606800000': 'Surigao del Sur',
  '1608500000': 'Dinagat Islands',

  // BARMM
  '1900700000': 'Basilan',
  '1903600000': 'Lanao del Sur',
  '1906600000': 'Sulu',
  '1907000000': 'Tawi-Tawi',
  '1908700000': 'Maguindanao del Norte',
  '1908800000': 'Maguindanao del Sur',
  '1909900000': 'Special Geographic Area',
};

async function seed() {
  const client = await pool.connect();
  console.log("🚀 Starting Automated Seed...");

  try {
    const files = fs.readdirSync(jsonFolder);

    for (const file of files) {
      if (path.extname(file) === '.json') {
        
        console.log(`\n📂 Processing: ${file}`);
        
        const filePath = path.join(jsonFolder, file);
        const json = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const features = json.features || [];

        if (features.length === 0) continue;

        // --- STEP 1: DETECT REGION & PROVINCE ---
        // We look at the first item to find out where we are
        const firstProp = features[0].properties;
        const regionCode = firstProp.adm1_psgc.toString();
        const provinceCode = firstProp.adm2_psgc.toString();

        // Get Names from our Dictionary
        const regionName = REGION_LOOKUP[regionCode] || `Unknown Region (${regionCode})`;
        const provinceName = PROVINCE_LOOKUP[provinceCode] || `Unknown Province (${provinceCode})`;

        // --- STEP 2: ENSURE REGION EXISTS ---
        let regionId;
        const fetchReg = await client.query("SELECT id FROM regions WHERE code = $1", [regionCode]);
        
        if (fetchReg.rows.length > 0) {
            regionId = fetchReg.rows[0].id;
            // Update name if needed
            await client.query("UPDATE regions SET name = $1 WHERE id = $2", [regionName, regionId]);
        } else {
            const regionRes = await client.query(`
              INSERT INTO regions (name, code) VALUES ($1, $2)
              RETURNING id;
            `, [regionName, regionCode]);
            regionId = regionRes.rows[0].id;
        }

        // --- STEP 3: ENSURE PROVINCE EXISTS ---
        let provinceId;
        const fetchProv = await client.query("SELECT id FROM provinces WHERE code = $1", [provinceCode]);
        
        if (fetchProv.rows.length > 0) {
            provinceId = fetchProv.rows[0].id;
            // Update name if needed
            await client.query("UPDATE provinces SET name = $1 WHERE id = $2", [provinceName, provinceId]);
        } else {
            const provRes = await client.query(`
              INSERT INTO provinces (name, code, region_id) VALUES ($1, $2, $3)
              RETURNING id;
            `, [provinceName, provinceCode, regionId]);
            provinceId = provRes.rows[0].id;
        }

        console.log(`   📍 Region: ${regionName} (ID: ${regionId})`);
        console.log(`   📍 Province: ${provinceName} (ID: ${provinceId})`);

        // --- STEP 4: INSERT MUNICIPALITIES ---
        for (const feature of features) {
          const name = feature.properties.adm3_en;
          const geometry = feature.geometry;
          const code = feature.properties.adm3_psgc;

          if (name && geometry && code) {
            await client.query(
              `INSERT INTO municipalities (name, code, geo_json, province_id) 
               VALUES ($1, $2, $3, $4) 
               ON CONFLICT (code) DO NOTHING`, // Prevent duplicates
              [name, code, geometry, provinceId]
            );
            process.stdout.write('.');
          }
        }
      }
    }
    console.log("\n\n✅ DONE.");

  } catch (error) {
    console.error("\n❌ ERROR:", error);
  } finally {
    client.release();
    pool.end();
  }
}

seed();