import "dotenv/config";
import pg from "pg";
const { Pool } = pg;

export const connectDB = new Pool({
    connectionString: process.env.DATABASE_URL,
});

/**
 * Automates database transactions.
 * Automatically handles BEGIN, COMMIT, ROLLBACK, and releasing the client.
 */
export const withTransaction = async (callback) => {
    const client = await connectDB.connect();
    try {
        await client.query("BEGIN");
        const result = await callback(client);
        await client.query("COMMIT");
        return result;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
};
