import { WorkflowRun } from "../models";

export interface IWorkflowRunRepository {
  createRun(run: WorkflowRun): Promise<WorkflowRun>;
  updateRun(run: WorkflowRun): Promise<WorkflowRun>;
  getRunById(id: string): Promise<WorkflowRun | null>;
  getRunByIdempotencyKey(key: string): Promise<WorkflowRun | null>;
  listRuns(): Promise<WorkflowRun[]>;
  listRecentRuns(limit?: number): Promise<WorkflowRun[]>;
}
