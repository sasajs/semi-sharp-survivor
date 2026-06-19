import { HealthStatus, HealthState } from "../models";
import { contestRepo } from "../../repositories";
import { WorkflowStatusService } from "../../orchestration/services/WorkflowStatusService";
import { MonteCarloSurvivorService } from "../../simulation/services/MonteCarloSurvivorService";
import { WeeklyReportService } from "../../reports/services/WeeklyReportService";
import { ResearchArtifactService } from "../../exports/services/ResearchArtifactService";
import { DatabaseHealthService } from "../../database/services/DatabaseHealthService";
import { getSchedulerRepository } from "../../scheduler/services/ScheduleAuditService";
import { getIngestionRepository, DataIngestionService } from "../../ingestion/services/DataIngestionService";
import { AdapterRegistryService } from "../../ingestion/services/AdapterRegistryService";
import { PostgresValidationService } from "../../postgres/services/PostgresValidationService";
import { ReadinessTestingService } from "../../testing/services/ReadinessTestingService";
import { HistoricalReplayService } from "../../replay/services/HistoricalReplayService";
import { WeeklyPipelineService } from "../../pipeline/services/WeeklyPipelineService";
import { AuthService } from "../../auth/services/AuthService";
import { RemoteAccessStatusService } from "./RemoteAccessStatusService";

