import { 
  ScheduledWorkflow, 
  ScheduledWorkflowRun, 
  ScheduleStatus, 
  ScheduleTriggerType, 
  ScheduleDefinition,
  ScheduledWorkflowType
} from "../models";
import { getSchedulerRepository } from "./ScheduleAuditService";
import { ScheduleAuditService } from "./ScheduleAuditService";
import { ScheduleValidationService } from "./ScheduleValidationService";
import { WorkflowOrchestratorService } from "../../orchestration/services/WorkflowOrchestratorService";
import { WorkflowType, TriggerSource } from "../../../src/types";
import crypto from "crypto";

export class ScheduledWorkflowService {
  /**
   * Helper to calculate the next execution timestamp based on cron expression.
   * Promotes mock high-fidelity accuracy for standard weekly patterns.
   */
  static calculateNextRun(expression: string, timezone: string = "America/New_York"): Date | null {
    try {
      const parts = expression.trim().split(/\s+/);
      if (parts.length !== 5) return null;

      const [minStr, hourStr, domStr, monthStr, dowStr] = parts;
      const min = parseInt(minStr, 10) || 0;
      const hour = parseInt(hourStr, 10) || 0;
      
      const now = new Date();
      // Estimate next week's day of week
      const dayOfWeekNum = parseInt(dowStr, 10); // 0-6 (Sunday-Saturday) or 1-7 (Monday-Sunday)

      if (!isNaN(dayOfWeekNum)) {
        const targetDay = dayOfWeekNum === 7 ? 0 : dayOfWeekNum; // map 7 to Sunday
        const resultDate = new Date(now);
        resultDate.setHours(hour, min, 0, 0);

        // Find how many days to targetDay
        let daysAhead = (targetDay - now.getDay() + 7) % 7;
        if (daysAhead === 0 && now.getTime() >= resultDate.getTime()) {
          daysAhead = 7; // trigger next week if already passed today
        }
        resultDate.setDate(now.getDate() + daysAhead);
        return resultDate;
      }

      // Default relative future date helper if no day of week (e.g. every hour or daily)
      const relative = new Date(now);
      relative.setDate(now.getDate() + 1);
      relative.setHours(hour, min, 0, 0);
      return relative;
    } catch {
      return null;
    }
  }

  static async createSchedule(def: ScheduleDefinition, actor: string = "admin"): Promise<ScheduledWorkflow> {
    // 1. Validate Definition
    ScheduleValidationService.validateDefinition(def);

    const repo = getSchedulerRepository();
    const id = `sched_${crypto.randomUUID?.() || Math.random().toString(36).substring(2, 11)}`;
    const timezone = def.scheduleTimezone || "America/New_York";
    const nextRun = this.calculateNextRun(def.scheduleExpression, timezone);

    const schedule: ScheduledWorkflow = {
      id,
      name: def.name,
      description: def.description,
      workflowType: def.workflowType,
      season: def.season,
      week: def.week,
      scheduleExpression: def.scheduleExpression,
      scheduleTimezone: timezone,
      status: ScheduleStatus.ACTIVE,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastRunAt: null,
      nextRunAt: nextRun,
      metadata: def.metadata || {}
    };

    const saved = await repo.saveSchedule(schedule);
    await ScheduleAuditService.recordScheduleCreation(id, actor, def);
    return saved;
  }

  static async updateSchedule(id: string, def: Partial<ScheduleDefinition>, actor: string = "admin"): Promise<ScheduledWorkflow> {
    const repo = getSchedulerRepository();
    const existing = await repo.getScheduleById(id);
    if (!existing) {
      throw new Error(`Schedule schedule with ID: ${id} could not be resolved`);
    }

    // Validate partial changes if they are provided
    if (def.workflowType) ScheduleValidationService.validateWorkflowType(def.workflowType);
    if (def.season !== undefined || def.week !== undefined) {
      ScheduleValidationService.validateSeasonAndWeek(
        def.season ?? existing.season,
        def.week ?? existing.week
      );
    }
    if (def.scheduleExpression) {
      ScheduleValidationService.validateScheduleExpression(def.scheduleExpression);
    }

    const updated: ScheduledWorkflow = {
      ...existing,
      name: def.name !== undefined ? def.name : existing.name,
      description: def.description !== undefined ? def.description : existing.description,
      workflowType: def.workflowType !== undefined ? def.workflowType : existing.workflowType,
      season: def.season !== undefined ? def.season : existing.season,
      week: def.week !== undefined ? def.week : existing.week,
      scheduleExpression: def.scheduleExpression !== undefined ? def.scheduleExpression : existing.scheduleExpression,
      scheduleTimezone: def.scheduleTimezone !== undefined ? def.scheduleTimezone : existing.scheduleTimezone,
      updatedAt: new Date(),
      metadata: def.metadata !== undefined ? { ...existing.metadata, ...def.metadata } : existing.metadata
    };

    // Re-calculate next run if expression changes
    if (def.scheduleExpression || def.scheduleTimezone) {
      updated.nextRunAt = this.calculateNextRun(updated.scheduleExpression, updated.scheduleTimezone);
    }

    const saved = await repo.saveSchedule(updated);
    await ScheduleAuditService.recordScheduleUpdate(id, actor, { updated_fields: def });
    return saved;
  }

