// apps/server/src/services/geographic.service.js

// 1. Import 'pool' instead of 'getDbClient'
import { connectDB } from '../db/db.js';

/**
 * Fetch all municipalities with province name
 * Uses pool.query() to automatically connect, query, and release.
 */
export const getMunicipalities = async () => {
    const res = await connectDB.query(`
        SELECT 
            m.id, 
            m.name, 
            m.province_id, 
            m.geo_json,
            p.name AS province_name,
            p.code AS province_code,
            r.name AS region_name,
            r.code AS region_code,
            m.type
        FROM municities m
        LEFT JOIN provinces p ON m.province_id = p.id
        LEFT JOIN regions r ON p.region_id = r.id
        ORDER BY m.name ASC
    `);

    // Parse geo_json (stored as TEXT) into objects and normalize some region fields
    const rows = res.rows.map((row) => {
        try {
            if (row.geo_json && typeof row.geo_json === 'string') {
                row.geo_json = JSON.parse(row.geo_json);
            }
        } catch (e) {
            // leave as-is if parsing fails
        }

        // No presentation logic here — return DB fields as-is. Frontend will use `region_name`/`province_name`/`type`.

        return row;
    });

    return rows;
};

/**
 * Fetch a single municipality by ID
 */
export const getMunicipalityById = async (id) => {
    // Logic: "Hey Pool, run this SQL with this specific ID ($1)."
    const res = await connectDB.query(
        `SELECT m.*, p.name AS province_name, p.code AS province_code, r.name AS region_name, r.code AS region_code
         FROM municities m
         LEFT JOIN provinces p ON m.province_id = p.id
         LEFT JOIN regions r ON p.region_id = r.id
         WHERE m.id = $1`,
        [id]
    );
    const row = res.rows[0];
    if (row && row.geo_json && typeof row.geo_json === 'string') {
        try { row.geo_json = JSON.parse(row.geo_json); } catch (e) { /* noop */ }
    }

    // No additional presentation fields for single-row fetch. Frontend will use DB values.

    return row;
};

/**
 * Fetch all Regions
 */
export const getRegions = async ()=>{
    const res = await connectDB.query(
        'SELECT * FROM regions ORDER BY id ASC'
    );
    return res.rows;
}

/**
 * Fetch all Provinces
 */

export const getProvinces = async ()=>{
    const res = await connectDB.query(
        'SELECT * FROM provinces ORDER BY id ASC'
    );
    return res.rows;
}



// Get Provinces belonging to a specific Region (Cascading Dropdown
export const getProvincesByRegionId = async(regionId) => {
    const res = await connectDB.query(
        'SELECT * FROM provinces WHERE region_id = $1 ORDER BY name ASC',
        [regionId]
    );
    return res.rows;
}

