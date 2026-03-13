import { connectDB } from "../db/db.js";

/**
 * Get user profile including settings like map_color
 */
export const getUserProfile = async (userId) => {
    const query = `
        SELECT id, map_color, username, email 
        FROM users
        WHERE id = $1
    `;
    const result = await connectDB.query(query, [userId]);
    if (result.rows.length === 0) return null;
    return result.rows[0];
};

/**
 * Update user's map color preference
 */
export const updateUserMapColor = async (userId, mapColor) => {
    const query = `
        UPDATE users
        SET map_color = $1
        WHERE id = $2
        RETURNING id, map_color
    `;
    const result = await connectDB.query(query, [mapColor, userId]);
    if (result.rows.length === 0) return null;
    return result.rows[0];
};
