export enum ScheduleStatus {
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  DISABLED = "DISABLED",
  FAILED = "FAILED"
}

export enum ScheduleTriggerType {
  manual = "manual",
  cron = "cron",
  systemd_timer = "systemd_timer",
  github_actions = "github_actions",
  external = "external"
}

export type ScheduledWorkflowType = 
  | "FULL_WEEKLY_RESEARCH"
  | "IMPORT_ONLY"
  | "FEATURE_REFRESH_ONLY"
  | "RECOMMENDATION_ONLY"
  | "SIMULATION_ONLY"
  | "REPORT_ONLY"
  | "EXPORT_ONLY";

export interface ScheduledWorkflow {
  id: string;
  name: string;
  description: string;
  workflowType: ScheduledWorkflowType;
  season: string;
  week: number;
  scheduleExpression: string;
  scheduleTimezone: string;
  status: ScheduleStatus;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastRunAt: Date | null;
  nextRunAt: Date | null;
  metadata: Record<string, any>;
}

export interface ScheduledWorkflowRun {
  id: string;
  scheduledWorkflowId: string;
  workflowRunId: string | null;
  triggerType: ScheduleTriggerType;
  status: "pending" | "running" | "completed" | "failed";
  startedAt: Date;
  completedAt: Date | null;
  errorMessage: string | null;
  metadata: Record<string, any>;
}

export interface ScheduleAuditMetadata {
  id: string;
  scheduleId: string;
  action: string;
  actor: string;
  timestamp: Date;
  changes: Record<string, any>;
  metadata: Record<string, any>;
}

export interface ScheduleDefinition {
  name: string;
  description: string;
  workflowType: ScheduledWorkflowType;
  season: string;
  week: number;
  scheduleExpression: string;
  scheduleTimezone?: string;
  metadata?: Record<string, any>;
}

// DTOs Map cleanly to serialize across Express boundaries with strings instead of native Dates if needed
export interface ScheduledWorkflowDTO {
  id: string;
  name: string;
  description: string;
  workflowType: string;
  season: string;
  week: number;
  scheduleExpression: string;
  scheduleTimezone: string;
  status: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastRunAt: string | null;
  nextRunAt: string | null;
  metadata: Record<string, any>;
}

export interface ScheduledWorkflowRunDTO {
  id: string;
  scheduledWorkflowId: string;
  workflowRunId: string | null;
  triggerType: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  metadata: Record<string, any>;
}

export interface ScheduleAuditMetadataDTO {
  id: string;
  scheduleId: string;
  action: string;
  actor: string;
  timestamp: string;
  changes: Record<string, any>;
  metadata: Record<string, any>;
}

export interface ScheduleDefinitionDTO {
  name: string;
  description: string;
  workflowType: string;
  season: string;
  week: number;
  scheduleExpression: string;
  scheduleTimezone?: string;
  metadata?: Record<string, any>;
}
