import { 
  SystemReadinessResult, 
  RepositoryValidationResult, 
  MigrationValidationResult, 
  ConnectionValidationResult, 
  PostgresValidationResult 
} from "../models";
import { RepositoryValidationService } from "./RepositoryValidationService";
import { MigrationValidationService } from "./MigrationValidationService";
import { ConnectionValidationService } from "./ConnectionValidationService";
import { databaseConfig } from "../../config/database";

export class PostgresValidationService {
  /**
   * Main entry point to compile and retrieve full diagnostic postgres-readiness verification checks
   */
  static runValidation(): SystemReadinessResult {
    const repositoryResult = this.validateRepositories();
    const migrationResult = this.validateMigrationRegistry();
    const connectionResult = this.validateConnectionConfiguration();
    const environmentResult = this.validateEnvironment();

    return this.buildReadinessReport(
      repositoryResult,
      migrationResult,
      connectionResult,
      environmentResult
    );
  }

  /**
   * Run Repository Layer checks
   */
  static validateRepositories(): RepositoryValidationResult {
    return RepositoryValidationService.validateRepositoryFactory();
  }

  /**
   * Run connection profiles config checks
   */
  static validateConnectionConfiguration(): ConnectionValidationResult {
    return ConnectionValidationService.validateConnectionConfig();
  }

  /**
   * Run SQL Migration registry files structure checks
   */
  static validateMigrationRegistry(): MigrationValidationResult {
    return MigrationValidationService.validateMigrationRegistry();
  }

  /**
   * Retrieve parsed variables configuration status
   */
  static validateEnvironment(): PostgresValidationResult {
    const { valid } = ConnectionValidationService.validateEnvironmentVariables();
    const databaseUrl = process.env.DATABASE_URL;

    let status: "HEALTHY" | "WARNING" | "FAILED" = "HEALTHY";
    let errorMessage: string | null = null;

    if (!valid) {
      status = "FAILED";
      errorMessage = "One or more database numerical pool configuration variables contain invalid parsing signatures.";
    } else if (!databaseUrl) {
      status = "WARNING";
      errorMessage = "DATABASE_URL environment settings variable was not detected.";
    }

    return {
      status,
      environmentValid: valid,
      errorMessage
    };
  }

  /**
   * Synthesizes individual layer diagnostics into an actionable checklist output report
   */
  static buildReadinessReport(
    repositoryValidation: RepositoryValidationResult,
    migrationValidation: MigrationValidationResult,
    connectionValidation: ConnectionValidationResult,
    environmentValidation: PostgresValidationResult
  ): SystemReadinessResult {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Evaluate overall readiness status using strictest level logic
    const statuses = [
      repositoryValidation.status,
      migrationValidation.status,
      connectionValidation.status,
      environmentValidation.status
    ];

    let overallStatus: "HEALTHY" | "WARNING" | "FAILED" = "HEALTHY";
    if (statuses.some(s => s === "FAILED")) {
      overallStatus = "FAILED";
    } else if (statuses.some(s => s === "WARNING")) {
      overallStatus = "WARNING";
    }

    // Produce warnings based on mock-vs-postgres settings
    if (databaseConfig.useMock) {
      warnings.push("The platform is operational under local memory mock state arrays. Non-static state mutations are ephemeral.");
    } else {
      warnings.push("The platform has USE_MOCK false. Initializing connection manager directly targeting DATABASE_URL.");
    }

    if (!connectionValidation.databaseUrlProvided) {
      warnings.push("No environment DATABASE_URL is initialized. Live PostgreSQL integrations will fail connection handshakes.");
    }

    if (migrationValidation.migrations.length === 0) {
      warnings.push("Database schema files register count is empty. No SQL definitions were found to migrate structure elements.");
    }

    // Build intelligent recommendations list
    if (databaseConfig.useMock) {
      recommendations.push("Keep USE_MOCK=true during sandbox testing sessions to prevent unexpected database connectivity issues.");
    }

    if (!connectionValidation.databaseUrlProvided) {
      recommendations.push("Ensure your team provisions a live PostgreSQL database on Cloud SQL and configures the DATABASE_URL environment setting.");
    } else {
      recommendations.push("DATABASE_URL is provided. Perform dry-run queries or configure secure SSL handshakes before cutover.");
    }

    const hasMissingSqlFiles = migrationValidation.migrations.some(m => !m.exists);
    if (hasMissingSqlFiles) {
      recommendations.push("Restore missing migration files listed on the validation diagnostics schema registry to the filesystem.");
    } else {
      recommendations.push("Validation found all migration files. Execute migration.ts scripts in node environments to build default schemas.");
    }

    if (connectionValidation.poolMax < 5) {
      recommendations.push("Your DB pool size limits are tightly constrained. Consider increasing DB_POOL_MAX to at least 10 for production concurrency.");
    }

    recommendations.push("Verify network firewalls allow inbound database traffic from our container cloud instance on port 5432.");

    return {
      overallStatus,
      repositoryValidation,
      migrationValidation,
      connectionValidation,
      environmentValidation,
      warnings,
      recommendations,
      generatedAt: new Date().toISOString()
    };
  }
}
