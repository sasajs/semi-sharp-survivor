import { HealthStatus, HealthState } from "../models";
import { contestRepo } from "../../repositories";
import { WorkflowStatusService } from "../../orchestration/services/WorkflowStatusService";
import { MonteCarloSurvivorService } from "../../simulation/services/MonteCarloSurvivorService";
import { WeeklyReportService } from "../../reports/services/WeeklyReportService";
import { ResearchArtifactService } from "../../exports/services/ResearchArtifactService";

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

    // 2. Workflow Orchestration Engine check
    try {
      if (typeof WorkflowStatusService.getWorkflowExecutionSummaries !== "function") {
        throw new Error("Workflow services are uninitialized in runtime.");
      }
      // Simple lookup test
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

    // Resolve overall health status
    let overallHealth = HealthState.HEALTHY;

    const anyUnhealthy = [
      workflowEngineState,
      monteCarloState,
      weeklyReportState,
      researchExportState
    ].some(state => state === HealthState.UNHEALTHY);

    if (anyUnhealthy) {
      overallHealth = HealthState.UNHEALTHY;
    } else if (repositoryState === HealthState.DEGRADED) {
      overallHealth = HealthState.DEGRADED;
    }

    return {
      overallHealth,
      serviceChecks: {
        repositoryLayer: { status: repositoryState, message: repositoryMessage },
        workflowEngine: { status: workflowEngineState, message: workflowEngineMessage },
        monteCarloEngine: { status: monteCarloState, message: monteCarloMessage },
        weeklyReportEngine: { status: weeklyReportState, message: weeklyReportMessage },
        researchExportEngine: { status: researchExportState, message: researchExportMessage }
      },
      timestamp
    };
  }
}
