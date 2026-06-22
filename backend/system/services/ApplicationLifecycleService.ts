import { 
  ApplicationStatus, 
  ApplicationState, 
  StartupValidationResult 
} from "../models";
import { StartupValidationService } from "./StartupValidationService";
import { BuildMetadataService } from "./BuildMetadataService";
import { workflowRunRepo, systemMetadataRepo, operationsEventsRepo } from "../../repositories";
import { WorkflowStatus } from "../../orchestration/models";
import { PostgresConnectionManager } from "../../database/connection/PostgresConnectionManager";
import os from "os";
import { databaseConfig } from "../../config/database";

export class ApplicationLifecycleService {
  private static currentState: ApplicationState = ApplicationState.STARTING;
  private static startedAt: string | null = null;
  private static shutdownAt: string | null = null;
  private static startupValidation: StartupValidationResult | null = null;

  /**
   * Safe bootstrapper performing configuration checks and initiating lifecycle state.
   */
  static async initializeLifecycle(): Promise<void> {
    if (this.startedAt) return; // Prevent double trigger

    this.startedAt = new Date().toISOString();
    this.currentState = ApplicationState.STARTING;
    console.log(`[Lifecycle Engine] Initiating application startup sequence [Version: ${BuildMetadataService.getVersions().applicationVersion}]`);

    try {
      // Execute Startup Checks
      const validation = await StartupValidationService.validateAll();
      this.startupValidation = validation;

      if (validation.initialized) {
        this.currentState = ApplicationState.RUNNING;
        console.log("[Lifecycle Engine] Application successfully validated and transitioned to RUNNING state.");

        // Record startup system metadata & insert operations log event
        try {
          let dbName = "mock-sandbox";
          if (!databaseConfig.useMock) {
            try {
              const urlParts = new URL(databaseConfig.databaseUrl);
              dbName = urlParts.pathname.substring(1) || "postgres";
            } catch {
              dbName = "postgres";
            }
          }

          const hostname = os.hostname();
          const currentVersion = "v0.27";
          const branch = process.env.GIT_BRANCH || "main";
          const tag = process.env.GIT_TAG || "v0.27-project-memory-foundation";

          console.log(`[Lifecycle Engine] Writing operational system metadata [Host: ${hostname}, DB: ${dbName}]`);
          await systemMetadataRepo.save({
            systemName: "Semi-Sharp",
            currentVersion,
            currentGitBranch: branch,
            currentGitTag: tag,
            deploymentEnvironment: databaseConfig.useMock ? "production-mock" : (process.env.NODE_ENV || "production"),
            serverHostname: hostname,
            databaseName: dbName,
            lastStartupTimestamp: this.startedAt || new Date().toISOString()
          });

          await operationsEventsRepo.create({
            eventType: "Application Startup",
            severity: "INFO",
            source: "system-lifecycle",
            description: `Application boot completed successfully in ${databaseConfig.useMock ? "MOCK" : "POSTGRES"} mode under version ${currentVersion}.`,
            metadataJson: {
              version: currentVersion,
              hostname,
              mode: databaseConfig.useMock ? "mock" : "postgres",
              startedAt: this.startedAt,
              validation: validation.components
            }
          });
        } catch (metadataErr: any) {
          console.error(`[Lifecycle Engine] Non-blocking exception writing system metadata or startup event: ${metadataErr.message}`);
        }
      } else {
        this.currentState = ApplicationState.FAILED;
        console.warn("[Lifecycle Engine] Application is running in a degraded/failed initial state.");
      }
    } catch (err: any) {
      this.currentState = ApplicationState.FAILED;
      console.error(`[Lifecycle Engine] Fatal exception during validation sequence: ${err.message}`);
    }

    // Bind Process Signal Listeners (SIGINT / SIGTERM) for Graceful Shutdown
    process.on("SIGINT", () => {
      console.log("[Lifecycle Engine] SIGINT signal intercepted.");
      this.gracefulShutdown("SIGINT");
    });

    process.on("SIGTERM", () => {
      console.log("[Lifecycle Engine] SIGTERM signal intercepted.");
      this.gracefulShutdown("SIGTERM");
    });
  }

