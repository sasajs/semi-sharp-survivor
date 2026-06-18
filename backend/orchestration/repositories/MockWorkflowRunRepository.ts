import { IWorkflowRunRepository } from "./WorkflowRunRepository";
import { WorkflowRun } from "../models";

export class MockWorkflowRunRepository implements IWorkflowRunRepository {
  private runs: WorkflowRun[] = [];

  async createRun(run: WorkflowRun): Promise<WorkflowRun> {
    const existing = this.runs.find(r => r.id === run.id);
    if (existing) {
      throw new Error(`Workflow run with id ${run.id} already exists`);
    }
    this.runs.push({ ...run });
    return run;
  }

  async updateRun(run: WorkflowRun): Promise<WorkflowRun> {
    const statusIdx = this.runs.findIndex(r => r.id === run.id);
    if (statusIdx === -1) {
      throw new Error(`Workflow run with id ${run.id} not found`);
    }
    this.runs[statusIdx] = { ...run };
    return run;
  }

  async getRunById(id: string): Promise<WorkflowRun | null> {
    const found = this.runs.find(r => r.id === id);
    return found ? { ...found } : null;
  }

  async getRunByIdempotencyKey(key: string): Promise<WorkflowRun | null> {
    const found = this.runs.find(r => r.idempotencyKey === key);
    return found ? { ...found } : null;
  }

  async listRuns(): Promise<WorkflowRun[]> {
    return this.runs.map(r => ({ ...r }));
  }

  async listRecentRuns(limit: number = 20): Promise<WorkflowRun[]> {
    return [...this.runs]
      .sort((a, b) => {
        const dateA = a.startedAt ? new Date(a.startedAt).getTime() : 0;
        const dateB = b.startedAt ? new Date(b.startedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, limit)
      .map(r => ({ ...r }));
  }
}

export const mockWorkflowRunRepo = new MockWorkflowRunRepository();
