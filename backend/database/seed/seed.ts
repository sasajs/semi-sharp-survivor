import dotenv from "dotenv";
dotenv.config();

import { seedDatabase } from "./seedData";
import { pool } from "../connection";

async function run() {
  try {
    await seedDatabase();
    console.log("[Seeder Script] Run finished successfully.");
    process.exit(0);
  } catch (err) {
    console.error("[Seeder Script] Seeding failed with error:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