export class HealthCheckService {
  /**
   * Performs dynamic check runs across all layers of the application stack.
   */
  static async checkSystemHealth(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();
    
    let repositoryState = HealthState.HEALTHY;
    let repositoryMessage: string | null = null;
    
    let workflowEngineState = HealthState.HEALTHY;
    let workflowEngineMessage: string | null = null;
    
    let monteCarloState = HealthState.HEALTHY;
    let monteCarloMessage: string | null = null;
    
    let weeklyReportState = HealthState.HEALTHY;
    let weeklyReportMessage: string | null = null;
    
    let researchExportState = HealthState.HEALTHY;
    let researchExportMessage: string | null = null;

    let schedulerState = HealthState.HEALTHY;
    let schedulerMessage: string | null = null;

    let ingestionState = HealthState.HEALTHY;
    let ingestionMessage: string | null = null;

    // 1. Repository check
    try {
      const contests = await contestRepo.getAll();
      if (!Array.isArray(contests)) {
        throw new Error("Repository returned non-array dataset.");
      }
    } catch (err: any) {
      repositoryState = HealthState.DEGRADED;
      repositoryMessage = `Database/Repository failure: ${err.message}`;
    }

    // 1b. Real Database Health Check
    let dbHealth;
    try {
      dbHealth = await DatabaseHealthService.checkHealth();
    } catch (err: any) {
      dbHealth = { status: "unhealthy", mode: "postgres", connection: { status: "offline", error: err.message } };
    }

    // 2. Workflow Orchestration Engine check
    try {
      if (typeof WorkflowStatusService.getWorkflowExecutionSummaries !== "function") {
        throw new Error("Workflow services are uninitialized in runtime.");
      }
      await WorkflowStatusService.getWorkflowExecutionSummaries();
    } catch (err: any) {
      workflowEngineState = HealthState.UNHEALTHY;
      workflowEngineMessage = `Workflow Orchestrator failed: ${err.message}`;
    }

    // 3. Monte Carlo Engine check
    try {
      if (typeof MonteCarloSurvivorService.runPortfolioSimulation !== "function") {
        throw new Error("Monte Carlo Simulation Engine is absent from modules.");
      }
    } catch (err: any) {
      monteCarloState = HealthState.UNHEALTHY;
      monteCarloMessage = `Monte Carlo engine offline: ${err.message}`;
    }

    // 4. Weekly Report Engine check
    try {
      if (typeof WeeklyReportService.generateWeeklyReport !== "function") {
        throw new Error("Weekly Report generator is absent or unconfigured.");
      }
    } catch (err: any) {
      weeklyReportState = HealthState.UNHEALTHY;
      weeklyReportMessage = `Report Service error: ${err.message}`;
    }

    // 5. Research Export Engine check
    try {
      if (typeof ResearchArtifactService.createResearchArtifact !== "function") {
        throw new Error("Research Export runner is not ready or configured.");
      }
    } catch (err: any) {
      researchExportState = HealthState.UNHEALTHY;
      researchExportMessage = `Export Service error: ${err.message}`;
    }

    // 6. Scheduler Layer check
    try {
      const schRepo = getSchedulerRepository();
      if (!schRepo) {
        throw new Error("Scheduler repository interface is uninitialized.");
      }
      const list = await schRepo.listSchedules();
      if (!Array.isArray(list)) {
        throw new Error("Database reference did not return a valid list of active schedules.");
      }
    } catch (err: any) {
      schedulerState = HealthState.UNHEALTHY;
      schedulerMessage = `Scheduler system check failure: ${err.message}`;
    }

    // 7. Ingestion Layer check
    try {
      const ingRepo = getIngestionRepository();
      if (!ingRepo) {
        throw new Error("Ingestion repository interface resolve failed.");
      }
      
      const adapters = AdapterRegistryService.listAdapters();
      if (!Array.isArray(adapters) || adapters.length === 0) {
        throw new Error("Ingestion adapter registry returned empty or non-array collection.");
      }

      if (typeof DataIngestionService.listSources !== "function") {
        throw new Error("DataIngestionService module services failed initialization.");
      }
    } catch (err: any) {
      ingestionState = HealthState.UNHEALTHY;
      ingestionMessage = `Data Ingestion Engine failure: ${err.message}`;
    }

    // 8. Postgres Readiness Layer check
    let postgresReadinessState: "HEALTHY" | "WARNING" | "FAILED" = "HEALTHY";
    let postgresReadinessMessage: string | null = null;
    try {
      const vResult = PostgresValidationService.runValidation();
      postgresReadinessState = vResult.overallStatus;
      if (postgresReadinessState === "FAILED") {
        postgresReadinessMessage = "PostgreSQL readiness failures flagged.";
      } else if (postgresReadinessState === "WARNING") {
        postgresReadinessMessage = "PostgreSQL validation has configuration warnings (e.g., using mock mode).";
      } else {
        postgresReadinessMessage = "Verify complete: platform is fully ready for PostgreSQL cutover.";
      }
    } catch (err: any) {
      postgresReadinessState = "FAILED";
      postgresReadinessMessage = `Validation pipeline execution crash: ${err.message}`;
    }

    // 9. Preseason Readiness Validation check
    let preseasonStatus: "HEALTHY" | "WARNING" | "FAILED" = "HEALTHY";
    let preseasonMessage: string | null = null;
    try {
      const scorecard = await ReadinessTestingService.runFullCertification();
      if (scorecard.overallStatus === "READY") {
        preseasonStatus = "HEALTHY";
        preseasonMessage = `Readiness certification PASSED with a score of ${scorecard.overallScore}/100. READY for 2026 Season.`;
      } else if (scorecard.overallStatus === "NEEDS_ATTENTION") {
        preseasonStatus = "WARNING";
        preseasonMessage = `Readiness certification flagged: NEEDS_ATTENTION with a score of ${scorecard.overallScore}/100.`;
      } else {
        preseasonStatus = "FAILED";
        preseasonMessage = `Readiness certification FAILED. NOT_READY for the season (Score: ${scorecard.overallScore}/100).`;
      }
    } catch (err: any) {
      preseasonStatus = "FAILED";
      preseasonMessage = `Preseason certification calculation crashed: ${err.message}`;
    }

    // 10. Historical Replay Layer check
    let historicalReplayState: "HEALTHY" | "WARNING" | "FAILED" = "HEALTHY";
    let historicalReplayMessage: string | null = null;
    try {
      const seasons = HistoricalReplayService.getAvailableSeasons();
      if (seasons.length > 0) {
        historicalReplayState = "HEALTHY";
        historicalReplayMessage = `Historical Replay engine active with ${seasons.length} seasons seeded for backtesting.`;
      } else {
        historicalReplayState = "WARNING";
        historicalReplayMessage = "Historical Replay engine active but find no seeded seasons.";
      }
    } catch (err: any) {
      historicalReplayState = "FAILED";
      historicalReplayMessage = `Historical Replay engine failed diagnostics: ${err.message}`;
    }

    // 11. Automated Weekly Research Pipeline check
    let weeklyPipelineState: "HEALTHY" | "WARNING" | "FAILED" = "HEALTHY";
    let weeklyPipelineMessage: string | null = null;
    try {
      const history = WeeklyPipelineService.getPipelineHistory();
      if (history.length > 0) {
        weeklyPipelineState = "HEALTHY";
        weeklyPipelineMessage = `Pipeline engine fully functional. ${history.length} runs recorded in memory.`;
      } else {
        weeklyPipelineState = "WARNING";
        weeklyPipelineMessage = "Pipeline engine active with no historical execution runs recorded.";
      }
    } catch (err: any) {
      weeklyPipelineState = "FAILED";
      weeklyPipelineMessage = `Weekly pipeline engine check failed: ${err.message}`;
    }

    // 12. Administrative Access Layer check
    let authState: "HEALTHY" | "DISABLED" | "WARNING" | "FAILED" = "DISABLED";
    let authMessage: string | null = null;
    try {
      const enabled = AuthService.isAuthEnabled();
      if (!enabled) {
        authState = "DISABLED";
        authMessage = "Administrative access authentication is disabled (AUTH_ENABLED=false).";
      } else {
        const configuredPassword = process.env.ADMIN_PASSWORD;
        if (configuredPassword && configuredPassword !== "admin_test_password") {
          authState = "HEALTHY";
          authMessage = "Administrative access enabled and secured via custom password.";
        } else if (configuredPassword === "admin_test_password" || !configuredPassword) {
          authState = "WARNING";
          authMessage = "Administrative authentication is enabled, but utilizing default or empty credentials.";
        }
      }
    } catch (err: any) {
      authState = "FAILED";
      authMessage = `Auth Layer check failed: ${err.message}`;
    }

    // 13. Remote Access Layer check
    let remoteAccessState: "DISABLED" | "READY" | "WARNING" | "FAILED" = "DISABLED";
    let remoteAccessMessage: string | null = null;
    try {
      const remoteStatus = RemoteAccessStatusService.getStatus();
      if (remoteStatus.cloudflareTunnelConfigured || remoteStatus.tailscaleConfigured) {
        remoteAccessState = "READY";
        remoteAccessMessage = "Secure remote access tunnel active and configured.";
      } else {
        remoteAccessState = "WARNING";
        remoteAccessMessage = "Remote access is not configured. The system is only accessible locally or via LAN.";
      }
    } catch (err: any) {
      remoteAccessState = "WARNING";
      remoteAccessMessage = `Failed to resolve remote access status: ${err.message}`;
    }

    // Resolve overall health status
    let overallHealth = HealthState.HEALTHY;

    const anyUnhealthy = [
      workflowEngineState,
      monteCarloState,
      weeklyReportState,
      researchExportState,
      schedulerState,
      ingestionState
    ].some(state => state === HealthState.UNHEALTHY);

    if (
      anyUnhealthy ||
      dbHealth.status === "unhealthy" ||
      preseasonStatus === "FAILED" ||
      historicalReplayState === "FAILED" ||
      weeklyPipelineState === "FAILED" ||
      authState === "FAILED"
    ) {
      overallHealth = HealthState.UNHEALTHY;
    } else if (
      repositoryState === HealthState.DEGRADED ||
      dbHealth.status === "degraded" ||
      preseasonStatus === "WARNING" ||
      historicalReplayState === "WARNING" ||
      weeklyPipelineState === "WARNING" ||
      authState === "WARNING"
    ) {
      overallHealth = HealthState.DEGRADED;
    }

    return {
      overallHealth,
      serviceChecks: {
        repositoryLayer: { status: repositoryState, message: repositoryMessage },
        databaseLayer: dbHealth as any, // Integrated subordinate dependency metric
        workflowEngine: { status: workflowEngineState, message: workflowEngineMessage },
        monteCarloEngine: { status: monteCarloState, message: monteCarloMessage },
        weeklyReportEngine: { status: weeklyReportState, message: weeklyReportMessage },
        researchExportEngine: { status: researchExportState, message: researchExportMessage },
        schedulerLayer: { status: schedulerState, message: schedulerMessage },
        ingestionLayer: { status: ingestionState, message: ingestionMessage },
        postgresReadinessLayer: { status: postgresReadinessState, message: postgresReadinessMessage },
        preseasonReadinessLayer: { status: preseasonStatus, message: preseasonMessage },
        historicalReplayLayer: { status: historicalReplayState, message: historicalReplayMessage },
        weeklyPipelineLayer: { status: weeklyPipelineState, message: weeklyPipelineMessage },
        authLayer: { status: authState, message: authMessage },
        remoteAccessLayer: { status: remoteAccessState, message: remoteAccessMessage }
      },
      timestamp
    };
  }
}
