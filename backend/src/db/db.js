// 1. LOAD ENV VARS FIRST (Fixes the crashing issue)
import "dotenv/config";

// apps/server/src/db/db.js
import pg from "pg";
const { Pool } = pg;

export const connectDB = new Pool({
  connectionString: process.env.DATABASE_URL,
});
