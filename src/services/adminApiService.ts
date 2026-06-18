import {
  SystemHealthResponse,
  SystemStatusResponse,
  SystemVersionResponse,
  BuildInfoResponse,
  DatabaseStatusResponse,
  WorkflowRun,
  WorkflowSummaryResponse,
  WeeklyReport,
  ResearchArtifact
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
  }
};
