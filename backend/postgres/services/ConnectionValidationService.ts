import { databaseConfig } from "../../config/database";
import { ConnectionValidationResult } from "../models";

export class ConnectionValidationService {
  /**
   * Run detailed configuration structural review
   */
  static validateConnectionConfig(): ConnectionValidationResult {
    const databaseUrlProvided = !!process.env.DATABASE_URL;
    const poolMin = databaseConfig.poolMin;
    const poolMax = databaseConfig.poolMax;
    const connectTimeout = databaseConfig.connectTimeout;
    const databaseMode = databaseConfig.useMock ? "mock" : "postgres";

    const poolSettingsValid = this.validatePoolConfiguration();
    const envVarsValid = this.validateEnvironmentVariables().valid;

    let status: "HEALTHY" | "WARNING" | "FAILED" = "HEALTHY";
    let errorMessage: string | null = null;

    if (!databaseUrlProvided) {
      status = "WARNING";
      errorMessage = "DATABASE_URL environment variable is currently absent. High-fidelity postgres connection cannot initialize.";
    } else if (!poolSettingsValid) {
      status = "FAILED";
      errorMessage = "Invalid pool boundaries (DB_POOL_MIN, DB_POOL_MAX). Verify configurations.";
    } else if (!envVarsValid) {
      status = "FAILED";
      errorMessage = "Required environment variables parsed invalid values.";
    }

    return {
      status,
      databaseUrlProvided,
      poolMin,
      poolMax,
      connectTimeout,
      databaseMode: databaseMode as "mock" | "postgres",
      poolSettingsValid,
      errorMessage
    };
  }

  /**
   * Audit configuration environment settings keys definition
   */
  static validateEnvironmentVariables(): { valid: boolean; variables: Record<string, string> } {
    const variables = {
      DATABASE_URL: process.env.DATABASE_URL ? "RESOLVED (HIDDEN)" : "UNDEFINED",
      USE_MOCK: process.env.USE_MOCK || "UNDEFINED",
      DB_POOL_MIN: process.env.DB_POOL_MIN || "UNDEFINED",
      DB_POOL_MAX: process.env.DB_POOL_MAX || "UNDEFINED",
      DB_CONNECT_TIMEOUT: process.env.DB_CONNECT_TIMEOUT || "UNDEFINED"
    };

    const valid = !isNaN(databaseConfig.poolMin) && 
                  !isNaN(databaseConfig.poolMax) && 
                  !isNaN(databaseConfig.connectTimeout);

    return {
      valid,
      variables
    };
  }

  /**
   * Verify min constraints <= max limits with positive ranges
   */
  static validatePoolConfiguration(): boolean {
    const min = databaseConfig.poolMin;
    const max = databaseConfig.poolMax;
    const timeout = databaseConfig.connectTimeout;

    if (isNaN(min) || min < 0) return false;
    if (isNaN(max) || max <= 0 || max < min) return false;
    if (isNaN(timeout) || timeout <= 0) return false;

    return true;
  }

  /**
   * Check mode state configuration
   */
  static validateDatabaseMode(): "mock" | "postgres" {
    return databaseConfig.useMock ? "mock" : "postgres";
  }
}
