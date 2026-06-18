import { StartupValidationResult } from "../models";
import { contestRepo } from "../../repositories";
import { WorkflowOrchestratorService } from "../../orchestration/services/WorkflowOrchestratorService";
import { WeeklyReportService } from "../../reports/services/WeeklyReportService";
import { ResearchArtifactService } from "../../exports/services/ResearchArtifactService";

export class StartupValidationService {
  private static validationCache: StartupValidationResult | null = null;

  /**
   * Performs critical platform configuration & dependency engine testing.
   */
  static async validateAll(): Promise<StartupValidationResult> {
    const timestamp = new Date().toISOString();
    const details: string[] = [];
    
    let repositoriesOk = false;
    let workflowEngineOk = false;
    let reportEngineOk = false;
    let exportEngineOk = false;

    // 1. Verify Repository Integrity (Safe against PostgreSQL offline)
    try {
      // Perform a light query to verify repository loading and connectivity
      const contests = await contestRepo.getAll();
      repositoriesOk = Array.isArray(contests);
      details.push(`[Startup Validation] Repositories loaded successfully. Found ${contests.length} contest entries.`);
    } catch (dbErr: any) {
      // Do not crash startup with Postgres connection errors; report and degrade
      repositoriesOk = false;
      details.push(`[Startup Validation] Repositories warning: Database check failed. Postgres may be offline, falling back or waiting. Error: ${dbErr.message}`);
    }

    // 2. Validate Workflow Engine Availability
    try {
      if (typeof WorkflowOrchestratorService.startWorkflowExecution === "function") {
        workflowEngineOk = true;
        details.push("[Startup Validation] Workflow Orchestration Engine is fully initialized and registered.");
      } else {
        throw new Error("startWorkflowExecution method is missing.");
      }
    } catch (wfErr: any) {
      workflowEngineOk = false;
      details.push(`[Startup Validation] Workflow Engine failed: ${wfErr.message}`);
    }

    // 3. Validate Weekly Report Engine
    try {
      if (typeof WeeklyReportService.generateWeeklyReport === "function") {
        reportEngineOk = true;
        details.push("[Startup Validation] Weekly Report Engine is active and correctly loaded.");
      } else {
        throw new Error("generateWeeklyReport method is missing.");
      }
    } catch (repErr: any) {
      reportEngineOk = false;
      details.push(`[Startup Validation] Report Engine failed: ${repErr.message}`);
    }

    // 4. Validate Export Services
    try {
      if (typeof ResearchArtifactService.createResearchArtifact === "function") {
        exportEngineOk = true;
        details.push("[Startup Validation] Research Export Generation system is healthy.");
      } else {
        throw new Error("createResearchArtifact method is missing.");
      }
    } catch (expErr: any) {
      exportEngineOk = false;
      details.push(`[Startup Validation] Export Engine failed: ${expErr.message}`);
    }

    // Determine overall initialization state
    // We strictly do NOT fail startup solely because Postgres / database repository connection tests fail.
    // Therefore, overall initialization is TRUE if code engines are loaded correctly.
    const overallInitialized = workflowEngineOk && reportEngineOk && exportEngineOk;

    const result: StartupValidationResult = {
      initialized: overallInitialized,
      timestamp,
      components: {
        repositories: repositoriesOk,
        workflowEngine: workflowEngineOk,
        reportEngine: reportEngineOk,
        exportEngine: exportEngineOk
      },
      details
    };

    // Log the startup results to console/syslog
    console.log(`=== APPLICATION STARTUP VALIDATION (${overallInitialized ? "SUCCESS" : "DEGRADED"}) ===`);
    details.forEach(line => console.log(line));
    console.log("==================================================");

    this.validationCache = result;
    return result;
  }

  /**
   * Retrieves previous validator records.
   */
  static getCachedValidationResult(): StartupValidationResult | null {
    return this.validationCache;
  }
}
