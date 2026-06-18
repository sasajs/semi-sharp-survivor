import { MigrationRunner } from "./MigrationRunner";

/**
 * Global migration orchestrator called by the application boots sequence.
 */
export async function runMigrations(): Promise<void> {
  console.log("[Migration Engine] Starting schema migration verification sequence...");
  try {
    const activeSchema = await MigrationRunner.runAllPending();
    console.log(`[Migration Engine] Schema migration checks verified. Running on schema version: ${activeSchema}`);
  } catch (err: any) {
    console.error("[Migration Engine] FATAL: Schema migration has failed:", err.message);
    throw err;
  }
}
