import crypto from "crypto";
import { WeeklyReportAuditMetadata, WeeklyReport } from "../models";
import { VersionTrackingService } from "../../history/services/versionTrackingService";

export class ReportAuditService {
  static createReportHash(reportData: Partial<WeeklyReport>): string {
    const raw = JSON.stringify({
      contest_id: reportData.contest_id,
      contest_leg_id: reportData.contest_leg_id,
      week_number: reportData.week_number,
      executive_summary: reportData.executive_summary,
      recommended_picks: reportData.recommended_picks,
      risk_summary: reportData.risk_summary,
      inventory_summary: reportData.inventory_summary
    });
    return crypto.createHash("sha256").update(raw).digest("hex");
  }

  static attachAuditMetadata(legId: string, reportHash: string): WeeklyReportAuditMetadata {
    const versions = VersionTrackingService.getVersionsForLeg(legId);

    return {
      report_version: 1,
      data_version: versions.data_version,
      feature_version: versions.data_version,
      inventory_version: versions.inventory_version,
      risk_version: versions.risk_version,
      recommendation_version: versions.recommendation_version,
      simulation_version: 1,
      policy_version: 1,
      model_version: "gemini-3.5-flash-v1",
      generated_at: new Date().toISOString(),
      report_hash: reportHash
    };
  }

  static validateReportReproducibility(report: WeeklyReport): boolean {
    const freshHash = this.createReportHash(report);
    return freshHash === report.audit_metadata.report_hash;
  }
}
