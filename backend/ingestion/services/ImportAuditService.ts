import { ImportAuditMetadata, ImportRun, ImportStatus, ImportType } from "../models";

export class ImportAuditService {
  static buildAuditMetadata(
    processedBy: string = "web_admin_dashboard",
    validationIssues: number = 0,
    connectionSuccess: boolean = true,
    customTrace?: Record<string, any>
  ): ImportAuditMetadata {
    return {
      processedBy,
      validationIssuesCount: validationIssues,
      connectionSuccess,
      systemFingerprint: `node_v20_${process.platform || "linux"}`,
      customTrace
    };
  }

  static recordImportStart(
    runId: string,
    jobId: string,
    type: ImportType,
    actor: string = "admin"
  ): ImportRun {
    return {
      id: runId,
      jobId,
      importType: type,
      status: ImportStatus.RUNNING,
      startedAt: new Date(),
      completedAt: null,
      recordsProcessed: 0,
      recordsImported: 0,
      recordsRejected: 0,
      errorMessage: null,
      auditMetadata: this.buildAuditMetadata(actor, 0, true)
    };
  }

  static recordImportSuccess(
    activeRun: ImportRun,
    processed: number,
    imported: number,
    rejected: number,
    actor: string = "admin"
  ): ImportRun {
    return {
      ...activeRun,
      status: rejected > 0 ? ImportStatus.PARTIAL_SUCCESS : ImportStatus.SUCCEEDED,
      completedAt: new Date(),
      recordsProcessed: processed,
      recordsImported: imported,
      recordsRejected: rejected,
      auditMetadata: this.buildAuditMetadata(actor, rejected, true)
    };
  }

  static recordImportFailure(
    activeRun: ImportRun,
    errorMessage: string,
    actor: string = "admin"
  ): ImportRun {
    return {
      ...activeRun,
      status: ImportStatus.FAILED,
      completedAt: new Date(),
      errorMessage,
      auditMetadata: this.buildAuditMetadata(actor, 1, false, { errorTrace: errorMessage })
    };
  }

  static recordValidationFailure(
    activeRun: ImportRun,
    validationError: string,
    actor: string = "admin"
  ): ImportRun {
    return {
      ...activeRun,
      status: ImportStatus.FAILED,
      completedAt: new Date(),
      errorMessage: `Validation failed: ${validationError}`,
      auditMetadata: this.buildAuditMetadata(actor, 1, true, { validationError })
    };
  }
}