  static async enableSchedule(id: string, actor: string = "admin"): Promise<ScheduledWorkflow> {
    const repo = getSchedulerRepository();
    const existing = await repo.getScheduleById(id);
    if (!existing) {
      throw new Error(`Schedule with ID: ${id} not found`);
    }

    const updated: ScheduledWorkflow = {
      ...existing,
      enabled: true,
      status: ScheduleStatus.ACTIVE,
      nextRunAt: this.calculateNextRun(existing.scheduleExpression, existing.scheduleTimezone),
      updatedAt: new Date()
    };

    const saved = await repo.saveSchedule(updated);
    await ScheduleAuditService.recordScheduleUpdate(id, actor, { enabled: true, status: ScheduleStatus.ACTIVE });
    return saved;
  }

  static async disableSchedule(id: string, actor: string = "admin"): Promise<ScheduledWorkflow> {
    const repo = getSchedulerRepository();
    const existing = await repo.getScheduleById(id);
    if (!existing) {
      throw new Error(`Schedule with ID: ${id} not found`);
    }

    const updated: ScheduledWorkflow = {
      ...existing,
      enabled: false,
      status: ScheduleStatus.DISABLED,
      nextRunAt: null,
      updatedAt: new Date()
    };

    const saved = await repo.saveSchedule(updated);
    await ScheduleAuditService.recordScheduleUpdate(id, actor, { enabled: false, status: ScheduleStatus.DISABLED });
    return saved;
  }

  static async pauseSchedule(id: string, actor: string = "admin"): Promise<ScheduledWorkflow> {
    const repo = getSchedulerRepository();
    const existing = await repo.getScheduleById(id);
    if (!existing) {
      throw new Error(`Schedule with ID: ${id} not found`);
    }

    const updated: ScheduledWorkflow = {
      ...existing,
      status: ScheduleStatus.PAUSED,
      nextRunAt: null,
      updatedAt: new Date()
    };

    const saved = await repo.saveSchedule(updated);
    await ScheduleAuditService.recordScheduleUpdate(id, actor, { status: ScheduleStatus.PAUSED });
    return saved;
  }

  static async listSchedules(): Promise<ScheduledWorkflow[]> {
    const repo = getSchedulerRepository();
    return repo.listSchedules();
  }

  static async getSchedule(id: string): Promise<ScheduledWorkflow> {
    const repo = getSchedulerRepository();
    const existing = await repo.getScheduleById(id);
    if (!existing) {
      throw new Error(`Schedule with ID: ${id} not found`);
    }
    return existing;
  }

  static async triggerScheduleManually(id: string, actor: string = "admin"): Promise<ScheduledWorkflowRun> {
    ScheduleValidationService.validateTriggerRequest(id);

    const repo = getSchedulerRepository();
    const schedule = await repo.getScheduleById(id);
    if (!schedule) {
      throw new Error(`Schedule with ID: ${id} not found`);
    }

    try {
      // Execute the workflow via WorkflowOrchestratorService asynchronously/synchronously
      const execReq = {
        workflowType: schedule.workflowType as unknown as WorkflowType,
        season: schedule.season,
        week: schedule.week,
        requestedBy: actor,
        triggerSource: TriggerSource.manual,
        force: true
      };

      const workflowRun = await WorkflowOrchestratorService.startWorkflowExecution(execReq);

      // Create scheduled workflow run log linked to workflowRunId
      const runId = `run_sch_${crypto.randomUUID?.() || Math.random().toString(36).substring(2, 11)}`;
      const scheduledRun: ScheduledWorkflowRun = {
        id: runId,
        scheduledWorkflowId: schedule.id,
        workflowRunId: workflowRun.id,
        triggerType: ScheduleTriggerType.manual,
        status: "running",
        startedAt: new Date(),
        completedAt: null,
        errorMessage: null,
        metadata: {
          idempotency_key: workflowRun.idempotencyKey,
          target_contest_week: `Season ${schedule.season} Wk ${schedule.week}`
        }
      };

      // Update schedule runtime indicators
      schedule.lastRunAt = new Date();
      schedule.nextRunAt = this.calculateNextRun(schedule.scheduleExpression, schedule.scheduleTimezone);
      schedule.updatedAt = new Date();

      await repo.saveSchedule(schedule);
      const savedRun = await repo.saveRun(scheduledRun);

      // Audit Successful dispatch
      await ScheduleAuditService.recordManualTrigger(schedule.id, actor, workflowRun.id);

      return savedRun;
    } catch (err: any) {
      // Audit failure logging
      await ScheduleAuditService.recordFailedTrigger(schedule.id, actor, err.message || "Unknown error executing manual run");
      throw err;
    }
  }

  static async listScheduledRuns(scheduleId?: string): Promise<ScheduledWorkflowRun[]> {
    const repo = getSchedulerRepository();
    if (scheduleId) {
      return repo.listRunsByScheduleId(scheduleId);
    }
    return repo.listAllRuns();
  }
}
