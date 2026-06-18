import fs from "fs";
import { migrationRegistry } from "../../database/migrations/MigrationRegistry";
import { MigrationValidationResult } from "../models";

export class MigrationValidationService {
  /**
   * Validate the migration registry structures
   */
  static validateMigrationRegistry(): MigrationValidationResult {
    let status: "HEALTHY" | "WARNING" | "FAILED" = "HEALTHY";
    let errorMessage: string | null = null;

    const migrations = migrationRegistry.map(m => {
      // Check if SQL file actually exists on filesystem
      const exists = fs.existsSync(m.filePath);
      if (!exists) {
        status = "FAILED";
      }

      return {
        version: m.version,
        description: m.description,
        exists,
        validOrder: true // determined in ordered audit below
      };
    });

    // Check versions are ordered sequentially
    const ordered = this.validateMigrationOrdering();
    if (!ordered) {
      status = "FAILED";
      migrations.forEach(m => m.validOrder = false);
    }

    if (migrations.length === 0) {
      status = "WARNING";
      errorMessage = "No schema migrations are registered in the migration pipeline registry.";
    } else if (status === "FAILED") {
      errorMessage = "One or more schema SQL files designated in migration runner are missing from disk.";
    }

    // Verify V001 exists as a cornerstone schema
    const hasV001 = migrations.some(m => m.version === "V001");
    if (!hasV001) {
      status = "FAILED";
      errorMessage = errorMessage 
        ? `${errorMessage} Missing cornerstone V001 initializer migration.` 
        : "Cornerstone V001 schema migrations are absent from the loaded registry.";
    }

    return {
      status,
      migrations,
      currentVersion: this.validateCurrentVersion(),
      errorMessage
    };
  }

  /**
   * Verify iterations follow strict incremental numbering formats (Vxxx)
   */
  static validateMigrationOrdering(): boolean {
    try {
      const versions = migrationRegistry.map(m => {
        const match = m.version.match(/^V(\d+)$/);
        if (!match) {
          throw new Error(`Invalid migration naming format: ${m.version}`);
        }
        return parseInt(match[1], 10);
      });

      // Assert sorted ascending
      for (let i = 0; i < versions.length - 1; i++) {
        if (versions[i] >= versions[i + 1]) {
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check physical file presence for each defined schema version
   */
  static validateSchemaVersions(): { version: string; file: string; found: boolean }[] {
    return migrationRegistry.map(m => ({
      version: m.version,
      file: m.filePath,
      found: fs.existsSync(m.filePath)
    }));
  }

  /**
   * Returns current active schema target status
   */
  static validateCurrentVersion(): string {
    // Under USE_MOCK=true conditions, current running state resides in "mock-sandbox"
    return "mock-sandbox";
  }
}
