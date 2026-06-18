import { IScheduledWorkflowRepository } from "./ScheduledWorkflowRepository";
import { 
  ScheduledWorkflow, 
  ScheduledWorkflowRun, 
  ScheduleAuditMetadata,
  ScheduleStatus
} from "../models";

export class MockScheduledWorkflowRepository implements IScheduledWorkflowRepository {
  private static schedules: ScheduledWorkflow[] = [
    {
      id: "sched_full_weekly_01",
      name: "Weekly Monday Simulation Pipeline",
      description: "Triggers full Monte Carlo simulation and weekly recommendation synthesis every Monday morning.",
      workflowType: "FULL_WEEKLY_RESEARCH",
      season: "2026",
      week: 1,
      scheduleExpression: "0 4 * * 1",
      scheduleTimezone: "America/New_York",
      status: ScheduleStatus.ACTIVE,
      enabled: true,
      createdAt: new Date("2026-06-01T08:00:00Z"),
      updatedAt: new Date("2026-06-01T08:00:00Z"),
      lastRunAt: new Date("2026-06-15T04:00:00Z"),
      nextRunAt: new Date("2026-06-22T04:00:00Z"),
      metadata: { auto_publish: true, strategy_profile: "safe" }
    },
    {
      id: "sched_import_01",
      name: "Weekly Data Import Sync",
      description: "Imports NFL line-ups, injured lists, and lines for next-week match prediction updates.",
      workflowType: "IMPORT_ONLY",
      season: "2026",
      week: 1,
      scheduleExpression: "0 2 * * 2",
      scheduleTimezone: "America/New_York",
      status: ScheduleStatus.PAUSED,
      enabled: false,
      createdAt: new Date("2026-06-02T10:00:00Z"),
      updatedAt: new Date("2026-06-02T10:00:00Z"),
      lastRunAt: null,
      nextRunAt: null,
      metadata: { force_empty_pools: false }
    },
    {
      id: "sched_export_01",
      name: "Post-Week DOCX Export Compiler",
      description: "Automatically formats, styles and bundles research PDFs and docx artifacts for final week delivery.",
      workflowType: "EXPORT_ONLY",
      season: "2026",
      week: 2,
      scheduleExpression: "0 10 * * 2",
      scheduleTimezone: "America/New_York",
      status: ScheduleStatus.DISABLED,
      enabled: false,
      createdAt: new Date("2026-06-03T11:00:00Z"),
      updatedAt: new Date("2026-06-03T11:00:00Z"),
      lastRunAt: null,
      nextRunAt: null,
      metadata: {}
    }
  ];

  private static runs: ScheduledWorkflowRun[] = [
    {
      id: "run_s_01",
      scheduledWorkflowId: "sched_full_weekly_01",
      workflowRunId: "w_run_historic_99",
      triggerType: "manual" as any,
      status: "completed",
      startedAt: new Date("2026-06-15T04:00:00Z"),
      completedAt: new Date("2026-06-15T04:01:12Z"),
      errorMessage: null,
      metadata: { triggerActor: "system" }
    }
  ];

  private static audits: ScheduleAuditMetadata[] = [
    {
      id: "audit_sc_01",
      scheduleId: "sched_full_weekly_01",
      action: "CREATE",
      actor: "initial_setup",
      timestamp: new Date("2026-06-01T08:00:00Z"),
      changes: { current: "initial state" },
      metadata: {}
    }
  ];

  async saveSchedule(schedule: ScheduledWorkflow): Promise<ScheduledWorkflow> {
    const idx = MockScheduledWorkflowRepository.schedules.findIndex(s => s.id === schedule.id);
    if (idx !== -1) {
      MockScheduledWorkflowRepository.schedules[idx] = { ...schedule, updatedAt: new Date() };
      return MockScheduledWorkflowRepository.schedules[idx];
    } else {
      MockScheduledWorkflowRepository.schedules.push(schedule);
      return schedule;
    }
  }

  async getScheduleById(id: string): Promise<ScheduledWorkflow | null> {
    const s = MockScheduledWorkflowRepository.schedules.find(item => item.id === id);
    return s ? { ...s } : null;
  }

  async listSchedules(): Promise<ScheduledWorkflow[]> {
    return [...MockScheduledWorkflowRepository.schedules];
  }

  async saveRun(run: ScheduledWorkflowRun): Promise<ScheduledWorkflowRun> {
    const idx = MockScheduledWorkflowRepository.runs.findIndex(r => r.id === run.id);
    if (idx !== -1) {
      MockScheduledWorkflowRepository.runs[idx] = { ...run };
      return MockScheduledWorkflowRepository.runs[idx];
    } else {
      MockScheduledWorkflowRepository.runs.push(run);
      return run;
    }
  }

  async getRunById(id: string): Promise<ScheduledWorkflowRun | null> {
    const r = MockScheduledWorkflowRepository.runs.find(item => item.id === id);
    return r ? { ...r } : null;
  }

  async listRunsByScheduleId(scheduleId: string): Promise<ScheduledWorkflowRun[]> {
    return MockScheduledWorkflowRepository.runs.filter(r => r.scheduledWorkflowId === scheduleId);
  }

  async listAllRuns(limit?: number): Promise<ScheduledWorkflowRun[]> {
    const sorted = [...MockScheduledWorkflowRepository.runs].sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    if (limit !== undefined) {
      return sorted.slice(0, limit);
    }
    return sorted;
  }

  async saveAudit(audit: ScheduleAuditMetadata): Promise<ScheduleAuditMetadata> {
    MockScheduledWorkflowRepository.audits.push(audit);
    return audit;
  }

  async listAuditsByScheduleId(scheduleId: string): Promise<ScheduleAuditMetadata[]> {
    return MockScheduledWorkflowRepository.audits.filter(a => a.scheduleId === scheduleId);
  }
}
