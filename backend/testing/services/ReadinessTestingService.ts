import { WorkflowTestingService } from "./WorkflowTestingService";
import { SchedulerTestingService } from "./SchedulerTestingService";
import { IngestionTestingService } from "./IngestionTestingService";
import { ReportingTestingService } from "./ReportingTestingService";
import { ExportTestingService } from "./ExportTestingService";
import { 
  SystemReadinessScorecard, 
  WorkflowTestResult, 
  SchedulerTestResult, 
  IngestionTestResult, 
  ReportingTestResult, 
  ExportTestResult 
} from "../models";

export class ReadinessTestingService {
  /**
   * Run ALL structural subsystem validations to calculate preseason certification readiness scorecard
   */
  static async runFullCertification(): Promise<SystemReadinessScorecard> {
    const workflowResult = await this.runWorkflowTests();
    const schedulerResult = await this.runSchedulerTests();
    const ingestionResult = await this.runIngestionTests();
    const reportingResult = await this.runReportingTests();
    const exportResult = await this.runExportTests();

    return this.buildReadinessScorecard(
      workflowResult,
      schedulerResult,
      ingestionResult,
      reportingResult,
      exportResult
    );
  }

  /**
   * Runs workflow subsystem test runner
   */
  static async runWorkflowTests(): Promise<WorkflowTestResult> {
    return await WorkflowTestingService.validateWorkflowSubsystem();
  }

  /**
   * Runs scheduler subsystem test runner
   */
  static async runSchedulerTests(): Promise<SchedulerTestResult> {
    return await SchedulerTestingService.validateSchedulerSubsystem();
  }

  /**
   * Runs data ingestion subsystem test runner
   */
  static async runIngestionTests(): Promise<IngestionTestResult> {
    return await IngestionTestingService.validateIngestionSubsystem();
  }

  /**
   * Runs reports metadata and generation test runner
   */
  static async runReportingTests(): Promise<ReportingTestResult> {
    return await ReportingTestingService.validateReportingSubsystem();
  }

  /**
   * Runs exports format compiler test runner
   */
  static async runExportTests(): Promise<ExportTestResult> {
    return await ExportTestingService.validateExportSubsystem();
  }

  /**
   * Synthesizes and scores all five subsystems into a preseason certification scorecard
   */
  static buildReadinessScorecard(
    workflowResult: WorkflowTestResult,
    schedulerResult: SchedulerTestResult,
    ingestionResult: IngestionTestResult,
    reportingResult: ReportingTestResult,
    exportResult: ExportTestResult
  ): SystemReadinessScorecard {
    const workflowScore = workflowResult.score;
    const schedulerScore = schedulerResult.score;
    const ingestionScore = ingestionResult.score;
    const reportingScore = reportingResult.score;
    const exportScore = exportResult.score;

    // Weight allocations:
    // Workflow: 25% | Scheduler: 20% | Ingestion: 20% | Reporting: 15% | Export: 20%
    const weightedScore = 
      (workflowScore * 0.25) +
      (schedulerScore * 0.20) +
      (ingestionScore * 0.20) +
      (reportingScore * 0.15) +
      (exportScore * 0.20);

    const overallScore = Math.min(100, Math.max(0, Math.round(weightedScore)));

    // Readiness Status calculations:
    let overallStatus: "READY" | "NEEDS_ATTENTION" | "NOT_READY" = "READY";
    if (overallScore < 70) {
      overallStatus = "NOT_READY";
    } else if (overallScore < 90) {
      overallStatus = "NEEDS_ATTENTION";
    }

    // Force NOT_READY/NEEDS_ATTENTION if any vital subsystem is broken as a safety measure
    const anyFailed = 
      workflowResult.status === "FAILED" || 
      schedulerResult.status === "FAILED" || 
      ingestionResult.status === "FAILED" || 
      reportingResult.status === "FAILED" || 
      exportResult.status === "FAILED";

    if (anyFailed && overallStatus === "READY") {
      overallStatus = "NEEDS_ATTENTION";
    }

    // Warnings collection
    const warnings: string[] = [];
    if (workflowResult.status === "FAILED") warnings.push("Workflow execution checks flagged failures.");
    if (schedulerResult.status === "FAILED") warnings.push("Scheduled automation validation has errors.");
    if (ingestionResult.status === "FAILED") warnings.push("Data ingestion payload parses failed.");
    if (reportingResult.status === "FAILED") warnings.push("Weekly reports builder generated errors.");
    if (exportResult.status === "FAILED") warnings.push("DOCX/HTML compilers are experiencing rendering issues.");

    // Dynamic environment checklist warnings:
    if (process.env.USE_MOCK !== "false") {
      warnings.push("Platform is running in sandbox MODE with database memory mock active (USE_MOCK is true).");
    }

    // Recommendations collection
    const recommendations: string[] = [];
    
    if (overallStatus === "READY") {
      recommendations.push("Subsystem tests passed. Platform meets ALL performance parameters for the 2026 NFL Season.");
    }
    
    if (process.env.USE_MOCK !== "false") {
      recommendations.push("Proceed with PostgreSQL relational database cutover checks to secure persistent state storage.");
    } else {
      recommendations.push("PostgreSQL is connected! Configure additional daily backup scripts to protect live SQL records.");
    }

    if (workflowResult.score < 100) {
      recommendations.push("Analyze Workflow testing logs to verify idempotency or state tracking rules.");
    }
    if (schedulerResult.score < 100) {
      recommendations.push("Inspect scheduler registries to ensure timezone configurations align with America/New_York.");
    }
    if (ingestionResult.score < 100) {
      recommendations.push("Update data adapter ingestion sources to map proper third-party public rest URLs.");
    }
    if (reportingResult.score < 100) {
      recommendations.push("Verify that seeded rosters and game lines are fully stored before generating reports.");
    }
    if (exportResult.score < 100) {
      recommendations.push("Run a local test compile for docx-appendix sections to identify custom character escape bugs.");
    }

    return {
      overallStatus,
      overallScore,
      workflowScore,
      schedulerScore,
      ingestionScore,
      reportingScore,
      exportScore,
      workflowResult,
      schedulerResult,
      ingestionResult,
      reportingResult,
      exportResult,
      warnings,
      recommendations,
      generatedAt: new Date().toISOString()
    };
  }
}
