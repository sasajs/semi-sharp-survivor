import crypto from "crypto";
import { 
  WorkflowRun, 
  WorkflowStep, 
  WorkflowStatus, 
  WorkflowType, 
  WorkflowExecutionRequest, 
  TriggerSource 
} from "../models";
import { workflowRunRepo } from "../../repositories";
import { WorkflowRunnerService } from "./WorkflowRunnerService";
import { WorkflowAuditService } from "./WorkflowAuditService";

export class WorkflowOrchestratorService {
  private static readonly PREDEFINED_STEPS = [
    "DATA_IMPORT",
    "FEATURE_STORE_REFRESH",
    "INVENTORY_CALCULATION",
    "RISK_CALCULATION",
    "RECOMMENDATION_GENERATION",
    "MONTE_CARLO_SIMULATION",
    "WEEKLY_REPORT_GENERATION",
    "RESEARCH_EXPORT_GENERATION"
  ];

  /**
   * Safe execution entry point. Ensures robust validation, idempotency enforcement,
   * prevents duplicate runs, and begins sequential processing.
   */
  static async startWorkflowExecution(
    request: WorkflowExecutionRequest
  ): Promise<WorkflowRun> {
    // 1. Validate Execution Request
    this.validateRequest(request);

    // Default versions (can be fetched/configured dynamically under Postgres)
    const verConfig = {
      dataVersion: 1,
      featureVersion: 1,
      inventoryVersion: 1,
      riskVersion: 1,
      recommendationVersion: 1,
      simulationVersion: 1,
      policyVersion: 1,
      modelVersion: "gemini-3.5-flash-v1"
    };

    // 2. Generate Deterministic Idempotency Key
    const idempotencyKey = this.generateIdempotencyKey(request, verConfig);

    // 3. Prevent Duplicate Executions unless force flag is explicitly requested
    if (!request.force) {
      const existing = await workflowRunRepo.getRunByIdempotencyKey(idempotencyKey);
      if (existing) {
        console.log(`[Workflow Engine] Deterministic idempotency match hit. Returning existing run: ${existing.id}`);
        return existing;
      }
    }

    // 4. Initialize clean Workflow Run and step maps
    const runId = `wfrun-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    const steps: WorkflowStep[] = this.PREDEFINED_STEPS.map(stepName => ({
      name: stepName,
      status: WorkflowStatus.PENDING,
      startedAt: null,
      completedAt: null,
      inputHash: "",
      outputHash: "",
      errorMessage: null,
      metadata: {}
    }));

    const workflowRun: WorkflowRun = {
      id: runId,
      workflowType: request.workflowType,
      season: request.season,
      week: request.week,
      status: WorkflowStatus.PENDING,
      requestedBy: request.requestedBy,
      triggerSource: request.triggerSource,
      idempotencyKey,
      ...verConfig,
      startedAt: null,
      completedAt: null,
      errorMessage: null,
      steps,
      metadata: {
        force_run: !!request.force,
        requested_at: new Date().toISOString()
      }
    };

    // Create run registry
    await workflowRunRepo.createRun(workflowRun);

    // 5. Fire off runner asynchronously to keep the main event-loop non-blocking
    // and prevent Gateway Client timeouts.
    this.runAsync(runId);

    // Return the initial state which can be polled/inspected
    return workflowRun;
  }

  /**
   * Runs the runner in the background without waiting.
   */
  private static async runAsync(runId: string): Promise<void> {
    try {
      await WorkflowRunnerService.executeWorkflow(runId);
    } catch (err) {
      console.error(`[Workflow Engine] Fatal background running error on run ${runId}:`, err);
    }
  }

  /**
   * Generates deterministic robust execution key.
   */
  static generateIdempotencyKey(request: WorkflowExecutionRequest, versions: any): string {
    const raw = `${request.workflowType}_s${request.season}_w${request.week}_d${versions.dataVersion}_m${versions.modelVersion}_p${versions.policyVersion}`;
    return crypto.createHash("sha256").update(raw).digest("hex");
  }

  /**
   * Validates correctness of parameters before registering a thread.
   */
  private static validateRequest(request: WorkflowExecutionRequest): void {
    if (!request.workflowType) {
      throw new Error("Missing workflowType.");
    }
    if (!request.season) {
      throw new Error("Missing season attribute.");
    }
    if (typeof request.week !== "number" || request.week < 1 || request.week > 18) {
      throw new Error("Week has to be an NFL regular season index (usually 1-18).");
    }
    if (!request.requestedBy) {
      throw new Error("Missing request owner identification.");
    }
    if (!request.triggerSource) {
      throw new Error("Missing triggerSource.");
    }
  }
}
