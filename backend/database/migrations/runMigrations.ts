import fs from "fs";
import path from "path";
import { query } from "../connection";

export async function runMigrations() {
  console.log("[Migration] Executing migration schema...");
  
  try {
    // Read the schema.sql which is the source of truth
    const schemaPath = path.join(process.cwd(), "circa_developer_blueprint", "schema.sql");
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`schema.sql not found at ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, "utf-8");

    // We can run the raw SQL file directly in a single query block
    // split the commands or run as one because pg supports multiple statements
    await query(schemaSql);
    console.log("[Migration] Database schema migrated successfully!");
  } catch (err) {
    console.error("[Migration] Error running database migrations:", err);
    throw err;
  }
}
