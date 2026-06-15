import pg from "pg";

const { Pool } = pg;

// Support individual parameters or full connection String database URLs
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres";

export const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_URL?.includes("supabase") || process.env.DATABASE_URL?.includes("render") || process.env.PG_SSL === "true"
    ? { rejectUnauthorized: false }
    : undefined
});

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.DEBUG_SQL === "true") {
      console.log(`[SQL Query] Executed: ${text} | Duration: ${duration}ms | Rows: ${res.rowCount}`);
    }
    return res.rows;
  } catch (error) {
    console.error(`[SQL Error] Failed executing query: ${text}`, error);
    throw error;
  }
}
