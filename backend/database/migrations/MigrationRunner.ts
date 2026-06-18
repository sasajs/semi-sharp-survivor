import fs from "fs";
import { PostgresConnectionManager } from "../connection/PostgresConnectionManager";
import { migrationRegistry } from "./MigrationRegistry";

export class MigrationRunner {
  /**
   * Evaluates the schema tracking table, checks registered schema scripts, 
   * and runs pending migrations sequentially.
   */
  static async runAllPending(): Promise<string> {
    const manager = PostgresConnectionManager.getInstance();

    // 1. Establish database connection pool first
    manager.initialize();

    // 2. Attempt to create the migration ledger table if not already present
    try {
      await manager.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          version VARCHAR(100) NOT NULL UNIQUE,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (tblErr: any) {
      console.error("[Migration Runner] Failed to setup/verify migration tracker schema_migrations:", tblErr.message);
      throw tblErr;
    }

    // 3. Query migrations that have been registered as completed
    const appliedRows = await manager.query("SELECT version FROM schema_migrations ORDER BY id ASC;");
    const completedVersions = new Set<string>(appliedRows.map((r: any) => r.version));

    let currentVersion = "V000";
    if (appliedRows.length > 0) {
      currentVersion = appliedRows[appliedRows.length - 1].version;
    }

    let newlyAppliedCount = 0;

    // 4. Iterate over registered migrations and run any pending entries
    for (const migration of migrationRegistry) {
      if (!completedVersions.has(migration.version)) {
        console.log(`[Migration Runner] Running pending migration [${migration.version}] - "${migration.description}"`);

        if (!fs.existsSync(migration.filePath)) {
          throw new Error(`[Migration Runner] Exec failed: Script not found at path "${migration.filePath}"`);
        }

        const scriptContent = fs.readFileSync(migration.filePath, "utf-8");

        // Execute the migration DDL scripts
        await manager.query(scriptContent);

        // Insert migration tracking record
        await manager.query("INSERT INTO schema_migrations (version) VALUES ($1);", [migration.version]);
        console.log(`[Migration Runner] Successfully applied schema version [${migration.version}].`);

        currentVersion = migration.version;
        newlyAppliedCount++;
      } else {
        if (process.env.DEBUG_SQL === "true") {
          console.log(`[Migration Runner] Version [${migration.version}] is up-to-date.`);
        }
      }
    }

    if (newlyAppliedCount > 0) {
      console.log(`[Migration Runner] Migration operation complete. Applied ${newlyAppliedCount} fresh delta scripts. Active schema: "${currentVersion}"`);
    } else {
      console.log(`[Migration Runner] Database up-to-date. Active schema: "${currentVersion}"`);
    }

    return currentVersion;
  }

  /**
   * Resolves the current version that is applied to the active database.
   */
  static async getCurrentVersion(): Promise<string> {
    const manager = PostgresConnectionManager.getInstance();
    try {
      const rows = await manager.query("SELECT version FROM schema_migrations ORDER BY id DESC LIMIT 1;");
      if (rows && rows.length > 0) {
        return rows[0].version;
      }
      return "none";
    } catch {
      return "V000";
    }
  }
}
