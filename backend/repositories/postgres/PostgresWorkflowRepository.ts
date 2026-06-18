import { WorkflowRun, WorkflowStep } from "../../../src/types";
import { query } from "../../database/connection/PostgresConnectionManager";
import { IWorkflowRunRepository } from "../../orchestration/repositories/WorkflowRunRepository";

function mapWorkflowStep(row: any): WorkflowStep {
  return {
    name: row.step_name,
    status: row.status as any,
    startedAt: row.started_at ? new Date(row.started_at).toISOString() : null,
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
    inputHash: row.input_hash || "",
    outputHash: row.output_hash || "",
    errorMessage: row.error_message || null,
    metadata: row.metadata_json || {}
  };
}

function mapWorkflowRun(row: any, steps: WorkflowStep[] = []): WorkflowRun {
  return {
    id: row.id,
    workflowType: row.workflow_type as any,
    season: Number(row.season),
    week: Number(row.week),
    status: row.status as any,
    requestedBy: row.requested_by || "",
    triggerSource: row.trigger_source as any,
    idempotencyKey: row.idempotency_key || "",
    dataVersion: Number(row.data_version || 0),
    featureVersion: Number(row.feature_version || 0),
    inventoryVersion: Number(row.inventory_version || 0),
    riskVersion: Number(row.risk_version || 0),
    recommendationVersion: Number(row.recommendation_version || 0),
    simulationVersion: Number(row.simulation_version || 0),
    policyVersion: Number(row.policy_version || 0),
    modelVersion: row.model_version || "",
    startedAt: row.started_at ? new Date(row.started_at).toISOString() : null,
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
    errorMessage: row.error_message || null,
    metadata: row.metadata_json || {},
    steps
  };
}

export class PostgresWorkflowRepository implements IWorkflowRunRepository {
  
  private async loadStepsForRun(runId: string): Promise<WorkflowStep[]> {
    const rows = await query("SELECT * FROM workflow_steps WHERE workflow_run_id = $1 ORDER BY started_at ASC", [runId]);
    return rows.map(mapWorkflowStep);
  }

  private async saveSteps(runId: string, steps: WorkflowStep[]): Promise<void> {
    for (const step of steps) {
      const databaseStepId = `${runId}-${step.name}`;
      await query(
        `INSERT INTO workflow_steps (id, workflow_run_id, step_name, status, started_at, completed_at, input_hash, output_hash, error_message, metadata_json)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           completed_at = EXCLUDED.completed_at,
           output_hash = EXCLUDED.output_hash,
           error_message = EXCLUDED.error_message,
           metadata_json = EXCLUDED.metadata_json`,
        [
          databaseStepId,
          runId,
          step.name,
          step.status,
          step.startedAt ? new Date(step.startedAt) : new Date(),
          step.completedAt ? new Date(step.completedAt) : null,
          step.inputHash || null,
          step.outputHash || null,
          step.errorMessage || null,
          JSON.stringify(step.metadata || {})
        ]
      );
    }
  }

  async createRun(run: WorkflowRun): Promise<WorkflowRun> {
    await query(
      `INSERT INTO workflow_runs (
        id, workflow_type, season, week, status, requested_by, trigger_source, idempotency_key,
        data_version, feature_version, inventory_version, risk_version, recommendation_version, 
        simulation_version, policy_version, model_version, started_at, completed_at, error_message, metadata_json
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
      [
        run.id,
        run.workflowType,
        Number(run.season || 2026),
        run.week,
        run.status,
        run.requestedBy || null,
        run.triggerSource,
        run.idempotencyKey || null,
        String(run.dataVersion || 0),
        String(run.featureVersion || 0),
        String(run.inventoryVersion || 0),
        String(run.riskVersion || 0),
        String(run.recommendationVersion || 0),
        String(run.simulationVersion || 0),
        String(run.policyVersion || 0),
        run.modelVersion || "",
        run.startedAt ? new Date(run.startedAt) : new Date(),
        run.completedAt ? new Date(run.completedAt) : null,
        run.errorMessage || null,
        JSON.stringify(run.metadata || {})
      ]
    );

    if (run.steps && run.steps.length > 0) {
      await this.saveSteps(run.id, run.steps);
    }

    return run;
  }

  async updateRun(run: WorkflowRun): Promise<WorkflowRun> {
    await query(
      `UPDATE workflow_runs SET
        status = $1,
        completed_at = $2,
        error_message = $3,
        metadata_json = $4
       WHERE id = $5`,
      [
        run.status,
        run.completedAt ? new Date(run.completedAt) : null,
        run.errorMessage || null,
        JSON.stringify(run.metadata || {}),
        run.id
      ]
    );

    if (run.steps && run.steps.length > 0) {
      await this.saveSteps(run.id, run.steps);
    }

    return run;
  }

  async getRunById(id: string): Promise<WorkflowRun | null> {
    const rows = await query("SELECT * FROM workflow_runs WHERE id = $1 LIMIT 1", [id]);
    if (rows.length === 0) return null;
    
    const steps = await this.loadStepsForRun(id);
    return mapWorkflowRun(rows[0], steps);
  }

  async getRunByIdempotencyKey(key: string): Promise<WorkflowRun | null> {
    const rows = await query("SELECT * FROM workflow_runs WHERE idempotency_key = $1 LIMIT 1", [key]);
    if (rows.length === 0) return null;

    const steps = await this.loadStepsForRun(rows[0].id);
    return mapWorkflowRun(rows[0], steps);
  }

  async listRuns(): Promise<WorkflowRun[]> {
    const rows = await query("SELECT * FROM workflow_runs ORDER BY started_at DESC");
    const results: WorkflowRun[] = [];
    for (const row of rows) {
      const steps = await this.loadStepsForRun(row.id);
      results.push(mapWorkflowRun(row, steps));
    }
    return results;
  }

  async listRecentRuns(limit = 10): Promise<WorkflowRun[]> {
    const rows = await query("SELECT * FROM workflow_runs ORDER BY started_at DESC LIMIT $1", [limit]);
    const results: WorkflowRun[] = [];
    for (const row of rows) {
      const steps = await this.loadStepsForRun(row.id);
      results.push(mapWorkflowRun(row, steps));
    }
    return results;
  }
}
