import { ImportType, DataSource, ImportJob, ImportValidationResult } from "../models";

export class ImportValidationService {
  private static VALID_IMPORT_TYPES: Set<ImportType> = new Set([
    ImportType.SCHEDULE,
    ImportType.TEAM,
    ImportType.INJURY,
    ImportType.LINE,
    ImportType.WEATHER,
    ImportType.CUSTOM
  ]);

  static validateImportType(type: any): void {
    if (!type) {
      throw new Error("Import type is required for ingestion setup validation");
    }
    if (!this.VALID_IMPORT_TYPES.has(type)) {
      throw new Error(`Invalid Ingestion Import Type: ${type}. Must be one of SCHEDULE, TEAM, INJURY, LINE, WEATHER, CUSTOM`);
    }
  }

  static validateSource(source: DataSource): void {
    if (!source) {
      throw new Error("Data Source parameter context is empty or uninitialized");
    }
    if (!source.id || typeof source.id !== "string" || !source.id.trim()) {
      throw new Error("Data Source must include a unique string identifier");
    }
    if (!source.name || typeof source.name !== "string" || !source.name.trim()) {
      throw new Error("Data Source label/name cannot be blank");
    }
    if (!source.adapterType || typeof source.adapterType !== "string" || !source.adapterType.trim()) {
      throw new Error("Data Source must bind to a registered adapter driverType identifier");
    }
  }

  static validateJob(job: ImportJob): void {
    if (!job) {
      throw new Error("Import Job context is empty or undefined");
    }
    if (!job.id || typeof job.id !== "string" || !job.id.trim()) {
      throw new Error("Import Job must include a valid alphanumeric identifier");
    }
    if (!job.name || typeof job.name !== "string" || !job.name.trim()) {
      throw new Error("Import Job task name/title cannot be blank");
    }
    this.validateImportType(job.importType);
    if (!job.sourceId || typeof job.sourceId !== "string" || !job.sourceId.trim()) {
      throw new Error("Import Job must reference a parent DataSource provider ID");
    }
  }

  static validatePayload(payload: any[]): ImportValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!payload || !Array.isArray(payload)) {
      errors.push("Payload must be structured as a valid JSON array");
    } else if (payload.length === 0) {
      warnings.push("Input data array has 0 lineitems");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateImportRequest(job: ImportJob, source: DataSource): void {
    this.validateJob(job);
    this.validateSource(source);
    if (job.sourceId !== source.id) {
      throw new Error(`Mismatched reference parameters: Job references source: ${job.sourceId}, but source ID is: ${source.id}`);
    }
    if (!source.enabled) {
      throw new Error(`Validation Error: Target Data Source provider (${source.id}) is state-disabled`);
    }
    if (!job.enabled) {
      throw new Error(`Validation Error: Core Data Ingestion Job (${job.id}) is state-disabled`);
    }
  }
}
