import { ImportValidationResult, ImportResult, ImportType } from "../models";

export interface IAdapter {
  type: string;
  name: string;
  description: string;
  supportedType: ImportType;

  validateConnection(): Promise<boolean>;
  fetchData(params?: Record<string, any>): Promise<any[]>;
  transform(rawItems: any[]): Promise<any[]>;
  validatePayload(payload: any[]): Promise<ImportValidationResult>;
  buildImportResult(runId: string, processed: number, imported: number, rejected: number, message?: string, errors?: string[]): Promise<ImportResult>;
}

export abstract class BaseAdapter implements IAdapter {
  abstract type: string;
  abstract name: string;
  abstract description: string;
  abstract supportedType: ImportType;

  async validateConnection(): Promise<boolean> {
    // Mock successful verification
    return true;
  }

  abstract fetchData(params?: Record<string, any>): Promise<any[]>;
  abstract transform(rawItems: any[]): Promise<any[]>;

  async validatePayload(payload: any[]): Promise<ImportValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!payload || !Array.isArray(payload)) {
      errors.push("Payload must be a non-empty array of items");
    } else if (payload.length === 0) {
      warnings.push("Payload is completely empty");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async buildImportResult(
    runId: string,
    processed: number,
    imported: number,
    rejected: number,
    message: string | null = null,
    errors: string[] = []
  ): Promise<ImportResult> {
    return {
      runId,
      success: errors.length === 0 && rejected === 0,
      recordsProcessed: processed,
      recordsImported: imported,
      recordsRejected: rejected,
      message,
      errors
    };
  }
}
