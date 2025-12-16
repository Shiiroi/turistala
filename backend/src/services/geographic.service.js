// apps/server/src/services/geographic.service.js

// 1. Import 'pool' instead of 'getDbClient'
import { connectDB } from '../db/db.js';

/**
 * Fetch all municipalities
 * Uses pool.query() to automatically connect, query, and release.
 */
export const getMunicipalities = async () => {
    // Logic: "Hey Pool, run this SQL and give me the result."
    const res = await connectDB.query(
        'SELECT id, name, code, province_id, geo_json FROM municipalities ORDER BY name ASC'
    );
    return res.rows;
};

/**
 * Fetch a single municipality by ID
 */
export const getMunicipalityById = async (id) => {
    // Logic: "Hey Pool, run this SQL with this specific ID ($1)."
    const res = await connectDB.query(
        'SELECT * FROM municipalities WHERE id = $1',
        [id]
    );
    return res.rows[0];
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