  /**
   * Shuts down resources and ensures active runs complete if possible before exiting.
   */
  static async gracefulShutdown(triggerSignal: string): Promise<void> {
    if (this.currentState === ApplicationState.STOPPING || this.currentState === ApplicationState.STOPPED) {
      return;
    }

    console.log(`=== APPLICATION GRACEFUL SHUTDOWN INITIATED (${triggerSignal}) ===`);
    this.currentState = ApplicationState.STOPPING;
    this.shutdownAt = new Date().toISOString();

    try {
      // 1. Wait for active workflow executions to finish where possible
      const runs = await workflowRunRepo.listRuns();
      const activeRuns = runs.filter(r => r.status === WorkflowStatus.RUNNING);

      if (activeRuns.length > 0) {
        console.log(`[Lifecycle Engine] Warning: Found ${activeRuns.length} active workflow executions in progress.`);
        console.log("[Lifecycle Engine] Waiting briefly (max 3 seconds) for active threads to complete...");
        
        // Polling wait loop (max 3 seconds)
        const checkInterval = 250;
        const maxWaitMs = 3000;
        let waitedMs = 0;

        while (waitedMs < maxWaitMs) {
          const freshRuns = await workflowRunRepo.listRuns();
          const runningCount = freshRuns.filter(r => r.status === WorkflowStatus.RUNNING).length;
          
          if (runningCount === 0) {
            console.log("[Lifecycle Engine] All active workflow executions finalized successfully.");
            break;
          }
          
          await new Promise(resolve => setTimeout(resolve, checkInterval));
          waitedMs += checkInterval;
        }

        // Fetch final status
        const postRuns = await workflowRunRepo.listRuns();
        const remaining = postRuns.filter(r => r.status === WorkflowStatus.RUNNING);
        if (remaining.length > 0) {
          console.warn(`[Lifecycle Engine] Warning: ${remaining.length} runs did not complete within the shutdown grace period.`);
          // Auto-fail outstanding to avoid hanging zombie records
          for (const rm of remaining) {
            rm.status = WorkflowStatus.FAILED;
            rm.errorMessage = `Workflow terminated abruptly by system shutdown event (${triggerSignal}).`;
            await workflowRunRepo.updateRun(rm);
          }
        }
      } else {
        console.log("[Lifecycle Engine] No active workflows are performing calculations. Safe for immediate exit.");
      }

      // 2. Shut down database connections
      try {
        await PostgresConnectionManager.getInstance().closePool();
      } catch (poolErr: any) {
        console.error("[Lifecycle Engine] Error shutting down database pool connection layer:", poolErr.message);
      }

      this.currentState = ApplicationState.STOPPED;
      console.log(`[Lifecycle Audit] Shutdown audit recorded:
  - Startup Time: ${this.startedAt}
  - Shutdown Time: ${this.shutdownAt}
  - Version: ${BuildMetadataService.getVersions().applicationVersion}
  - Environment: ${process.env.NODE_ENV || "development"}
  - Validations run: ${this.startupValidation?.initialized ? "SUCCESS" : "REJECTED"}
`);
      
      console.log("=== APPLICATION SHUTDOWN COMPLETED SUCCESSFULLY ===");
      process.exit(0);

    } catch (shutdownErr: any) {
      console.error(`[Lifecycle Engine] Error during graceful shutdown handler: ${shutdownErr.message}`);
      this.currentState = ApplicationState.FAILED;
      process.exit(1);
    }
  }

  /**
   * Retrieves full aggregated live system status block.
   */
  static getApplicationStatus(): ApplicationStatus {
    const uptimeSeconds = this.startedAt 
      ? Math.floor((Date.now() - new Date(this.startedAt).getTime()) / 1000)
      : 0;

    return {
      applicationState: this.currentState,
      uptimeSeconds,
      startedAt: this.startedAt,
      environment: process.env.NODE_ENV || "development",
      validation: this.startupValidation
    };
  }
}
