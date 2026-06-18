import { HealthStatus, HealthState } from "../models";
import { contestRepo } from "../../repositories";
import { WorkflowStatusService } from "../../orchestration/services/WorkflowStatusService";
import { MonteCarloSurvivorService } from "../../simulation/services/MonteCarloSurvivorService";
import { WeeklyReportService } from "../../reports/services/WeeklyReportService";
import { ResearchArtifactService } from "../../exports/services/ResearchArtifactService";
import { DatabaseHealthService } from "../../database/services/DatabaseHealthService";
import { getSchedulerRepository } from "../../scheduler/services/ScheduleAuditService";

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

    // Resolve overall health status
    let overallHealth = HealthState.HEALTHY;

    const anyUnhealthy = [
      workflowEngineState,
      monteCarloState,
      weeklyReportState,
      researchExportState,
      schedulerState
    ].some(state => state === HealthState.UNHEALTHY);

    if (anyUnhealthy || dbHealth.status === "unhealthy") {
      overallHealth = HealthState.UNHEALTHY;
    } else if (repositoryState === HealthState.DEGRADED || dbHealth.status === "degraded") {
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
        schedulerLayer: { status: schedulerState, message: schedulerMessage }
      },
      timestamp
    };
  }
}
