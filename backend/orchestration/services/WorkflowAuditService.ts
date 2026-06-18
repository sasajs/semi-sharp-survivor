import crypto from "crypto";
import { WorkflowRun, WorkflowAuditMetadata, TriggerSource } from "../models";

export class WorkflowAuditService {
  /**
   * Generates standard robust workflow audit metadata matching system configuration parameters.
   */
  static createWorkflowAuditMetadata(
    run: Partial<WorkflowRun> & {
      requestedBy: string;
      triggerSource: TriggerSource;
    }
  ): WorkflowAuditMetadata {
    return {
      applicationVersion: "v2.0.0-production",
      dataVersion: run.dataVersion ?? 1,
      featureVersion: run.featureVersion ?? 1,
      inventoryVersion: run.inventoryVersion ?? 1,
      riskVersion: run.riskVersion ?? 1,
      recommendationVersion: run.recommendationVersion ?? 1,
      simulationVersion: run.simulationVersion ?? 1,
      policyVersion: run.policyVersion ?? 1,
      modelVersion: run.modelVersion ?? "gemini-3.5-flash-v1",
      requestedBy: run.requestedBy,
      triggerSource: run.triggerSource,
      createdAt: new Date().toISOString(),
      startedAt: run.startedAt ?? null,
      completedAt: run.completedAt ?? null
    };
  }

  /**
   * Creates a unique cryptographic signature representing a frozen execution path of steps and status.
   */
  static createExecutionHash(run: WorkflowRun): string {
    const rawData = {
      id: run.id,
      workflowType: run.workflowType,
      season: run.season,
      week: run.week,
      status: run.status,
      idempotencyKey: run.idempotencyKey,
      versions: {
        data: run.dataVersion,
        feature: run.featureVersion,
        inv: run.inventoryVersion,
        risk: run.riskVersion,
        rec: run.recommendationVersion,
        sim: run.simulationVersion,
        policy: run.policyVersion,
        model: run.modelVersion
      },
      steps: run.steps.map(s => ({
        name: s.name,
        status: s.status,
        inputHash: s.inputHash,
        outputHash: s.outputHash
      }))
    };

    return crypto.createHash("sha256").update(JSON.stringify(rawData)).digest("hex");
  }

  /**
   * Validates whether a previous execution audit record remains perfectly deterministic and reproducible.
   */
  static validateReproducibility(run: WorkflowRun, expectedHash: string): boolean {
    const freshHash = this.createExecutionHash(run);
    return freshHash === expectedHash;
  }
}
