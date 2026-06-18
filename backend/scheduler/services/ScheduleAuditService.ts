import { ScheduleAuditMetadata } from "../models";
import { MockScheduledWorkflowRepository } from "../repositories/MockScheduledWorkflowRepository";
import { IScheduledWorkflowRepository } from "../repositories/ScheduledWorkflowRepository";
import crypto from "crypto";

// Singleton / locator pattern to change implementations as required in the future without service changes.
let activeRepository: IScheduledWorkflowRepository = new MockScheduledWorkflowRepository();

export function getSchedulerRepository(): IScheduledWorkflowRepository {
  return activeRepository;
}

export function setSchedulerRepository(repo: IScheduledWorkflowRepository): void {
  activeRepository = repo;
}

export class ScheduleAuditService {
  /**
   * Helper to write logs or generate standard audit tracking records.
   */
  private static async createAudit(
    scheduleId: string,
    action: string,
    actor: string,
    changes: Record<string, any>,
    metadata: Record<string, any> = {}
  ): Promise<ScheduleAuditMetadata> {
    const repo = getSchedulerRepository();
    const audit: ScheduleAuditMetadata = {
      id: `audit_${crypto.randomUUID?.() || Math.random().toString(36).substring(2, 11)}`,
      scheduleId,
      action,
      actor,
      timestamp: new Date(),
      changes,
      metadata
    };
    return repo.saveAudit(audit);
  }

  static async recordScheduleCreation(scheduleId: string, actor: string, initialData: any): Promise<ScheduleAuditMetadata> {
    return this.createAudit(scheduleId, "CREATE", actor, { current: initialData });
  }

  static async recordScheduleUpdate(scheduleId: string, actor: string, changes: any): Promise<ScheduleAuditMetadata> {
    return this.createAudit(scheduleId, "UPDATE", actor, changes);
  }

  static async recordManualTrigger(scheduleId: string, actor: string, runId: string): Promise<ScheduleAuditMetadata> {
    return this.createAudit(scheduleId, "TRIGGER_MANUAL", actor, { runId });
  }

  static async recordFailedTrigger(scheduleId: string, actor: string, errorMessage: string): Promise<ScheduleAuditMetadata> {
    return this.createAudit(scheduleId, "TRIGGER_FAILED", actor, { errorMessage });
  }
}
