import { PipelineStage, PipelineAuditRecord } from "../models";

export class PipelineAuditService {
  private static auditLogs: PipelineAuditRecord[] = [];

  /**
   * Log a new event in the pipeline lifecycle
   */
  static log(
    level: "INFO" | "WARNING" | "ERROR",
    event: string,
    message: string,
    stage?: PipelineStage
  ): PipelineAuditRecord {
    const record: PipelineAuditRecord = {
      timestamp: new Date().toISOString(),
      stage,
      event,
      message,
      level
    };
    this.auditLogs.unshift(record); // newest first
    console.log(`[PipelineAudit] [${level}] [${stage || "SYSTEM"}] - ${event}: ${message}`);
    return record;
  }

  /**
   * Fetch all logs recorded (with optional filter)
   */
  static getLogs(stage?: PipelineStage): PipelineAuditRecord[] {
    if (stage) {
      return this.auditLogs.filter(log => log.stage === stage);
    }
    return this.auditLogs;
  }

  /**
   * Clears audit history
   */
  static clearLogs(): void {
    this.auditLogs = [];
  }
}
