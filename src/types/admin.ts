export interface SystemHealthResponse {
  healthy: boolean;
  timestamp: string;
  services: {
    database: { status: "healthy" | "unhealthy" | "mock"; error: string | null; latencyMs: number };
    scheduler: { status: "healthy" | "unhealthy"; tasksActive: number };
    disk: { status: "healthy" | "unhealthy"; freeBytes: number; totalBytes: number };
    memory: { status: "healthy" | "unhealthy"; freeBytes: number; totalBytes: number };
  };
  checksRun: number;
}

export interface SystemStatusResponse {
  applicationState: string;
  uptime: number; // process uptime in seconds
  uptimeSeconds: number;
  startedAt: string;
  environment: string;
  validation: {
    passed: boolean;
    timestamp: string;
    checks: Array<{
      component: string;
      status: "passed" | "failed" | "warning";
      message?: string;
    }>;
  };
}

export interface SystemVersionResponse {
  semisharpVersion: string;
  nodeVersion: string;
  apiVersion: string;
}

export interface BuildInfoResponse {
  commitRef: string;
  commitTimestamp: string;
  compiledAt: string;
  environment: string;
}

export interface DatabaseStatusResponse {
  connected: boolean;
  databaseType: "postgres" | "mock";
  poolActive: number;
  poolIdle: number;
  migrationVersion: string;
  healthy: boolean;
}

export interface WorkflowStep {
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  started_at?: string;
  completed_at?: string;
  error?: string | null;
}

export interface WorkflowRun {
  id: string;
  idempotency_key: string;
  type: string;
  status: "pending" | "running" | "completed" | "failed";
  context: {
    contestId: string;
    legId: string;
    weekNumber?: number;
    [key: string]: any;
  };
  steps: WorkflowStep[];
  logs: string[];
  created_at: string;
  completed_at?: string | null;
}

export interface WorkflowSummaryResponse {
  totalRuns: number;
  successCount: number;
  failureCount: number;
  runningCount: number;
  byType: Record<string, number>;
}

export interface WeeklyReport {
  id: string;
  contest_id: string;
  contest_leg_id: string;
  week_number: number;
  executive_summary: {
    top_recommended_pick: { team_id: string; team_name: string };
    alternate_picks: Array<{ team_id: string; team_name: string }>;
    confidence_tier: "High" | "Medium" | "Low";
    key_risk_warnings: string[];
    key_inventory_warning: string | null;
    strategy_recommendation: string;
  };
  recommended_picks: Array<{
    team_id: string;
    team_name: string;
    win_probability: number;
    pick_popularity: number;
    contest_equity_score: number;
    leverage_score: number;
    future_value_score: number;
    risk_score: number;
    confidence_tier: string;
    rationale?: string;
  }>;
  risk_summary: {
    rest_risk: number;
    injury_risk: number;
    travel_risk: number;
    confidence_tier: string;
  };
  inventory_summary: {
    used_teams: string[];
    available_teams: string[];
    remaining_elite_teams: string[];
  };
  created_at: string;
  audit_metadata?: {
    hash: string;
    signatures: string[];
    timestamp: string;
  };
}

export interface ResearchArtifact {
  id: string;
  title: string;
  report_id: string;
  generated_at: string;
  sections: {
    title_page: { content: string };
    executive_summary: { content: string };
    recommended_picks: { content: string };
    risk_summary: { content: string };
    inventory_summary: { content: string };
    simulation_summary: { content: string };
    appendix_audit: { content: string };
  };
  audit_metadata?: {
    report_id: string;
    export_hash: string;
    timestamp: string;
    signatures: string[];
  };
}

export interface ScheduledWorkflow {
  id: string;
  name: string;
  description: string;
  workflowType: string;
  season: string;
  week: number;
  scheduleExpression: string;
  scheduleTimezone: string;
  status: "ACTIVE" | "PAUSED" | "DISABLED" | "FAILED";
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastRunAt: string | null;
  nextRunAt: string | null;
  metadata: Record<string, any>;
}

export interface ScheduledWorkflowRun {
  id: string;
  scheduledWorkflowId: string;
  workflowRunId: string | null;
  triggerType: "manual" | "cron" | "systemd_timer" | "github_actions" | "external";
  status: "pending" | "running" | "completed" | "failed";
  startedAt: string;
  completedAt: string | null;
  errorMessage: string | null;
  metadata: Record<string, any>;
}
