import { 
  ScheduledWorkflow, 
  ScheduledWorkflowRun, 
  ScheduleAuditMetadata 
} from "../models";

export interface IScheduledWorkflowRepository {
  saveSchedule(schedule: ScheduledWorkflow): Promise<ScheduledWorkflow>;
  getScheduleById(id: string): Promise<ScheduledWorkflow | null>;
  listSchedules(): Promise<ScheduledWorkflow[]>;
  saveRun(run: ScheduledWorkflowRun): Promise<ScheduledWorkflowRun>;
  getRunById(id: string): Promise<ScheduledWorkflowRun | null>;
  listRunsByScheduleId(scheduleId: string): Promise<ScheduledWorkflowRun[]>;
  listAllRuns(limit?: number): Promise<ScheduledWorkflowRun[]>;
  saveAudit(audit: ScheduleAuditMetadata): Promise<ScheduleAuditMetadata>;
  listAuditsByScheduleId(scheduleId: string): Promise<ScheduleAuditMetadata[]>;
}
