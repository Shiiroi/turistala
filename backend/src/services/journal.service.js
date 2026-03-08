import { connectDB, withTransaction } from "../db/db.js";
import { supabase } from "../supabaseClient.js";

/**
 * Parses and extracts the relative filepath artifact from a fully qualified Supabase storage URL.
 *
 * @param {string} url - The complete public URL of the object.
 * @returns {string|null} The trailing file path within the storage bucket.
 */
const extractPathFromUrl = (url) => {
    if (!url || typeof url !== "string") return null;
    const matches = url.match(
        /\/storage\/v1\/object\/public\/journal-photos\/(.+)$/,
    );
    return matches ? matches[1] : null;
};

/**
 * Persists a new user journal entry linked to a specific geographic locale.
 * Validates tracking goals and processes structural associations for media uploads.
 *
 * @param {string} userId - Requesting user identifier.
 * @param {string} municityId - Geographic location code.
 * @param {string} name - Entity display name.
 * @param {string} content - Rich text or string content.
 * @param {Array<string>} photos - Collection of pre-uploaded storage URLs.
 * @returns {Promise<Object>} Formatted object of the established entry.
 */
export const addJournal = async (
    userId,
    municityId,
    name,
    title,
    content,
    photos = [],
) => {
    return await withTransaction(async (client) => {
        const query = `
            SELECT p.id as place_id, g.is_visited
            FROM places p
            JOIN user_place_goals g ON p.id = g.place_id
            WHERE p.municity_id = $1 AND g.user_id = $2 AND p.name = $3
        `;
        let placeRes = await client.query(query, [municityId, userId, name]);

        if (placeRes.rows.length === 0) {
            throw new Error("You must add this place to your goals first.");
        }

        if (placeRes.rows[0].is_visited !== true) {
            throw new Error(
                "You must mark this place as visited before adding a journal entry.",
            );
        }

        let placeId = placeRes.rows[0].place_id;

        const journalRes = await client.query(
            "INSERT INTO journal_entries (user_id, place_id, content, title, visit_date) VALUES ($1, $2, $3, $4, CURRENT_DATE) RETURNING *",
            [userId, placeId, content, title || name],
        );
        const journal = journalRes.rows[0];

        if (photos && photos.length > 0) {
            for (let url of photos) {
                await client.query(
                    "INSERT INTO journal_photos (journal_id, storage_url) VALUES ($1, $2)",
                    [journal.id, url],
                );
            }
        }

        return await getJournalById(journal.id);
    });
};

/**
 * Modifies an existing journal object and handles media synchronization.
 * Computes difference between stored arrays and mutation payload to execute cloud bucket purges.
 *
 * @param {string} userId - Requesting user identifier.
 * @param {string} journalId - Primary key of the journal.
 * @param {string} content - Updated text payload or undefined.
 * @param {Array<string>} photos - Comprehensive replacement array of photo object URIs.
 * @returns {Promise<Object>} Refreshed projection of customized journal entity.
 */
export const editJournal = async (
    userId,
    journalId,
    title,
    content,
    photos = [],
) => {
    return await withTransaction(async (client) => {
        const checkRes = await client.query(
            "SELECT user_id FROM journal_entries WHERE id = $1",
            [journalId],
        );
        if (checkRes.rows.length === 0 || checkRes.rows[0].user_id !== userId) {
            throw new Error("Journal not found or unauthorized");
        }

        if (content !== undefined || title !== undefined) {
            let updateFields = [];
            let values = [];
            let idx = 1;

            if (content !== undefined) {
                updateFields.push(`content = $${idx++}`);
                values.push(content);
            }
            if (title !== undefined) {
                updateFields.push(`title = $${idx++}`);
                values.push(title);
            }

            if (updateFields.length > 0) {
                values.push(journalId);
                await client.query(
                    `UPDATE journal_entries SET ${updateFields.join(", ")} WHERE id = $${idx}`,
                    values,
                );
            }
        }

        const existingPhotosRes = await client.query(
            "SELECT storage_url FROM journal_photos WHERE journal_id = $1",
            [journalId],
        );
        const existingUrls = existingPhotosRes.rows.map((r) => r.storage_url);

        const urlsToDelete = existingUrls.filter(
            (url) => !photos.includes(url),
        );

        if (urlsToDelete.length > 0) {
            const pathsToDelete = urlsToDelete
                .map((url) => extractPathFromUrl(url))
                .filter(Boolean);

            if (pathsToDelete.length > 0) {
                const { error } = await supabase.storage
                    .from("journal-photos")
                    .remove(pathsToDelete);
                if (error)
                    console.error(
                        "Error deleting old photos from bucket:",
                        error,
                    );
            }
        }

        await client.query("DELETE FROM journal_photos WHERE journal_id = $1", [
            journalId,
        ]);

        if (photos && photos.length > 0) {
            for (let url of photos) {
                await client.query(
                    "INSERT INTO journal_photos (journal_id, storage_url) VALUES ($1, $2)",
                    [journalId, url],
                );
            }
        }

        return await getJournalById(journalId);
    });
};

