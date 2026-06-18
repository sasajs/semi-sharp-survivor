import {
  SystemHealthResponse,
  SystemStatusResponse,
  SystemVersionResponse,
  BuildInfoResponse,
  DatabaseStatusResponse,
  WorkflowRun,
  WorkflowSummaryResponse,
  WeeklyReport,
  ResearchArtifact,
  ScheduledWorkflow,
  ScheduledWorkflowRun,
  IngestionSource,
  IngestionJob,
  IngestionRun
} from "../types/admin";

export const adminApiService = {
  async fetchHealth(): Promise<SystemHealthResponse> {
    const res = await fetch("/api/system/health");
    if (!res.ok) throw new Error("Failed to fetch system health status");
    return res.json();
  },

  async fetchStatus(): Promise<SystemStatusResponse> {
    const res = await fetch("/api/system/status");
    if (!res.ok) throw new Error("Failed to fetch system status");
    return res.json();
  },

  async fetchVersion(): Promise<SystemVersionResponse> {
    const res = await fetch("/api/system/version");
    if (!res.ok) throw new Error("Failed to fetch product version information");
    return res.json();
  },

  async fetchBuildInfo(): Promise<BuildInfoResponse> {
    const res = await fetch("/api/system/build-info");
    if (!res.ok) throw new Error("Failed to fetch system build/artifact information");
    return res.json();
  },

  async fetchDatabaseStatus(): Promise<DatabaseStatusResponse> {
    const res = await fetch("/api/system/database");
    if (!res.ok) throw new Error("Failed to fetch relational database metrics");
    return res.json();
  },

  async fetchWorkflowRuns(): Promise<WorkflowRun[]> {
    const res = await fetch("/api/orchestration/workflows/runs");
    if (!res.ok) throw new Error("Failed to fetch recent workflow logs/runs");
    return res.json();
  },

  async fetchWorkflowSummaries(): Promise<WorkflowSummaryResponse> {
    const res = await fetch("/api/orchestration/workflows/summaries");
    if (!res.ok) throw new Error("Failed to fetch workflow execution statistics");
    return res.json();
  },

  async executeWorkflow(payload: {
    contestId: string;
    legId: string;
    workflow_type?: string;
    strategy_profile?: string;
  }): Promise<WorkflowRun> {
    const res = await fetch("/api/orchestration/workflows/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to trigger workflow execution run");
    }
    return res.json();
  },

  async fetchReports(): Promise<WeeklyReport[]> {
    const res = await fetch("/api/system/reports");
    if (!res.ok) throw new Error("Failed to fetch available weekly reports");
    return res.json();
  },

  async fetchArtifacts(): Promise<ResearchArtifact[]> {
    const res = await fetch("/api/system/exports/artifacts");
    if (!res.ok) throw new Error("Failed to fetch compiled export artifacts");
    return res.json();
  },

  async fetchSchedules(): Promise<ScheduledWorkflow[]> {
    const res = await fetch("/api/scheduler/schedules");
    if (!res.ok) throw new Error("Failed to fetch scheduled workflows list");
    return res.json();
  },

  async createSchedule(payload: {
    name: string;
    description: string;
    workflowType: string;
    season: string;
    week: number;
    scheduleExpression: string;
    scheduleTimezone: string;
  }): Promise<ScheduledWorkflow> {
    const res = await fetch("/api/scheduler/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create new scheduled workflow");
    }
    return res.json();
  },

  async enableSchedule(id: string): Promise<ScheduledWorkflow> {
    const res = await fetch(`/api/scheduler/schedules/${id}/enable`, { method: "POST" });
    if (!res.ok) throw new Error(`Failed to enable schedule: ${id}`);
    return res.json();
  },

  async disableSchedule(id: string): Promise<ScheduledWorkflow> {
    const res = await fetch(`/api/scheduler/schedules/${id}/disable`, { method: "POST" });
    if (!res.ok) throw new Error(`Failed to disable schedule: ${id}`);
    return res.json();
  },

  async pauseSchedule(id: string): Promise<ScheduledWorkflow> {
    const res = await fetch(`/api/scheduler/schedules/${id}/pause`, { method: "POST" });
    if (!res.ok) throw new Error(`Failed to pause schedule: ${id}`);
    return res.json();
  },

  async triggerSchedule(id: string): Promise<ScheduledWorkflowRun> {
    const res = await fetch(`/api/scheduler/schedules/${id}/trigger`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `Failed to manually trigger schedule: ${id}`);
    }
    return res.json();
  },

  async fetchScheduleRuns(id: string): Promise<ScheduledWorkflowRun[]> {
    const res = await fetch(`/api/scheduler/schedules/${id}/runs`);
    if (!res.ok) throw new Error(`Failed to fetch runs for schedule: ${id}`);
    return res.json();
  },

  async fetchIngestionSources(): Promise<IngestionSource[]> {
    const res = await fetch("/api/ingestion/sources");
    if (!res.ok) throw new Error("Failed to fetch data ingestion sources");
    return res.json();
  },

  async enableIngestionSource(id: string): Promise<IngestionSource> {
    const res = await fetch(`/api/ingestion/sources/${id}/enable`, { method: "POST" });
    if (!res.ok) throw new Error(`Failed to enable source: ${id}`);
    return res.json();
  },

  async disableIngestionSource(id: string): Promise<IngestionSource> {
    const res = await fetch(`/api/ingestion/sources/${id}/disable`, { method: "POST" });
    if (!res.ok) throw new Error(`Failed to disable source: ${id}`);
    return res.json();
  },

  async fetchIngestionJobs(): Promise<IngestionJob[]> {
    const res = await fetch("/api/ingestion/jobs");
    if (!res.ok) throw new Error("Failed to fetch data ingestion jobs");
    return res.json();
  },

  async triggerIngestionJob(id: string): Promise<IngestionRun> {
    const res = await fetch(`/api/ingestion/jobs/${id}/run`, { method: "POST" });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || `Failed to trigger ingestion job runs: ${id}`);
    }
    return res.json();
  },

  async fetchIngestionRuns(): Promise<IngestionRun[]> {
    const res = await fetch("/api/ingestion/runs");
    if (!res.ok) throw new Error("Failed to fetch recent ingestion run histories");
    return res.json();
  }
};
