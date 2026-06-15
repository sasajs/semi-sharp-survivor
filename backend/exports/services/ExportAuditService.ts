import crypto from "crypto";
import { ExportAuditMetadata, WeeklyReport } from "../models";

export class ExportAuditService {
  static createExportHash(
    reportId: string,
    format: string,
    payloadString: string
  ): string {
    const raw = JSON.stringify({
      report_id: reportId,
      format,
      payload: payloadString
    });
    return crypto.createHash("sha256").update(raw).digest("hex");
  }

  static attachExportAuditMetadata(
    report: WeeklyReport,
    exportHash: string
  ): ExportAuditMetadata {
    const rAudit: any = report.audit_metadata || {};

    return {
      export_version: 1,
      report_version: rAudit.report_version || 1,
      data_version: rAudit.data_version || 1,
      feature_version: rAudit.feature_version || 1,
      inventory_version: rAudit.inventory_version || 1,
      risk_version: rAudit.risk_version || 1,
      recommendation_version: rAudit.recommendation_version || 1,
      simulation_version: rAudit.simulation_version || 1,
      policy_version: rAudit.policy_version || 1,
      model_version: rAudit.model_version || "gemini-3.5-flash-v1",
      generated_at: new Date().toISOString(),
      report_hash: rAudit.report_hash || "",
      export_hash: exportHash
    };
  }

  static validateExportReproducibility(
    reportId: string,
    format: string,
    payloadString: string,
    expectedHash: string
  ): boolean {
    const freshHash = this.createExportHash(reportId, format, payloadString);
    return freshHash === expectedHash;
  }
}
