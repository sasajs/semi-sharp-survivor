import { HealthStatus, HealthState } from "../models";
import { contestRepo, modelPerformanceRepo, learningRepo, recommendationEvolutionRepo, survivorStrategyRoadmapRepo } from "../../repositories";
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
import { DecisionAnalyticsService } from "../../services/DecisionAnalyticsService";
import { ModelPerformanceService } from "../../services/ModelPerformanceService";
import { LearningService } from "../../services/LearningService";
import { survivorStrategyService } from "../../services/SurvivorStrategyService";
import { survivorRoadmapService } from "../../services/SurvivorRoadmapService";
import { holidayReservationService } from "../../services/HolidayReservationService";
import { ownerService } from "../../services/OwnerService";

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

    let decisionAnalyticsState = HealthState.HEALTHY;
    let decisionAnalyticsMessage: string | null = null;

    let modelPerformanceRepositoryState = HealthState.HEALTHY;
    let modelPerformanceRepositoryMessage: string | null = null;

    let modelPerformanceServiceState = HealthState.HEALTHY;
    let modelPerformanceServiceMessage: string | null = null;

    let learningRepositoryState = HealthState.HEALTHY;
    let learningRepositoryMessage: string | null = null;

    let learningServiceState = HealthState.HEALTHY;
    let learningServiceMessage: string | null = null;

    let recommendationEvolutionState = HealthState.HEALTHY;
    let recommendationEvolutionMessage: string | null = null;

    let survivorStrategyRoadmapRepositoryState = HealthState.HEALTHY;
    let survivorStrategyRoadmapRepositoryMessage: string | null = null;

    let survivorStrategyServiceState = HealthState.HEALTHY;
    let survivorStrategyServiceMessage: string | null = null;

    let survivorRoadmapServiceState = HealthState.HEALTHY;
    let survivorRoadmapServiceMessage: string | null = null;

    let holidayReservationServiceState = HealthState.HEALTHY;
    let holidayReservationServiceMessage: string | null = null;

    let ownerServiceState = HealthState.HEALTHY;
    let ownerServiceMessage: string | null = null;

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

    // 7b. Decision Analytics & Continuous Learning check
    try {
      if (typeof DecisionAnalyticsService.getLatestSummaries !== "function") {
        throw new Error("DecisionAnalyticsService is not loaded properly.");
      }
      await DecisionAnalyticsService.getLatestSummaries();
    } catch (err: any) {
      decisionAnalyticsState = HealthState.UNHEALTHY;
      decisionAnalyticsMessage = `Decision Analytics Service error: ${err.message}`;
    }

    // 7c. Model Performance Repository check
    try {
      const summaries = await modelPerformanceRepo.getSummaries();
      if (!Array.isArray(summaries)) {
        throw new Error("Repository returned non-array dataset.");
      }
    } catch (err: any) {
      modelPerformanceRepositoryState = HealthState.DEGRADED;
      modelPerformanceRepositoryMessage = `Model Performance Repository failure: ${err.message}`;
    }

    // 7d. Model Performance Service check
    try {
      if (typeof ModelPerformanceService.getAnalytics !== "function") {
        throw new Error("ModelPerformanceService is not loaded properly.");
      }
      await ModelPerformanceService.getAnalytics();
    } catch (err: any) {
      modelPerformanceServiceState = HealthState.UNHEALTHY;
      modelPerformanceServiceMessage = `Model Performance Service error: ${err.message}`;
    }

    // 7e. Learning Repository check
    try {
      const trends = await learningRepo.getLearningTrends();
      if (!Array.isArray(trends)) {
        throw new Error("Repository returned non-array dataset.");
      }
    } catch (err: any) {
      learningRepositoryState = HealthState.DEGRADED;
      learningRepositoryMessage = `Learning Repository failure: ${err.message}`;
    }

    // 7f. Learning Service check
    try {
      if (typeof LearningService.getAnalytics !== "function") {
        throw new Error("LearningService is not loaded properly.");
      }
      await LearningService.getAnalytics();
    } catch (err: any) {
      learningServiceState = HealthState.UNHEALTHY;
      learningServiceMessage = `Learning Service error: ${err.message}`;
    }

    // 7g. Recommendation Evolution Repository check (V056)
    try {
      const summaries = await recommendationEvolutionRepo.getSummaries();
      if (!Array.isArray(summaries)) {
        throw new Error("Repository returned non-array dataset.");
      }
    } catch (err: any) {
      recommendationEvolutionState = HealthState.DEGRADED;
      recommendationEvolutionMessage = `Recommendation Evolution Repository failure: ${err.message}`;
    }

    // Survivor Strategy & Roadmap Repository check
    try {
      const allStrats = await survivorStrategyRoadmapRepo.getAllStrategies();
      if (!Array.isArray(allStrats)) {
        throw new Error("Repository returned non-array strategy dataset.");
      }
    } catch (err: any) {
      survivorStrategyRoadmapRepositoryState = HealthState.DEGRADED;
      survivorStrategyRoadmapRepositoryMessage = `Survivor Strategy Roadmap Repository failure: ${err.message}`;
    }

    // Survivor Strategy Service check
    try {
      if (typeof survivorStrategyService.assignStrategy !== "function") {
        throw new Error("assignStrategy method is uninitialized in runtime.");
      }
    } catch (err: any) {
      survivorStrategyServiceState = HealthState.UNHEALTHY;
      survivorStrategyServiceMessage = `Survivor Strategy Service error: ${err.message}`;
    }

    // Survivor Roadmap Service check
    try {
      if (typeof survivorRoadmapService.generateRoadmap !== "function") {
        throw new Error("generateRoadmap method is uninitialized in runtime.");
      }
    } catch (err: any) {
      survivorRoadmapServiceState = HealthState.UNHEALTHY;
      survivorRoadmapServiceMessage = `Survivor Roadmap Service error: ${err.message}`;
    }

    // Holiday Reservation Service check
    try {
      if (typeof holidayReservationService.generateReservations !== "function") {
        throw new Error("generateReservations method is uninitialized in runtime.");
      }
    } catch (err: any) {
      holidayReservationServiceState = HealthState.UNHEALTHY;
      holidayReservationServiceMessage = `Holiday Reservation Service error: ${err.message}`;
    }

    // Owner Service check
    try {
      if (typeof ownerService.getOwnerDashboard !== "function") {
        throw new Error("getOwnerDashboard method is uninitialized in runtime.");
      }
    } catch (err: any) {
      ownerServiceState = HealthState.UNHEALTHY;
      ownerServiceMessage = `Owner Service error: ${err.message}`;
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
      ingestionState,
      decisionAnalyticsState,
      modelPerformanceServiceState,
      learningServiceState,
      survivorStrategyServiceState,
      survivorRoadmapServiceState,
      holidayReservationServiceState,
      ownerServiceState
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
      modelPerformanceRepositoryState === HealthState.DEGRADED ||
      learningRepositoryState === HealthState.DEGRADED ||
      recommendationEvolutionState === HealthState.DEGRADED ||
      survivorStrategyRoadmapRepositoryState === HealthState.DEGRADED ||
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
        remoteAccessLayer: { status: remoteAccessState, message: remoteAccessMessage },
        decisionAnalytics: { status: decisionAnalyticsState, message: decisionAnalyticsMessage },
        modelPerformanceRepository: { status: modelPerformanceRepositoryState, message: modelPerformanceRepositoryMessage },
        modelPerformanceService: { status: modelPerformanceServiceState, message: modelPerformanceServiceMessage },
        learningRepository: { status: learningRepositoryState, message: learningRepositoryMessage },
        learningService: { status: learningServiceState, message: learningServiceMessage },
        recommendationEvolution: { status: recommendationEvolutionState, message: recommendationEvolutionMessage },
        survivorStrategyRoadmapRepository: { status: survivorStrategyRoadmapRepositoryState, message: survivorStrategyRoadmapRepositoryMessage },
        survivorStrategyService: { status: survivorStrategyServiceState, message: survivorStrategyServiceMessage },
        survivorRoadmapService: { status: survivorRoadmapServiceState, message: survivorRoadmapServiceMessage },
        holidayReservationService: { status: holidayReservationServiceState, message: holidayReservationServiceMessage },
        ownerService: { status: ownerServiceState, message: ownerServiceMessage }
      },
      timestamp
    };
  }
}
