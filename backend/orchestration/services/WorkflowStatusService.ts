import { workflowRunRepo } from "../../repositories";
import { WorkflowRun, WorkflowStatus } from "../models";

export class WorkflowStatusService {
  /**
   * Retrieves status and current completed steps count for a given workflow identifier.
   */
  static async lookupWorkflowStatus(runId: string): Promise<{
    id: string;
    status: WorkflowStatus;
    completedSteps: number;
    totalSteps: number;
    errorMessage: string | null;
  } | null> {
    const run = await workflowRunRepo.getRunById(runId);
    if (!run) return null;

    const completed = run.steps.filter(s => s.status === WorkflowStatus.SUCCEEDED).length;
    return {
      id: run.id,
      status: run.status,
      completedSteps: completed,
      totalSteps: run.steps.length,
      errorMessage: run.errorMessage
    };
  }

  /**
   * Lists the most recent workflow execution runs globally.
   */
  static async listRecentWorkflowRuns(limit?: number): Promise<WorkflowRun[]> {
    return workflowRunRepo.listRecentRuns(limit);
  }

  /**
   * Returns whole raw workflow history.
   */
  static async getWorkflowHistory(): Promise<WorkflowRun[]> {
    return workflowRunRepo.listRuns();
  }

  /**
   * Generates analytical summary dictionary of successful/failed statistics across historical workflows.
   */
  static async getWorkflowExecutionSummaries(): Promise<{
    totalRuns: number;
    succeededCount: number;
    failedCount: number;
    runningCount: number;
    averageDurationSeconds: number;
  }> {
    const runs = await workflowRunRepo.listRuns();
    const totals = runs.length;
    const succeeded = runs.filter(r => r.status === WorkflowStatus.SUCCEEDED).length;
    const failed = runs.filter(r => r.status === WorkflowStatus.FAILED).length;
    const running = runs.filter(r => r.status === WorkflowStatus.RUNNING).length;

    let summedSeconds = 0;
    let countsWithTimes = 0;
    for (const r of runs) {
      if (r.startedAt && r.completedAt) {
        const diffMs = new Date(r.completedAt).getTime() - new Date(r.startedAt).getTime();
        summedSeconds += Math.max(0, diffMs / 1000);
        countsWithTimes++;
      }
    }

    const avg = countsWithTimes > 0 ? Number((summedSeconds / countsWithTimes).toFixed(1)) : 0;

    return {
      totalRuns: totals,
      succeededCount: succeeded,
      failedCount: failed,
      runningCount: running,
      averageDurationSeconds: avg
    };
  }
}
