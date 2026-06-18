import { DecisionAuditRecord } from "../models";
import { auditRepo } from "../../repositories";
import { VersionTrackingService } from "./versionTrackingService";

export class AuditTrailService {
  /**
   * Commits a new DecisionAuditRecord based on compiled snapshot references.
   */
  static async commitAuditRecord(inputs: {
    contestId: string;
    contestLegId: string;
    weekNumber: number;
    recommendationSnapshotId: string;
    weeklySnapshotId: string;
    inventorySnapshotId: string;
    riskSnapshotId: string;
    featureSnapshotId: string;
    calculationVersions?: Record<string, number>;
  }): Promise<DecisionAuditRecord> {
    const {
      contestId,
      contestLegId,
      weekNumber,
      recommendationSnapshotId,
      weeklySnapshotId,
      inventorySnapshotId,
      riskSnapshotId,
      featureSnapshotId,
      calculationVersions = {
        equity_utility_v: 1,
        leverage_v: 1,
        risk_risk_v: 1
      }
    } = inputs;

    const versions = VersionTrackingService.getVersionsForLeg(contestLegId);

    const record: DecisionAuditRecord = {
      id: `audit-${contestLegId}-${Date.now()}`,
      contest_id: contestId,
      contest_leg_id: contestLegId,
      week_number: weekNumber,
      recommendation_snapshot_id: recommendationSnapshotId,
      weekly_snapshot_id: weeklySnapshotId,
      inventory_snapshot_id: inventorySnapshotId,
      risk_snapshot_id: riskSnapshotId,
      feature_snapshot_id: featureSnapshotId,
      source_versions: {
        data_version: versions.data_version,
        feature_version: versions.feature_version,
        inventory_version: versions.inventory_version,
        risk_version: versions.risk_version,
        recommendation_version: versions.recommendation_version,
        policy_version: versions.policy_version
      },
      calculation_versions: calculationVersions,
      generated_at: new Date().toISOString(),
      snapshot_created_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    return await auditRepo.save(record);
  }

  /**
   * Fetches the complete audit log for decision compliance.
   */
  static async getAuditsByLeg(legId: string): Promise<DecisionAuditRecord | null> {
    return await auditRepo.getAuditByLeg(legId);
  }

  /**
   * Fetches audits filtered by week number.
   */
  static async getAuditsByWeek(weekNumber: number): Promise<DecisionAuditRecord[]> {
    return await auditRepo.getAuditsByWeek(weekNumber);
  }

  /**
   * Returns whole audit history trail.
   */
  static async getAllAudits(): Promise<DecisionAuditRecord[]> {
    return await auditRepo.getAllAudits();
  }
}
