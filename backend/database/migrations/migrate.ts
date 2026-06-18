import dotenv from "dotenv";
dotenv.config();

import { runMigrations } from "./runMigrations";
import { pool } from "../connection";

async function run() {
  try {
    await runMigrations();
    console.log("[Migration Script] Run finished successfully.");
    process.exit(0);
  } catch (err) {
    console.error("[Migration Script] Failed with error:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