/**
 * Purges a journal entry and its linked relational sub-entities from storage configurations.
 * Guarantees atomicity via transactional wrapping.
 *
 * @param {string} userId - Requesting user identifier.
 * @param {string} journalId - Primary key of the targeted journal to be pruned.
 * @returns {Promise<boolean>} True indicating operational finality.
 * @throws {Error} If authentication or ownership assertions yield invalidations.
 */
export const deleteJournal = async (userId, journalId) => {
    return await withTransaction(async (client) => {
        const checkRes = await client.query(
            "SELECT user_id FROM journal_entries WHERE id = $1",
            [journalId],
        );
        if (checkRes.rows.length === 0 || checkRes.rows[0].user_id !== userId) {
            throw new Error("Journal not found or unauthorized");
        }

        const existingPhotosRes = await client.query(
            "SELECT storage_url FROM journal_photos WHERE journal_id = $1",
            [journalId],
        );
        const existingUrls = existingPhotosRes.rows.map((r) => r.storage_url);

        if (existingUrls.length > 0) {
            const pathsToDelete = existingUrls
                .map((url) => extractPathFromUrl(url))
                .filter(Boolean);

            if (pathsToDelete.length > 0) {
                const { error } = await supabase.storage
                    .from("journal-photos")
                    .remove(pathsToDelete);
                if (error)
                    console.error(
                        "Error deleting photos from bucket on journal delete:",
                        error,
                    );
            }
        }

        await client.query("DELETE FROM journal_photos WHERE journal_id = $1", [
            journalId,
        ]);

        await client.query(
            "DELETE FROM journal_entries WHERE id = $1 AND user_id = $2",
            [journalId, userId],
        );

        return true;
    });
};

/**
 * Fetch all journal entries for a given map municipality ID.
 *
 * @param {string} userId - The unique identifier of the user.
 * @param {string} municityId - The unique identifier of the municipality.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of journal entries, each containing place details and associated photos.
 */
export const getJournalsByPlace = async (userId, municityId) => {
    let client;
    try {
        client = await connectDB.connect();
        const res = await client.query(
            `
            SELECT j.*, pl.name as place_name,
                   COALESCE(
                       json_agg(
                           json_build_object('photo_id', p.id, 'storage_url', p.storage_url)
                       ) FILTER (WHERE p.id IS NOT NULL), '[]'
                   ) as photos
            FROM journal_entries j
            JOIN places pl ON j.place_id = pl.id
            LEFT JOIN journal_photos p ON j.id = p.journal_id
            WHERE j.user_id = $1 AND pl.municity_id = $2
            GROUP BY j.id, pl.name
            ORDER BY j.visit_date DESC
        `,
            [userId, municityId],
        );
        return res.rows;
    } finally {
        if (client) client.release();
    }
};

/**
 * Fetch a single journal entry by ID.
 *
 * @param {string} journalId - The unique identifier of the journal entry.
 * @returns {Promise<Object>} A promise that resolves to the journal entry object, including associated photos.
 */
export const getJournalById = async (journalId) => {
    let client;
    try {
        client = await connectDB.connect();
        const res = await client.query(
            `
            SELECT j.*, 
                   COALESCE(
                       json_agg(
                           json_build_object('photo_id', p.id, 'storage_url', p.storage_url)
                       ) FILTER (WHERE p.id IS NOT NULL), '[]'
                   ) as photos
            FROM journal_entries j
            LEFT JOIN journal_photos p ON j.id = p.journal_id
            WHERE j.id = $1
            GROUP BY j.id
        `,
            [journalId],
        );
        return res.rows[0];
    } finally {
        if (client) client.release();
    }
};
