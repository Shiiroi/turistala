import { connectDB, withTransaction } from "../db/db.js";

/**
 * Adds a new geographic goal to the user's tracking profile.
 * Incorporates a find-or-create execution flow for the associated place entity.
 *
 * @param {string} userId - The unique identifier of the user.
 * @param {string} municityId - The exact municipality identifier.
 * @param {string} name - The human-readable name of the location.
 * @returns {Promise<Object>} The instantiated user_place_goals record.
 * @throws {Error} If the goal object already exists in tracking hierarchy.
 */
export const addGoal = async (userId, municityId, name) => {
    return await withTransaction(async (client) => {
        let placeRes = await client.query(
            "SELECT id FROM places WHERE municity_id = $1 AND LOWER(name) = LOWER($2)",
            [municityId, name],
        );
        let placeId;

        if (placeRes.rows.length > 0) {
            placeId = placeRes.rows[0].id;
        } else {
            let insertPlace = await client.query(
                "INSERT INTO places (municity_id, name) VALUES ($1, $2) RETURNING id",
                [municityId, name],
            );
            placeId = insertPlace.rows[0].id;
        }

        const checkQuery = `SELECT * FROM user_place_goals WHERE user_id = $1 AND place_id = $2`;
        const checkResult = await client.query(checkQuery, [userId, placeId]);

        if (checkResult.rows.length > 0) {
            throw new Error("Place is already in your goals.");
        }

        const query = `
            INSERT INTO user_place_goals (user_id, place_id, is_visited)
            VALUES ($1, $2, FALSE)
            RETURNING *;
        `;
        const result = await client.query(query, [userId, placeId]);

        return result.rows[0];
    });
};

/**
 * Updates the visitation boolean status of a pre-existing goal.
 *
 * @param {string} userId - The unique identifier of the user.
 * @param {string} placeId - The unique identifier of the target location.
 * @param {boolean} isVisited - The overriding visit status to persist.
 * @returns {Promise<Object>} The mutated database record.
 * @throws {Error} Upon failure to locate the referenced user-place affiliation.
 */
export const updateGoalStatus = async (userId, placeId, isVisited) => {
    return await withTransaction(async (client) => {
        const query = `
            UPDATE user_place_goals 
            SET is_visited = $1 
            WHERE user_id = $2 AND place_id = $3
            RETURNING *;
        `;
        const result = await client.query(query, [isVisited, userId, placeId]);
        if (result.rows.length === 0) {
            throw new Error("Goal not found.");
        }

        return result.rows[0];
    });
};

/**
 * Retrieves the comprehensive list of tracking goals for a designated user.
 *
 * @param {string} userId - The unique identifier of the user.
 * @returns {Promise<Array<Object>>} A sorted array of target destinations enriched with geographic attributes.
 */
export const getGoals = async (userId) => {
    let client;
    try {
        client = await connectDB.connect();
        const query = `
            SELECT 
                g.id, 
                g.place_id, 
                g.added_at, 
                g.is_visited,
                p.name as place_name, 
                p.municity_id,
                p.category, 
                p.lat, 
                p.lng
            FROM user_place_goals g
            JOIN places p ON g.place_id = p.id
            WHERE g.user_id = $1
            ORDER BY g.added_at DESC;
        `;
        const result = await client.query(query, [userId]);
        return result.rows;
    } finally {
        if (client) client.release();
    }
};

/**
 * Computes aggregated progress metrics representing visitation success rate.
 *
 * @param {string} userId - The unique identifier of the user.
 * @returns {Promise<Object>} An object containing sum statistics of total and successfully visited goals.
 */
export const getGoalProgress = async (userId) => {
    let client;
    try {
        client = await connectDB.connect();
        const query = `
            SELECT
                COUNT(*) as total_goals,
                COUNT(*) FILTER (WHERE is_visited = TRUE) as visited_goals
            FROM user_place_goals
            WHERE user_id = $1;
        `;
        const result = await client.query(query, [userId]);
        return result.rows[0];
    } finally {
        if (client) client.release();
    }
};

/**
 * Removes a defined tracking relation from the system ledger.
 *
 * @param {string} userId - The unique identifier of the user.
 * @param {string} placeId - The unique identifier of the location to decouple.
 * @returns {Promise<Object>} The finalized deletion data record.
 * @throws {Error} In circumstances where the referenced relational index yields empty state.
 */
export const removeGoal = async (userId, placeId) => {
    return await withTransaction(async (client) => {
        const query = `
            DELETE FROM user_place_goals 
            WHERE user_id = $1 AND place_id = $2
            RETURNING *;
        `;
        const result = await client.query(query, [userId, placeId]);

        if (result.rows.length === 0) {
            throw new Error("Goal not found.");
        }

        return result.rows[0];
    });
};
