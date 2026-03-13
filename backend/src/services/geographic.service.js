import { connectDB } from "../db/db.js";

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

    const rows = res.rows.map((row) => {
        try {
            if (row.geo_json && typeof row.geo_json === "string") {
                row.geo_json = JSON.parse(row.geo_json);
            }
        } catch (e) {}

        return row;
    });

    return rows;
};

/**
 * Fetch a single municipality by ID
 */
export const getMunicipalityById = async (id) => {
    const res = await connectDB.query(
        `SELECT m.*, p.name AS province_name, p.code AS province_code, r.name AS region_name, r.code AS region_code
         FROM municities m
         LEFT JOIN provinces p ON m.province_id = p.id
         LEFT JOIN regions r ON p.region_id = r.id
         WHERE m.id = $1`,
        [id],
    );
    const row = res.rows[0];
    if (row && row.geo_json && typeof row.geo_json === "string") {
        try {
            row.geo_json = JSON.parse(row.geo_json);
        } catch (e) {
            /* noop */
        }
    }

    return row;
};

/**
 * Fetch all Regions
 */
export const getRegions = async () => {
    const res = await connectDB.query("SELECT * FROM regions ORDER BY id ASC");
    return res.rows;
};

/**
 * Fetch all Provinces
 */

export const getProvinces = async () => {
    const res = await connectDB.query(
        `SELECT p.*, r.name AS region_name, r.code AS region_code
         FROM provinces p
         LEFT JOIN regions r ON p.region_id = r.id
         ORDER BY p.id ASC`,
    );

    // Parse geo_json string into an object, similar to municipalities
    const rows = res.rows.map((row) => {
        try {
            if (row.geo_json && typeof row.geo_json === "string") {
                row.geo_json = JSON.parse(row.geo_json);
            }
        } catch (e) {
            /* noop */
        }
        return row;
    });

    return rows;
};

/**
 * Fetch all matching provinces for a cascading dropdown via region mapping.
 *
 * @param {string} regionId - Regional foreign key parameter limit.
 * @returns {Promise<Array<Object>>} A promise resolving into a collection of normalized province schemas matching the subset.
 */
export const getProvincesByRegionId = async (regionId) => {
    const res = await connectDB.query(
        "SELECT * FROM provinces WHERE region_id = $1 ORDER BY name ASC",
        [regionId],
    );
    return res.rows;
};
