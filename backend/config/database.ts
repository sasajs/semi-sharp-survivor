import dotenv from "dotenv";
dotenv.config();

export const databaseConfig = {
  // Use USE_MOCK as primary, fallback to USE_MOCK_DATA if provided
  useMock: process.env.USE_MOCK !== undefined 
    ? process.env.USE_MOCK === "true" 
    : (process.env.USE_MOCK_DATA !== "false"),
  
  databaseUrl: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres",
  poolMin: parseInt(process.env.DB_POOL_MIN || "2", 10),
  poolMax: parseInt(process.env.DB_POOL_MAX || "10", 10),
  connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || "5000", 10)
};

/**
 * Validates the parsed database configuration parameters.
 */
export function validateDatabaseConfig(): void {
  const isMock = databaseConfig.useMock;
  if (!isMock) {
    if (!databaseConfig.databaseUrl) {
      throw new Error("[Config Error] DATABASE_URL environment setting is missing under relational persistence mode.");
    }
    if (isNaN(databaseConfig.poolMin) || databaseConfig.poolMin < 0) {
      throw new Error("[Config Error] DB_POOL_MIN must be a valid non-negative integer.");
    }
    if (isNaN(databaseConfig.poolMax) || databaseConfig.poolMax <= 0 || databaseConfig.poolMax < databaseConfig.poolMin) {
      throw new Error("[Config Error] DB_POOL_MAX must be a positive integer greater than or equal to DB_POOL_MIN.");
    }
    if (isNaN(databaseConfig.connectTimeout) || databaseConfig.connectTimeout <= 0) {
      throw new Error("[Config Error] DB_CONNECT_TIMEOUT must be a valid positive integer.");
    }
  }
}
