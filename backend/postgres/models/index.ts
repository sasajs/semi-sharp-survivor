export interface RepositoryValidationResult {
  status: "HEALTHY" | "WARNING" | "FAILED";
  resolvedRepositories: {
    name: string;
    resolved: boolean;
    type: "mock" | "postgres" | "unknown";
    errorMessage: string | null;
  }[];
  mockActive: boolean;
  errorMessage: string | null;
}

export interface MigrationValidationResult {
  status: "HEALTHY" | "WARNING" | "FAILED";
  migrations: {
    version: string;
    description: string;
    exists: boolean;
    validOrder: boolean;
  }[];
  currentVersion: string;
  errorMessage: string | null;
}

export interface ConnectionValidationResult {
  status: "HEALTHY" | "WARNING" | "FAILED";
  databaseUrlProvided: boolean;
  poolMin: number;
  poolMax: number;
  connectTimeout: number;
  databaseMode: "mock" | "postgres";
  poolSettingsValid: boolean;
  errorMessage: string | null;
}

export interface PostgresValidationResult {
  status: "HEALTHY" | "WARNING" | "FAILED";
  environmentValid: boolean;
  errorMessage: string | null;
}

export interface SystemReadinessResult {
  overallStatus: "HEALTHY" | "WARNING" | "FAILED";
  repositoryValidation: RepositoryValidationResult;
  migrationValidation: MigrationValidationResult;
  connectionValidation: ConnectionValidationResult;
  environmentValidation: PostgresValidationResult;
  warnings: string[];
  recommendations: string[];
  generatedAt: string;
}
